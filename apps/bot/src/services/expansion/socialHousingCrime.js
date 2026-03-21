const { HOUSE_STYLES, formatCoins } = require("./shared");
const { formatDuration } = require("../../utils/formatters");

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function text(language, vi, en) {
  return isVietnameseLanguage(language) ? vi : en;
}

const socialHousingCrimeMethods = {
  async handleMarry(context) {
    return this.db.withTransaction(async (tx) => {
      const language = this.resolveLanguage(context);
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) {
        throw new Error(text(language, "Tag ai đó để cưới đi. Hỗn loạn nên có nhân chứng.", "Tag someone to marry. Chaos is better with witnesses."));
      }
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error(
          text(
            language,
            "Tự cưới chính mình thì để gương xử lý, không phải bot.",
            "Self-marriage is between you and your reflection, not the bot."
          )
        );
      }

      const actor = await this.getActorUser(context, tx);
      const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
      const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const actorState = stateMap.get(Number(actor.id));
      const targetState = stateMap.get(Number(targetUser.id));
      const activeLanguage = this.resolveLanguage(context, actorState);

      if (actorState.systems.social.partnerUserId || targetState.systems.social.partnerUserId) {
        throw new Error(
          text(
            activeLanguage,
            "Một trong hai người đã có gia đình rồi. Giấy tờ kiểu này rất toang.",
            "One of you is already married. This is a paperwork nightmare."
          )
        );
      }

      actorState.systems.social.partnerUserId = targetUser.id;
      targetState.systems.social.partnerUserId = actor.id;
      actorState.systems.social.familyBlessing += 1;
      targetState.systems.social.familyBlessing += 1;

      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);
      await this.playerStateRepository.saveState(targetUser.id, targetState.systems, targetState.settings, tx);

      return {
        title: text(activeLanguage, "Đăng Ký Kết Hôn", "Marriage Registered"),
        description: text(
          activeLanguage,
          `**${context.message.author.username}** và **${targetDiscordUser.username}** giờ đã chính thức kết hôn trong sổ hỗn loạn.`,
          `**${context.message.author.username}** and **${targetDiscordUser.username}** are now officially married in the chaos ledger.`
        ),
        fields: [
          {
            name: text(activeLanguage, "Phúc Gia Đình", "Family Blessing"),
            value: text(activeLanguage, "+1 cho mỗi người", "+1 for each partner"),
            inline: true
          }
        ]
      };
    });
  },

  async handleDivorce(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const partnerUserId = state.systems.social.partnerUserId;
      if (!partnerUserId) {
        throw new Error(text(language, "Hiện tại bạn chưa kết hôn.", "You are not married right now."));
      }

      const partnerState = await this.playerStateRepository.getState(partnerUserId, tx, { forUpdate: true });
      state.systems.social.partnerUserId = null;
      partnerState.systems.social.partnerUserId = null;

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      await this.playerStateRepository.saveState(partnerUserId, partnerState.systems, partnerState.settings, tx);

      const partner = await this.userRepository.findById(partnerUserId, tx);
      return {
        title: text(language, "Đơn Ly Hôn Đã Nộp", "Divorce Filed"),
        description: text(
          language,
          `Giấy tờ đã ký xong. Bạn và **${partner?.username || "người cũ của bạn"}** chính thức đường ai nấy đi.`,
          `The papers are signed. You and **${partner?.username || "your former partner"}** have split.`
        ),
        fields: [
          {
            name: text(language, "Trạng Thái", "Status"),
            value: text(language, "Độc thân và vẫn hoạt động tốt", "Single and operational"),
            inline: true
          }
        ]
      };
    });
  },

  async handleFamily(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, state);
      const partnerUserId = state.systems.social.partnerUserId;
      const users = await this.userRepository.getUsersByIds([partnerUserId].filter(Boolean), tx);
      const usersById = new Map(users.map((user) => [Number(user.id), user]));

      return {
        title: text(language, "Bảng Gia Đình", "Family Panel"),
        description: text(
          language,
          "Buff gia đình, chỉ số tình cảm và toàn bộ hỗn loạn đã được thuần hóa ở một chỗ.",
          "Household buffs, romance stats, and domesticated chaos in one place."
        ),
        fields: [
          {
            name: text(language, "Bạn Đời", "Partner"),
            value: this.getPartnerLabel(usersById, partnerUserId, language),
            inline: true
          },
          {
            name: text(language, "Phúc Gia Đình", "Family Blessing"),
            value: `${state.systems.social.familyBlessing}`,
            inline: true
          },
          {
            name: text(language, "Quà Đã Tặng", "Gifts Sent"),
            value: `${state.systems.social.giftsSent}`,
            inline: true
          },
          {
            name: text(language, "Quà Đã Nhận", "Gifts Received"),
            value: `${state.systems.social.giftsReceived}`,
            inline: true
          },
          {
            name: text(language, "Độ Ấm Nhà Cửa", "Home Comfort"),
            value: `${state.systems.housing.comfort}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleHouse(context) {
    const args = this.cleanArgs(context.args);
    const subcommand = this.normalizeAnswer(args[0] || "view");
    if (subcommand === "buy") return this.handleHouseBuy(context);
    if (subcommand === "upgrade") return this.handleHouseUpgrade(context);

    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, state);
      const house = state.systems.housing;
      const style = HOUSE_STYLES[house.style];
      const styleLabel = this.getLocalizedHouseLabel(style, language);

      return {
        title: text(language, "Bảng Nhà Ở", "Housing Panel"),
        description: house.owned
          ? text(
              language,
              `Bạn đang sở hữu **${styleLabel}** ở bậc **${house.tier}**. Nó toát ra năng lượng cày cuốc cực mạnh.`,
              `You own a **${styleLabel}** at tier **${house.tier}**. It radiates grindset decor.`
            )
          : text(
              language,
              "Bạn chưa có nhà theo nghĩa trong game. Dùng `Nhouse buy [shack|loft|manor]`.",
              "You are houseless in the game sense. Use `Nhouse buy [shack|loft|manor]`."
            ),
        fields: [
          {
            name: text(language, "Phong Cách", "Style"),
            value: styleLabel,
            inline: true
          },
          {
            name: text(language, "Bậc", "Tier"),
            value: `${house.tier}`,
            inline: true
          },
          {
            name: text(language, "Thoải Mái", "Comfort"),
            value: `${house.comfort}`,
            inline: true
          },
          {
            name: text(language, "Trang Trí", "Decorations"),
            value: house.decorations.length ? house.decorations.join(", ") : text(language, "Chưa có gì", "None yet"),
            inline: false
          }
        ]
      };
    });
  },

  async handleHouseBuy(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const args = this.cleanArgs(context.args);
      const styleKey = this.normalizeAnswer(args[1] || "shack");
      const style = HOUSE_STYLES[styleKey];
      const styleLabel = this.getLocalizedHouseLabel(style, language);

      if (!style) throw new Error(text(language, "Chọn kiểu nhà: `shack`, `loft`, hoặc `manor`.", "Pick a house style: `shack`, `loft`, or `manor`."));
      if (state.systems.housing.owned) {
        throw new Error(text(language, "Bạn đã có nhà rồi. Nâng cấp nó đi.", "You already own a house. Upgrade it instead."));
      }
      if (Number(summary.wallet) < style.buyCost) {
        throw new Error(text(language, `${styleLabel} có giá ${formatCoins(style.buyCost)}.`, `${styleLabel} costs ${formatCoins(style.buyCost)}.`));
      }

      await this.economyRepository.mutateWallet(actor.id, -style.buyCost, "house_buy", tx);
      state.systems.housing.owned = true;
      state.systems.housing.style = styleKey;
      state.systems.housing.tier = 1;
      state.systems.housing.comfort = 12;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Đã Mua Nhà", "House Purchased"),
        description: text(
          language,
          `Bạn đã mua **${styleLabel}** và lập tức coi nó như chỉ số endgame.`,
          `You bought a **${styleLabel}** and immediately started treating it like an endgame stat stick.`
        ),
        fields: [
          {
            name: text(language, "Chi Phí", "Cost"),
            value: formatCoins(style.buyCost),
            inline: true
          },
          {
            name: text(language, "Thoải Mái", "Comfort"),
            value: `${state.systems.housing.comfort}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleHouseUpgrade(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const house = state.systems.housing;
      if (!house.owned) throw new Error(text(language, "Mua nhà trước bằng `Nhouse buy` đi.", "Buy a house first with `Nhouse buy`."));

      const style = HOUSE_STYLES[house.style];
      const styleLabel = this.getLocalizedHouseLabel(style, language);
      const cost = style.upgradeBase + house.tier * 1250;
      if (Number(summary.wallet) < cost) {
        throw new Error(text(language, `Nâng cấp này tốn ${formatCoins(cost)}.`, `This upgrade costs ${formatCoins(cost)}.`));
      }

      await this.economyRepository.mutateWallet(actor.id, -cost, "house_upgrade", tx);
      house.tier += 1;
      house.comfort += 14;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Đã Nâng Cấp Nhà", "House Upgraded"),
        description: text(
          language,
          `${styleLabel} vừa được makeover với mức giá cực nguy hiểm.`,
          `${styleLabel} received a dangerously expensive makeover.`
        ),
        fields: [
          {
            name: text(language, "Bậc Mới", "New Tier"),
            value: `${house.tier}`,
            inline: true
          },
          {
            name: text(language, "Thoải Mái", "Comfort"),
            value: `${house.comfort}`,
            inline: true
          },
          {
            name: text(language, "Chi Phí", "Cost"),
            value: formatCoins(cost),
            inline: true
          }
        ]
      };
    });
  },

  async handleDecorate(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      if (!state.systems.housing.owned) {
        throw new Error(
          text(
            language,
            "Mua nhà trước đi. Trang trí sàn nhà trong khoảng không không được tính.",
            "Buy a house first. Floor decorations in the void do not count."
          )
        );
      }

      const args = this.cleanArgs(context.args);
      const decoration = args.join(" ").trim();
      if (!decoration) {
        throw new Error(
          text(
            language,
            "Nói rõ món bạn muốn thêm đi. Ví dụ: `Ndecorate ghế lười neon`",
            "Tell me what decoration you are adding. Example: `Ndecorate neon beanbag`"
          )
        );
      }

      state.systems.housing.decorations.unshift(decoration);
      state.systems.housing.decorations = state.systems.housing.decorations.slice(0, 8);
      state.systems.housing.comfort += 5;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Đã Trang Trí Nhà", "House Decorated"),
        description: text(
          language,
          `Bạn đặt **${decoration}** vào phòng và căn nhà lập tức có thêm năng lượng cày cuốc.`,
          `You installed **${decoration}** and the room instantly gained grind energy.`
        ),
        fields: [
          {
            name: text(language, "Thoải Mái", "Comfort"),
            value: `${state.systems.housing.comfort}`,
            inline: true
          },
          {
            name: text(language, "Số Món Trang Trí", "Decor Count"),
            value: `${state.systems.housing.decorations.length}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleBounty(context) {
    return this.db.withTransaction(async (tx) => {
      const language = this.resolveLanguage(context);
      const t = this.getTranslator({ ...context, language });
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error(text(language, "Tag mục tiêu để treo thưởng.", "Tag a target to place a bounty."));
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error(
          text(
            language,
            "Treo thưởng lên chính mình đúng là tiếng kêu cứu trá hình.",
            "Putting a bounty on yourself is just a cry for help."
          )
        );
      }

      const actor = await this.getActorUser(context, tx);
      const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
      const actorSummary = await this.economyRepository.getSummary(actor.id, tx);
      const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const targetState = stateMap.get(Number(targetUser.id));
      const args = this.cleanArgs(context.args);
      const amount = this.parseAmount(args[1], 500, Number(actorSummary.wallet), t);

      if (amount <= 0) {
        throw new Error(text(language, "Tiền thưởng truy nã bắt đầu từ 1 coin. Nghiêm túc chút đi.", "Bounties start at 1 coin. Be serious."));
      }
      if (Number(actorSummary.wallet) < amount) {
        throw new Error(text(language, `Bạn cần ${formatCoins(amount)} trong ví.`, `You need ${formatCoins(amount)} in your wallet.`));
      }

      await this.economyRepository.mutateWallet(actor.id, -amount, "bounty_place", tx);
      targetState.systems.crime.bounty += amount;
      targetState.systems.crime.heat += 12;
      await this.playerStateRepository.saveState(targetUser.id, targetState.systems, targetState.settings, tx);

      return {
        title: text(language, "Đã Treo Thưởng", "Bounty Posted"),
        description: text(
          language,
          `Tiền thưởng ${formatCoins(amount)} giờ đang lơ lửng trên đầu **${targetDiscordUser.username}** như một đám mây rất hỗn.`,
          `A bounty of ${formatCoins(amount)} now hovers over **${targetDiscordUser.username}** like a very rude cloud.`
        ),
        fields: [
          {
            name: text(language, "Tiền Truy Nã Mục Tiêu", "Target Bounty"),
            value: formatCoins(targetState.systems.crime.bounty),
            inline: true
          },
          {
            name: text(language, "Mức Nóng Mục Tiêu", "Target Heat"),
            value: `${targetState.systems.crime.heat}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleSteal(context) {
    return this.db.withTransaction(async (tx) => {
      const language = this.resolveLanguage(context);
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error(text(language, "Tag ai đó để trộm.", "Tag someone to steal from."));
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error(text(language, "Ăn trộm của chính mình chỉ là đổi túi thôi.", "Stealing from yourself is just moving pockets."));
      }

      const actor = await this.getActorUser(context, tx);
      const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
      const actorSummary = await this.economyRepository.getSummary(actor.id, tx);
      const targetSummary = await this.economyRepository.getSummary(targetUser.id, tx);
      const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const actorState = stateMap.get(Number(actor.id));
      const activeLanguage = this.resolveLanguage(context, actorState);
      const t = this.getTranslator({ ...context, language: activeLanguage });

      this.assertNotJailed(actorState, t);
      const args = this.cleanArgs(context.args);
      const desiredAmount = this.parseAmount(
        args[1],
        Math.min(450, Number(targetSummary.wallet)),
        Number(targetSummary.wallet),
        t
      );
      const stealAmount = Math.min(desiredAmount, Number(targetSummary.wallet));
      if (stealAmount <= 0) {
        throw new Error(
          text(
            activeLanguage,
            "Mục tiêu đó không còn đồng nào để vắt nữa.",
            "That target has no wallet juice left."
          )
        );
      }

      const targetState = stateMap.get(Number(targetUser.id));
      const successChance = this.clamp(
        0.38 + Number(actorSummary.level) * 0.012 - targetState.systems.housing.comfort * 0.002,
        0.18,
        0.82
      );
      const success = this.roll(successChance);

      actorState.systems.crime.steals += 1;
      actorState.systems.crime.heat += success ? 9 : 24;

      let description;
      if (success) {
        await this.economyRepository.mutateWallet(actor.id, stealAmount, "steal_win", tx);
        await this.economyRepository.mutateWallet(targetUser.id, -stealAmount, "steal_loss", tx);
        description = text(
          activeLanguage,
          `Bạn cuỗm ${formatCoins(stealAmount)} từ **${targetDiscordUser.username}** rồi cắm đầu chạy vào màn sương.`,
          `You snagged ${formatCoins(stealAmount)} from **${targetDiscordUser.username}** and sprinted into the fog.`
        );
      } else if (this.roll(0.45)) {
        actorState.systems.crime.jailUntil = new Date(Date.now() + 20 * 60 * 1000).toISOString();
        description = text(
          activeLanguage,
          `Bạn bị bắt khi đang trộm của **${targetDiscordUser.username}** và bị ném thẳng vào tù.`,
          `You got caught trying to steal from **${targetDiscordUser.username}** and were launched directly into jail.`
        );
      } else {
        description = text(
          activeLanguage,
          "Cú trộm trượt hoàn toàn. Giờ ai cũng thấy mặt bạn rất đáng nghi.",
          "You whiffed the theft. Everyone is now extremely suspicious of your face."
        );
      }

      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);

      return {
        title: text(activeLanguage, "Pha Trộm Cắp", "Steal Attempt"),
        description,
        fields: [
          {
            name: text(activeLanguage, "Tỉ Lệ Thành Công", "Success Chance"),
            value: this.formatPercent(successChance),
            inline: true
          },
          {
            name: text(activeLanguage, "Mức Nóng Của Bạn", "Your Heat"),
            value: `${actorState.systems.crime.heat}`,
            inline: true
          },
          {
            name: text(activeLanguage, "Ví Mục Tiêu", "Target Wallet"),
            value: formatCoins(targetSummary.wallet),
            inline: true
          }
        ]
      };
    });
  },

  async handleArrest(context) {
    return this.db.withTransaction(async (tx) => {
      const language = this.resolveLanguage(context);
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error(text(language, "Tag ai đó để bắt.", "Tag someone to arrest."));
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error(
          text(
            language,
            "Tự bắt chính mình thì hiệu quả nhưng hơi kỳ.",
            "Arresting yourself would be efficient but weird."
          )
        );
      }

      const actor = await this.getActorUser(context, tx);
      const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
      const actorSummary = await this.economyRepository.getSummary(actor.id, tx);
      const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const actorState = stateMap.get(Number(actor.id));
      const targetState = stateMap.get(Number(targetUser.id));
      const activeLanguage = this.resolveLanguage(context, actorState);
      const t = this.getTranslator({ ...context, language: activeLanguage });

      this.assertNotJailed(actorState, t);
      if (targetState.systems.crime.bounty <= 0 && targetState.systems.crime.heat < 20) {
        throw new Error(
          text(
            activeLanguage,
            "Mục tiêu đó chưa đủ nóng để lĩnh tiền bắt.",
            "That target is not hot enough for an arrest payout."
          )
        );
      }

      const successChance = this.clamp(
        0.52 +
          Number(actorSummary.level) * 0.01 +
          actorState.systems.island.defense * 0.003 -
          targetState.systems.crime.heat * 0.001,
        0.2,
        0.88
      );
      const success = this.roll(successChance);

      if (success) {
        const payout = Math.max(160, targetState.systems.crime.bounty || targetState.systems.crime.heat * 8);
        await this.economyRepository.mutateWallet(actor.id, payout, "arrest_payout", tx);
        targetState.systems.crime.jailUntil = new Date(
          Date.now() + (15 + targetState.systems.crime.heat) * 60 * 1000
        ).toISOString();
        targetState.systems.crime.bounty = 0;
        targetState.systems.crime.heat = Math.max(0, targetState.systems.crime.heat - 20);
        actorState.systems.crime.arrests += 1;
        await this.playerStateRepository.saveState(targetUser.id, targetState.systems, targetState.settings, tx);
        await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);

        return {
          title: text(activeLanguage, "Bắt Giữ Thành Công", "Arrest Complete"),
          description: text(
            activeLanguage,
            `Bạn còng tay **${targetDiscordUser.username}** rồi lĩnh thưởng như một thợ săn tiền truy nã chính hiệu.`,
            `You slammed the cuffs on **${targetDiscordUser.username}** and cashed out like a bounty gremlin.`
          ),
          fields: [
            {
              name: text(activeLanguage, "Tiền Thưởng", "Payout"),
              value: formatCoins(payout),
              inline: true
            },
            {
              name: text(activeLanguage, "Thời Gian Tù Của Mục Tiêu", "Target Jail Time"),
              value: formatDuration(this.getJailMs(targetState)),
              inline: true
            },
            {
              name: text(activeLanguage, "Số Lần Bắt Của Bạn", "Your Arrests"),
              value: `${actorState.systems.crime.arrests}`,
              inline: true
            }
          ]
        };
      }

      actorState.systems.crime.heat += 10;
      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);

      return {
        title: text(activeLanguage, "Bắt Giữ Thất Bại", "Arrest Failed"),
        description: text(
          activeLanguage,
          `**${targetDiscordUser.username}** thoát khỏi pha bắt giữ và danh dự của bạn vỡ vụn theo.`,
          `**${targetDiscordUser.username}** escaped the arrest attempt and now your dignity is in pieces.`
        ),
        fields: [
          {
            name: text(activeLanguage, "Mức Nóng Của Bạn", "Your Heat"),
            value: `${actorState.systems.crime.heat}`,
            inline: true
          },
          {
            name: text(activeLanguage, "Tỉ Lệ Thành Công", "Success Chance"),
            value: this.formatPercent(successChance),
            inline: true
          }
        ]
      };
    });
  },

  async handleJail(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);
      const bundle = targetDiscordUser
        ? await this.getTargetBundle(targetDiscordUser, tx)
        : await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, bundle.state);
      const remaining = this.getJailMs(bundle.state);
      const username = targetDiscordUser ? targetDiscordUser.username : context.message.author.username;

      return {
        title: text(language, "Tình Trạng Tù", "Jail Status"),
        description:
          remaining > 0
            ? text(
                language,
                `**${username}** còn phải ngồi tù thêm **${formatDuration(remaining)}**.`,
                `**${username}** is jailed for another **${formatDuration(remaining)}**.`
              )
            : text(
                language,
                `**${username}** hiện đang tự do tiếp tục gây chuyện.`,
                `**${username}** is currently free to cause problems.`
              ),
        fields: [
          {
            name: text(language, "Mức Nóng", "Heat"),
            value: `${bundle.state.systems.crime.heat}`,
            inline: true
          },
          {
            name: text(language, "Tiền Truy Nã", "Bounty"),
            value: formatCoins(bundle.state.systems.crime.bounty),
            inline: true
          }
        ]
      };
    });
  },

  async handleEscape(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const remaining = this.getJailMs(state);
      if (remaining <= 0) throw new Error(text(language, "Hiện tại bạn đâu có ở tù.", "You are not in jail right now."));

      const chance = this.clamp(
        0.28 + state.systems.pet.stage * 0.07 + state.systems.housing.comfort * 0.002,
        0.2,
        0.8
      );
      const success = this.roll(chance);

      if (success) {
        state.systems.crime.jailUntil = null;
        state.systems.crime.escapes += 1;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: text(language, "Vượt Ngục Thành Công", "Escape Successful"),
          description: text(
            language,
            "Bạn lẻn qua lính canh rồi biến mất vào làn sương sữa.",
            "You slipped past the guards and vanished into the milk mist."
          ),
          fields: [
            {
              name: text(language, "Tỉ Lệ Vượt Ngục", "Escape Chance"),
              value: this.formatPercent(chance),
              inline: true
            },
            {
              name: text(language, "Tổng Lần Vượt Ngục", "Total Escapes"),
              value: `${state.systems.crime.escapes}`,
              inline: true
            }
          ]
        };
      }

      state.systems.crime.jailUntil = new Date(Date.now() + remaining + 8 * 60 * 1000).toISOString();
      state.systems.crime.heat += 6;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Vượt Ngục Thất Bại", "Escape Failed"),
        description: text(
          language,
          "Bạn mới đi được nửa kế hoạch thì đâm cả tường lẫn lính canh cùng lúc.",
          "You made it halfway through the plan before running into a wall and a guard at the same time."
        ),
        fields: [
          {
            name: text(language, "Thời Gian Tù Mới", "New Jail Time"),
            value: formatDuration(this.getJailMs(state)),
            inline: true
          },
          {
            name: text(language, "Mức Nóng", "Heat"),
            value: `${state.systems.crime.heat}`,
            inline: true
          }
        ]
      };
    });
  }
};

module.exports = { socialHousingCrimeMethods };
