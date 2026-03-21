const { PET_SPECIES, formatCoins, rarityEmoji } = require("./shared");
const { progressBar } = require("../../utils/formatters");

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function text(language, vi, en) {
  return isVietnameseLanguage(language) ? vi : en;
}

const fishingIslandPetMethods = {
  async handleDeepsea(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const t = this.getTranslator({ ...context, language });
      this.assertNotJailed(state, t);

      const catchData = this.buildLocalCatch("deepsea", state.systems.fishing.deepseaLevel, "abyss");
      await this.recordLocalCatch(actor.id, catchData, "deepsea", tx);
      await this.userRepository.addXp(actor.id, catchData.xp, tx);

      state.systems.fishing.deepseaCatches += 1;
      state.systems.fishing.deepseaLevel = Math.min(
        20,
        1 + Math.floor(state.systems.fishing.deepseaCatches / 5)
      );

      const stored =
        catchData.qualityScore >= 82 || catchData.isJackpot ? this.storeAquariumFish(state, catchData) : null;
      const coinBonus = Math.floor(catchData.estimatedValue * 0.25);
      await this.economyRepository.mutateWallet(actor.id, coinBonus, "deepsea_bonus", tx);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Chuyến Biển Sâu", "Deep Sea Run"),
        description: text(
          language,
          `${rarityEmoji(catchData.rarity)} **${catchData.speciesName}** trồi lên từ vực thẳm. ${catchData.flavorText}`,
          `${rarityEmoji(catchData.rarity)} **${catchData.speciesName}** surfaced from the abyss. ${catchData.flavorText}`
        ),
        fields: [
          {
            name: text(language, "Giá Trị Cá", "Catch Value"),
            value: formatCoins(catchData.estimatedValue),
            inline: true
          },
          {
            name: text(language, "Chất Lượng", "Quality"),
            value: `${catchData.qualityScore}/100`,
            inline: true
          },
          {
            name: text(language, "Thưởng Coin", "Coin Bonus"),
            value: formatCoins(coinBonus),
            inline: true
          },
          {
            name: text(language, "Cân Nặng / Chiều Dài", "Weight / Length"),
            value: `${catchData.weightKg}kg / ${catchData.lengthCm}cm`,
            inline: true
          },
          {
            name: text(language, "Cấp Biển Sâu", "Deep Sea Level"),
            value: `Lv.${state.systems.fishing.deepseaLevel}`,
            inline: true
          },
          {
            name: text(language, "Hồ Cá", "Aquarium"),
            value: stored?.stored
              ? stored.replaced
                ? text(language, `${stored.entry.name} đã thay một con yếu hơn trong hồ`, `${stored.entry.name} replaced a weaker tank fish`)
                : text(language, `${stored.entry.name} vừa vào hồ của bạn`, `${stored.entry.name} joined your tank`)
              : text(language, "Lượt này không có cá mới cho hồ", "No new aquarium fish this run"),
            inline: false
          }
        ],
        footer: catchData.isJackpot
          ? text(language, "Phát hiện ánh sáng thần thoại. Đại dương đang flex rất mạnh.", "Mythical glow detected. The ocean is clearly showing off.")
          : null
      };
    });
  },

  async handleNet(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const t = this.getTranslator({ ...context, language });
      this.assertNotJailed(state, t);

      const catchCount = 3 + Math.min(2, Math.floor(state.systems.fishing.netLevel / 4));
      const catches = [];
      let totalValue = 0;
      let totalXp = 0;

      for (let index = 0; index < catchCount; index += 1) {
        const catchData = this.buildLocalCatch("net", state.systems.fishing.netLevel, "shoal");
        catches.push(catchData);
        totalValue += catchData.estimatedValue;
        totalXp += Math.floor(catchData.xp * 0.7);
        await this.recordLocalCatch(actor.id, catchData, "net", tx);
      }

      const bestCatch = catches.reduce((best, current) =>
        current.estimatedValue > best.estimatedValue ? current : best
      );
      const stored = this.storeAquariumFish(state, bestCatch);
      const coinBonus = Math.floor(totalValue * 0.2);

      await this.economyRepository.mutateWallet(actor.id, coinBonus, "net_bonus", tx);
      await this.userRepository.addXp(actor.id, totalXp, tx);

      state.systems.fishing.netCasts += 1;
      state.systems.fishing.netLevel = Math.min(20, 1 + Math.floor(state.systems.fishing.netCasts / 4));
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      const summaryLines = catches
        .slice(0, 4)
        .map((entry) => `${rarityEmoji(entry.rarity)} ${entry.speciesName} (${formatCoins(entry.estimatedValue)})`)
        .join("\n");

      return {
        title: text(language, "Mẻ Lưới", "Net Haul"),
        description: text(
          language,
          `Bạn kéo lên cùng lúc **${catchCount}** con và phá hỏng hoàn toàn tâm trạng của đám cá quanh đây.`,
          `You dragged in **${catchCount}** catches at once and absolutely ruined the local fish mood.`
        ),
        fields: [
          {
            name: text(language, "Điểm Nhấn", "Highlights"),
            value: summaryLines,
            inline: false
          },
          {
            name: text(language, "Tổng Giá Trị Ước Tính", "Total Est. Value"),
            value: formatCoins(totalValue),
            inline: true
          },
          {
            name: text(language, "Thưởng Coin", "Coin Bonus"),
            value: formatCoins(coinBonus),
            inline: true
          },
          {
            name: "XP",
            value: `+${totalXp}`,
            inline: true
          },
          {
            name: text(language, "Cấp Lưới", "Net Level"),
            value: `Lv.${state.systems.fishing.netLevel}`,
            inline: true
          },
          {
            name: text(language, "Nâng Cấp Hồ Cá", "Aquarium Upgrade"),
            value: stored.replaced
              ? text(language, `${stored.entry.name} đã cướp một chỗ trong hồ`, `${stored.entry.name} stole a slot`)
              : text(language, `${stored.entry.name} đã được thêm vào`, `${stored.entry.name} was added`),
            inline: true
          }
        ]
      };
    });
  },

  async handleAquarium(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, state);
      const aquarium = state.systems.fishing.aquarium;

      return {
        title: text(language, "Hồ Cá", "Aquarium"),
        description: aquarium.length
          ? aquarium
              .map(
                (fish, index) =>
                  text(
                    language,
                    `**${index + 1}.** ${rarityEmoji(fish.rarity)} ${fish.name} | ${formatCoins(fish.value)} | chất lượng ${fish.quality} | đột biến ${fish.mutations}`,
                    `**${index + 1}.** ${rarityEmoji(fish.rarity)} ${fish.name} | ${formatCoins(fish.value)} | quality ${fish.quality} | mutations ${fish.mutations}`
                  )
              )
              .join("\n")
          : text(language, "Hồ cá của bạn đang trống. Ra biển quậy với `Ndeepsea` hoặc `Nnet` đi.", "Your aquarium is empty. Go bully the ocean with Ndeepsea or Nnet."),
        fields: [
          {
            name: text(language, "Sức Chứa", "Capacity"),
            value: `${aquarium.length}/6`,
            inline: true
          },
          {
            name: text(language, "Đã Thả", "Released"),
            value: `${state.systems.fishing.released}`,
            inline: true
          },
          {
            name: text(language, "Đột Biến", "Mutations"),
            value: `${state.systems.fishing.mutations}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleRelease(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const t = this.getTranslator({ ...context, language });
      const args = this.cleanArgs(context.args);
      const aquarium = state.systems.fishing.aquarium;

      if (!aquarium.length) {
        throw new Error(text(language, "Hồ cá của bạn không có gì để thả.", "There is nothing in your aquarium to release."));
      }

      const slot = this.parseCount(args[0], 1, 1, aquarium.length, t) - 1;
      const [releasedFish] = aquarium.splice(slot, 1);
      const releaseReward = Math.floor(releasedFish.value * 0.35) + releasedFish.mutations * 40;
      const keyDrop = this.roll(0.2) ? 1 : 0;

      await this.economyRepository.mutateWallet(actor.id, releaseReward, "aquarium_release", tx);
      state.systems.fishing.released += 1;
      state.systems.rewards.keys += keyDrop;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Bắt Rồi Thả", "Catch And Release"),
        description: text(
          language,
          `Bạn thả **${releasedFish.name}** về lại đại dương hỗn loạn và còn được tip vì quá có nghề.`,
          `You released **${releasedFish.name}** back into the chaos and got tipped for the drama.`
        ),
        fields: [
          {
            name: text(language, "Thưởng", "Reward"),
            value: formatCoins(releaseReward),
            inline: true
          },
          {
            name: text(language, "Số Đột Biến", "Mutation Count"),
            value: `${releasedFish.mutations}`,
            inline: true
          },
          {
            name: text(language, "Chìa Khóa Thưởng", "Bonus Key"),
            value: keyDrop
              ? text(language, "Rớt 1 chìa khóa", "1 key dropped")
              : text(language, "Lần này không có chìa", "No key this time"),
            inline: true
          }
        ]
      };
    });
  },

  async handleMutate(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const t = this.getTranslator({ ...context, language });
      const args = this.cleanArgs(context.args);
      const aquarium = state.systems.fishing.aquarium;

      if (!aquarium.length) {
        throw new Error(text(language, "Đột biến cái gì khi hồ cá của bạn trống trơn vậy?", "Mutate what? Your aquarium is spiritually empty."));
      }

      const slot = this.parseCount(args[0], 1, 1, aquarium.length, t) - 1;
      const fish = aquarium[slot];
      const cost = 450 + fish.mutations * 250;

      if (Number(summary.wallet) < cost) {
        throw new Error(text(language, `Keo đột biến giá ${formatCoins(cost)}.`, `Mutation goo costs ${formatCoins(cost)}.`));
      }

      await this.economyRepository.mutateWallet(actor.id, -cost, "fish_mutation", tx);
      fish.mutations += 1;
      fish.value += Math.floor(fish.value * (0.25 + Math.random() * 0.25));
      fish.quality = this.clamp(fish.quality + this.randomInt(6, 14), 1, 100);
      if (this.roll(0.28)) {
        fish.rarity = this.upgradeRarity(fish.rarity);
      }

      state.systems.fishing.mutations += 1;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Buồng Đột Biến", "Mutation Chamber"),
        description: text(
          language,
          `${fish.name} bước vào bể lấp lánh và chui ra trong hình dạng đáng sợ hơn hẳn.`,
          `${fish.name} entered the sparkle tank and came out objectively more threatening.`
        ),
        fields: [
          {
            name: text(language, "Chi Phí", "Cost"),
            value: formatCoins(cost),
            inline: true
          },
          {
            name: text(language, "Giá Trị Mới", "New Value"),
            value: formatCoins(fish.value),
            inline: true
          },
          {
            name: text(language, "Độ Hiếm / Chất Lượng", "Rarity / Quality"),
            value: `${fish.rarity} / ${fish.quality}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleIsland(context) {
    const args = this.cleanArgs(context.args);
    const subcommand = this.normalizeAnswer(args[0] || "view");

    if (subcommand === "buy") return this.handleIslandBuy(context);
    if (subcommand === "upgrade") return this.handleIslandUpgrade(context);
    if (subcommand === "visit") return this.handleIslandVisit(context);
    if (subcommand === "fish") return this.handleIslandFish(context);
    if (subcommand === "collect") return this.handleIslandCollect(context);
    if (subcommand === "defend") return this.handleIslandDefend(context);

    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, state);
      const island = state.systems.island;

      return {
        title: text(language, "Sổ Cái Đảo", "Island Ledger"),
        description: island.owned
          ? text(language, `**${island.name}** là của bạn. Nhỏ thôi, có lời, và hơi bị nguyền một chút.`, `**${island.name}** is yours. Tiny, profitable, slightly cursed.`)
          : text(language, "Bạn chưa có đảo. Dùng `Nisland buy` để bắt đầu đế chế cát.", "You do not own an island yet. Use `Nisland buy` to begin the sand empire."),
        fields: [
          {
            name: text(language, "Bậc", "Tier"),
            value: `${island.tier}`,
            inline: true
          },
          {
            name: text(language, "Kho Cá", "Fish Stock"),
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: text(language, "Phòng Thủ", "Defense"),
            value: `${island.defense}`,
            inline: true
          },
          {
            name: text(language, "Vỏ Sò", "Shells"),
            value: `${island.shells}`,
            inline: true
          },
          {
            name: text(language, "Khách Ghé", "Visitors"),
            value: `${island.visitors}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleIslandBuy(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const island = state.systems.island;
      const buyCost = 7500;

      if (island.owned) {
        throw new Error(text(language, "Bạn đã có đảo rồi. Đây là lòng tham có thêm vài bước nữa.", "You already own an island. This is greed with extra steps."));
      }

      if (Number(summary.wallet) < buyCost) {
        throw new Error(text(language, `Giấy chủ quyền đảo giá ${formatCoins(buyCost)}.`, `Island deeds cost ${formatCoins(buyCost)}.`));
      }

      await this.economyRepository.mutateWallet(actor.id, -buyCost, "island_buy", tx);
      island.owned = true;
      island.tier = 1;
      island.fishStock = 4;
      island.shells = 8;
      island.defense = 5;
      island.name = `${actor.username}'s Milk Island`;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Đã Mua Đảo", "Island Purchased"),
        description: text(
          language,
          `Bạn mua **${island.name}** xong là lập tức hành xử như một bạo chúa tí hon của đại dương.`,
          `You bought **${island.name}** and immediately started acting like a tiny ocean tyrant.`
        ),
        fields: [
          {
            name: text(language, "Chi Phí", "Cost"),
            value: formatCoins(buyCost),
            inline: true
          },
          {
            name: text(language, "Bậc", "Tier"),
            value: `${island.tier}`,
            inline: true
          },
          {
            name: text(language, "Tài Nguyên Khởi Đầu", "Starter Stock"),
            value: text(language, `${island.fishStock} cá / ${island.shells} vỏ sò`, `${island.fishStock} fish / ${island.shells} shells`),
            inline: true
          }
        ]
      };
    });
  },

  async handleIslandUpgrade(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const island = state.systems.island;
      if (!island.owned) throw new Error(text(language, "Mua đảo trước bằng `Nisland buy` đi.", "Buy an island first with `Nisland buy`."));

      const cost = 2800 + island.tier * 2100;
      if (Number(summary.wallet) < cost) throw new Error(text(language, `Nâng cấp đảo tốn ${formatCoins(cost)}.`, `Island upgrades cost ${formatCoins(cost)}.`));

      await this.economyRepository.mutateWallet(actor.id, -cost, "island_upgrade", tx);
      island.tier += 1;
      island.fishStock += island.tier * 3;
      island.shells += island.tier * 4;
      island.defense += 4;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Đã Nâng Cấp Đảo", "Island Upgraded"),
        description: text(
          language,
          "Hòn đảo giờ to hơn, giàu hơn, và có vẻ biết tự vệ bằng dừa tốt hơn một chút.",
          "The island got bigger, richer, and slightly more capable of defending itself with coconuts."
        ),
        fields: [
          {
            name: text(language, "Bậc Mới", "New Tier"),
            value: `${island.tier}`,
            inline: true
          },
          {
            name: text(language, "Kho Cá", "Fish Stock"),
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: text(language, "Phòng Thủ", "Defense"),
            value: `${island.defense}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleIslandVisit(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const island = state.systems.island;
      if (!island.owned) throw new Error(text(language, "Muốn ghé thăm thì bạn phải có đảo trước. Địa lý là vậy đó.", "You need an island to visit. That is how geography works."));

      const shellGain = this.randomInt(1, 4) + island.tier;
      island.visitors += 1;
      island.shells += shellGain;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Thăm Đảo", "Island Visit"),
        description: text(
          language,
          `Bạn đi một vòng quanh **${island.name}**. Dân địa phương reo hò, một con cua phán xét bạn, rồi vỏ sò tự dưng xuất hiện.`,
          `You took a lap around **${island.name}**. The locals cheered, a crab judged you, and shells appeared.`
        ),
        fields: [
          {
            name: text(language, "Vỏ Sò Tìm Được", "Shells Found"),
            value: `${shellGain}`,
            inline: true
          },
          {
            name: text(language, "Khách Ghé", "Visitors"),
            value: `${island.visitors}`,
            inline: true
          },
          {
            name: text(language, "Tổng Vỏ Sò", "Total Shells"),
            value: `${island.shells}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleIslandFish(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const island = state.systems.island;
      if (!island.owned) throw new Error(text(language, "Mua đảo trước đi. Đầm nước không nhận lao động chui.", "Buy an island first. The lagoon refuses unauthorized labor."));

      const catchData = this.buildLocalCatch("island", island.tier + 1, "lagoon");
      await this.recordLocalCatch(actor.id, catchData, "island", tx);
      await this.userRepository.addXp(actor.id, Math.floor(catchData.xp * 0.8), tx);

      island.fishStock += this.randomInt(3, 6) + island.tier;
      island.shells += this.randomInt(1, 3);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Câu Cá Trên Đảo", "Island Fishing"),
        description: text(
          language,
          `${rarityEmoji(catchData.rarity)} **${catchData.speciesName}** được kéo lên từ đầm riêng của bạn. Hòn đảo đang flex cực mạnh.`,
          `${rarityEmoji(catchData.rarity)} **${catchData.speciesName}** came from your private lagoon. The island is flexing.`
        ),
        fields: [
          {
            name: text(language, "Giá Trị Cá", "Catch Value"),
            value: formatCoins(catchData.estimatedValue),
            inline: true
          },
          {
            name: text(language, "Kho Dự Trữ", "Stock Pile"),
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: text(language, "Vỏ Sò", "Shells"),
            value: `${island.shells}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleIslandCollect(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const island = state.systems.island;
      if (!island.owned) throw new Error(text(language, "Không có đảo thì không có tuyến thu hoạch.", "No island, no collection route."));

      const payout = island.fishStock * (65 + island.tier * 8) + island.shells * 22;
      if (payout <= 0) throw new Error(text(language, "Kho trên đảo của bạn đang trống.", "Your island stash is empty right now."));

      await this.economyRepository.mutateWallet(actor.id, payout, "island_collect", tx);
      island.fishStock = 0;
      island.shells = 0;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Thu Hoạch Đảo", "Island Collection"),
        description: text(
          language,
          "Bạn hút sạch kho tài nguyên trên đảo và để lại kế toán chạy nước rút.",
          "You vacuumed up the island stash and left the accountant in a full sprint."
        ),
        fields: [
          {
            name: text(language, "Thu Về", "Collected"),
            value: formatCoins(payout),
            inline: true
          },
          {
            name: text(language, "Kho Cá", "Fish Stock"),
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: text(language, "Vỏ Sò", "Shells"),
            value: `${island.shells}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleIslandDefend(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const island = state.systems.island;
      if (!island.owned) throw new Error(text(language, "Bạn không thể phòng thủ một hòn đảo không thuộc về mình.", "You cannot defend an island you do not own."));

      const defenseGain = this.randomInt(2, 5) + island.tier;
      const payout = this.randomInt(120, 260) + island.defense * 10;
      island.defense += defenseGain;

      await this.economyRepository.mutateWallet(actor.id, payout, "island_defend", tx);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Diễn Tập Phòng Thủ Đảo", "Island Defense Drill"),
        description: text(
          language,
          "Bạn đẩy lùi đám cướp tưởng tượng bằng sự nhiệt tình rất thật và một cây gậy to.",
          "You repelled imaginary raiders with very real enthusiasm and a large stick."
        ),
        fields: [
          {
            name: text(language, "Phòng Thủ Tăng", "Defense Gain"),
            value: `+${defenseGain}`,
            inline: true
          },
          {
            name: text(language, "Phòng Thủ Mới", "New Defense"),
            value: `${island.defense}`,
            inline: true
          },
          {
            name: text(language, "Thưởng", "Payout"),
            value: formatCoins(payout),
            inline: true
          }
        ]
      };
    });
  },

  async handlePet(context) {
    const args = this.cleanArgs(context.args);
    const subcommand = this.normalizeAnswer(args[0] || "view");

    if (subcommand === "buy") return this.handlePetBuy(context);
    if (subcommand === "feed") return this.handlePetFeed(context);
    if (subcommand === "play") return this.handlePetPlay(context);
    if (subcommand === "evolve") return this.handlePetEvolve(context);

    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, state);
      const petState = state.systems.pet;
      const pet = this.getPetConfig(state);
      const petName = this.getLocalizedPetName(pet, language);

      return {
        title: text(language, "Bảng Thú Cưng", "Pet Panel"),
        description: petState.owned
          ? text(
              language,
              `Thú cưng của bạn là **${petName}** ở giai đoạn **${petState.stage}**. Nó đang phát triển theo kiểu đáng yêu một cách nguy hiểm.`,
              `Your pet is **${petName}** at stage **${petState.stage}**. It is thriving in a dangerously cute way.`
            )
          : text(language, "Bạn chưa có thú cưng. Loài có thể mua: `pup`, `slime`, `dragon`.", "You do not own a pet yet. Available species: `pup`, `slime`, `dragon`."),
        fields: [
          {
            name: text(language, "No Đói", "Hunger"),
            value: `${progressBar(petState.hunger, 100, 8)} ${petState.hunger}`,
            inline: false
          },
          {
            name: text(language, "Niềm Vui", "Joy"),
            value: `${progressBar(petState.joy, 100, 8)} ${petState.joy}`,
            inline: false
          },
          {
            name: text(language, "XP Thú Cưng", "Pet XP"),
            value: `${petState.xp}`,
            inline: true
          },
          {
            name: text(language, "Thưởng Nội Tại", "Passive Bonus"),
            value: pet ? this.formatPercent(this.getPetPassiveBonus(state)) : "0%",
            inline: true
          }
        ]
      };
    });
  },

  async handlePetBuy(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const args = this.cleanArgs(context.args);
      const speciesKey = this.normalizeAnswer(args[1] || "pup");
      const pet = PET_SPECIES[speciesKey];
      const petName = this.getLocalizedPetName(pet, language);

      if (!pet) throw new Error(text(language, "Chọn một trong số này: `pup`, `slime`, `dragon`.", "Pick one of: `pup`, `slime`, `dragon`."));
      if (state.systems.pet.owned) throw new Error(text(language, "Bạn đã có thú cưng rồi. Bấy nhiêu trách nhiệm là đủ.", "You already own a pet. This is enough responsibility."));
      if (Number(summary.wallet) < pet.cost) throw new Error(text(language, `${petName} có giá ${formatCoins(pet.cost)}.`, `${petName} costs ${formatCoins(pet.cost)}.`));

      await this.economyRepository.mutateWallet(actor.id, -pet.cost, "pet_buy", tx);
      state.systems.pet = {
        owned: true,
        speciesKey,
        stage: 1,
        xp: 0,
        hunger: 85,
        joy: 85,
        energy: 100,
        lastFedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString()
      };
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Đã Nhận Nuôi Thú Cưng", "Pet Adopted"),
        description: text(
          language,
          `Bạn đã nhận nuôi **${petName}**. Nó đã tin chắc bạn là máy phát snack của số mệnh.`,
          `You adopted **${petName}**. It already believes you are the snack dispenser of destiny.`
        ),
        fields: [
          {
            name: text(language, "Chi Phí", "Cost"),
            value: formatCoins(pet.cost),
            inline: true
          },
          {
            name: text(language, "Giai Đoạn", "Stage"),
            value: "1",
            inline: true
          },
          {
            name: text(language, "Nội Tại", "Passive"),
            value: this.formatPercent(pet.passiveBonus),
            inline: true
          }
        ]
      };
    });
  },

  async handlePetFeed(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const pet = this.getPetConfig(state);
      const petName = this.getLocalizedPetName(pet, language);
      if (!pet || !state.systems.pet.owned) throw new Error(text(language, "Mua thú cưng trước bằng `Npet buy` đi.", "Buy a pet first with `Npet buy`."));

      const cost = 70 + state.systems.pet.stage * 18;
      if (Number(summary.wallet) < cost) throw new Error(text(language, `Thức ăn thú cưng giá ${formatCoins(cost)}.`, `Pet food costs ${formatCoins(cost)}.`));

      await this.economyRepository.mutateWallet(actor.id, -cost, "pet_feed", tx);
      state.systems.pet.hunger = this.clamp(state.systems.pet.hunger + pet.feedBoost, 0, 100);
      state.systems.pet.xp += pet.xpBoost;
      state.systems.pet.lastFedAt = new Date().toISOString();
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Đã Cho Thú Cưng Ăn", "Pet Fed"),
        description: text(
          language,
          `${petName} húp sạch bữa ăn và giờ đang rung lên vì tình yêu lẫn sức mạnh khó hiểu.`,
          `${petName} inhaled the meal and is now vibrating with love and questionable power.`
        ),
        fields: [
          {
            name: text(language, "Tiền Thức Ăn", "Food Cost"),
            value: formatCoins(cost),
            inline: true
          },
          {
            name: text(language, "No Đói", "Hunger"),
            value: `${state.systems.pet.hunger}`,
            inline: true
          },
          {
            name: text(language, "XP Thú Cưng", "Pet XP"),
            value: `${state.systems.pet.xp}`,
            inline: true
          }
        ]
      };
    });
  },

  async handlePetPlay(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const pet = this.getPetConfig(state);
      const petName = this.getLocalizedPetName(pet, language);
      if (!pet || !state.systems.pet.owned) throw new Error(text(language, "Bạn cần có thú cưng để chơi cùng.", "You need a pet to play with."));

      const coinGift = this.randomInt(90, 180) + state.systems.pet.stage * 40;
      await this.economyRepository.mutateWallet(actor.id, coinGift, "pet_play", tx);
      state.systems.pet.joy = this.clamp(state.systems.pet.joy + pet.playBoost, 0, 100);
      state.systems.pet.xp += pet.xpBoost;
      state.systems.pet.lastPlayedAt = new Date().toISOString();
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Giờ Chơi", "Play Time"),
        description: text(
          language,
          `${petName} chạy như bay quanh phòng, không làm vỡ gì quan trọng, và bằng cách nào đó còn kiếm được tiền cho bạn.`,
          `${petName} zoomed around the room, broke nothing important, and found you free money somehow.`
        ),
        fields: [
          {
            name: text(language, "Niềm Vui", "Joy"),
            value: `${state.systems.pet.joy}`,
            inline: true
          },
          {
            name: text(language, "XP Thú Cưng", "Pet XP"),
            value: `${state.systems.pet.xp}`,
            inline: true
          },
          {
            name: text(language, "Coin Nhặt Được", "Found Coins"),
            value: formatCoins(coinGift),
            inline: true
          }
        ]
      };
    });
  },

  async handlePetEvolve(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const pet = this.getPetConfig(state);
      const petName = this.getLocalizedPetName(pet, language);
      if (!pet || !state.systems.pet.owned) throw new Error(text(language, "Bạn cần có thú cưng trước khi tiến hóa nó.", "You need a pet before you can evolve it."));

      const stage = state.systems.pet.stage;
      const requiredXp = stage * 140;
      if (state.systems.pet.xp < requiredXp) throw new Error(text(language, `Thú cưng của bạn cần ${requiredXp} XP để tiến hóa.`, `Your pet needs ${requiredXp} XP to evolve.`));
      if (stage >= 4) throw new Error(text(language, "Thú cưng của bạn đã ở dạng ngáo quyền lực tối đa rồi.", "Your pet is already in its maximum menace form."));

      state.systems.pet.stage += 1;
      state.systems.pet.xp -= requiredXp;
      state.systems.rewards.keys += 2;
      await this.economyRepository.mutateWallet(actor.id, 500 * state.systems.pet.stage, "pet_evolve", tx);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: text(language, "Tiến Hóa Thú Cưng", "Pet Evolution"),
        description: text(
          language,
          `${petName} đã tiến hóa thành một con support cảm xúc đắt đỏ hơn hẳn.`,
          `${petName} evolved into a more expensive emotional support gremlin.`
        ),
        fields: [
          {
            name: text(language, "Giai Đoạn Mới", "New Stage"),
            value: `${state.systems.pet.stage}`,
            inline: true
          },
          {
            name: text(language, "Thưởng Nội Tại", "Passive Bonus"),
            value: this.formatPercent(this.getPetPassiveBonus(state)),
            inline: true
          },
          {
            name: text(language, "Quà Tiến Hóa", "Evolution Loot"),
            value: text(language, "2 chìa khóa rương + bùng nổ coin", "2 chest keys + coin burst"),
            inline: true
          }
        ]
      };
    });
  }
};

module.exports = { fishingIslandPetMethods };
