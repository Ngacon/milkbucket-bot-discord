const { HOUSE_STYLES, formatCoins } = require("./shared");
const { formatDuration } = require("../../utils/formatters");

const socialHousingCrimeMethods = {
  async handleMarry(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error("Tag someone to marry. Chaos is better with witnesses.");
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error("Self-marriage is between you and your reflection, not the bot.");
      }

      const actor = await this.getActorUser(context, tx);
      const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
      const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const actorState = stateMap.get(Number(actor.id));
      const targetState = stateMap.get(Number(targetUser.id));

      if (actorState.systems.social.partnerUserId || targetState.systems.social.partnerUserId) {
        throw new Error("One of you is already married. This is a paperwork nightmare.");
      }

      actorState.systems.social.partnerUserId = targetUser.id;
      targetState.systems.social.partnerUserId = actor.id;
      actorState.systems.social.familyBlessing += 1;
      targetState.systems.social.familyBlessing += 1;

      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);
      await this.playerStateRepository.saveState(targetUser.id, targetState.systems, targetState.settings, tx);

      return {
        title: "Marriage Registered",
        description: `**${context.message.author.username}** and **${targetDiscordUser.username}** are now officially married in the chaos ledger.`,
        fields: [
          {
            name: "Family Blessing",
            value: "+1 for each partner",
            inline: true
          }
        ]
      };
    });
  },

  async handleDivorce(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const partnerUserId = state.systems.social.partnerUserId;
      if (!partnerUserId) throw new Error("You are not married right now.");

      const partnerState = await this.playerStateRepository.getState(partnerUserId, tx, { forUpdate: true });
      state.systems.social.partnerUserId = null;
      partnerState.systems.social.partnerUserId = null;

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      await this.playerStateRepository.saveState(partnerUserId, partnerState.systems, partnerState.settings, tx);

      const partner = await this.userRepository.findById(partnerUserId, tx);
      return {
        title: "Divorce Filed",
        description: `The papers are signed. You and **${partner?.username || "your former partner"}** have split.`,
        fields: [
          {
            name: "Status",
            value: "Single and operational",
            inline: true
          }
        ]
      };
    });
  },

  async handleFamily(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const partnerUserId = state.systems.social.partnerUserId;
      const users = await this.userRepository.getUsersByIds([partnerUserId].filter(Boolean), tx);
      const usersById = new Map(users.map((user) => [Number(user.id), user]));

      return {
        title: "Family Panel",
        description: "Household buffs, romance stats, and domesticated chaos in one place.",
        fields: [
          {
            name: "Partner",
            value: this.getPartnerLabel(usersById, partnerUserId),
            inline: true
          },
          {
            name: "Family Blessing",
            value: `${state.systems.social.familyBlessing}`,
            inline: true
          },
          {
            name: "Gifts Sent",
            value: `${state.systems.social.giftsSent}`,
            inline: true
          },
          {
            name: "Gifts Received",
            value: `${state.systems.social.giftsReceived}`,
            inline: true
          },
          {
            name: "Home Comfort",
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
      const house = state.systems.housing;
      const style = HOUSE_STYLES[house.style];

      return {
        title: "Housing Panel",
        description: house.owned
          ? `You own a **${style.label}** at tier **${house.tier}**. It radiates grindset decor.`
          : "You are houseless in the game sense. Use `Nhouse buy [shack|loft|manor]`.",
        fields: [
          {
            name: "Style",
            value: style.label,
            inline: true
          },
          {
            name: "Tier",
            value: `${house.tier}`,
            inline: true
          },
          {
            name: "Comfort",
            value: `${house.comfort}`,
            inline: true
          },
          {
            name: "Decorations",
            value: house.decorations.length ? house.decorations.join(", ") : "None yet",
            inline: false
          }
        ]
      };
    });
  },

  async handleHouseBuy(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const styleKey = this.normalizeAnswer(args[1] || "shack");
      const style = HOUSE_STYLES[styleKey];

      if (!style) throw new Error("Pick a house style: `shack`, `loft`, or `manor`.");
      if (state.systems.housing.owned) throw new Error("You already own a house. Upgrade it instead.");
      if (Number(summary.wallet) < style.buyCost) throw new Error(`${style.label} costs ${formatCoins(style.buyCost)}.`);

      await this.economyRepository.mutateWallet(actor.id, -style.buyCost, "house_buy", tx);
      state.systems.housing.owned = true;
      state.systems.housing.style = styleKey;
      state.systems.housing.tier = 1;
      state.systems.housing.comfort = 12;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "House Purchased",
        description: `You bought a **${style.label}** and immediately started treating it like an endgame stat stick.`,
        fields: [
          {
            name: "Cost",
            value: formatCoins(style.buyCost),
            inline: true
          },
          {
            name: "Comfort",
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
      const house = state.systems.housing;
      if (!house.owned) throw new Error("Buy a house first with `Nhouse buy`.");

      const style = HOUSE_STYLES[house.style];
      const cost = style.upgradeBase + house.tier * 1250;
      if (Number(summary.wallet) < cost) throw new Error(`This upgrade costs ${formatCoins(cost)}.`);

      await this.economyRepository.mutateWallet(actor.id, -cost, "house_upgrade", tx);
      house.tier += 1;
      house.comfort += 14;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "House Upgraded",
        description: `${style.label} received a dangerously expensive makeover.`,
        fields: [
          {
            name: "New Tier",
            value: `${house.tier}`,
            inline: true
          },
          {
            name: "Comfort",
            value: `${house.comfort}`,
            inline: true
          },
          {
            name: "Cost",
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
      if (!state.systems.housing.owned) {
        throw new Error("Buy a house first. Floor decorations in the void do not count.");
      }

      const args = this.cleanArgs(context.args);
      const decoration = args.join(" ").trim();
      if (!decoration) {
        throw new Error("Tell me what decoration you are adding. Example: `Ndecorate neon beanbag`");
      }

      state.systems.housing.decorations.unshift(decoration);
      state.systems.housing.decorations = state.systems.housing.decorations.slice(0, 8);
      state.systems.housing.comfort += 5;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "House Decorated",
        description: `You installed **${decoration}** and the room instantly gained grind energy.`,
        fields: [
          {
            name: "Comfort",
            value: `${state.systems.housing.comfort}`,
            inline: true
          },
          {
            name: "Decor Count",
            value: `${state.systems.housing.decorations.length}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleBounty(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error("Tag a target to place a bounty.");
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error("Putting a bounty on yourself is just a cry for help.");
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
      const amount = this.parseAmount(args[1], 500, Number(actorSummary.wallet));

      if (amount <= 0) throw new Error("Bounties start at 1 coin. Be serious.");
      if (Number(actorSummary.wallet) < amount) throw new Error(`You need ${formatCoins(amount)} in your wallet.`);

      await this.economyRepository.mutateWallet(actor.id, -amount, "bounty_place", tx);
      targetState.systems.crime.bounty += amount;
      targetState.systems.crime.heat += 12;
      await this.playerStateRepository.saveState(targetUser.id, targetState.systems, targetState.settings, tx);

      return {
        title: "Bounty Posted",
        description: `A bounty of ${formatCoins(amount)} now hovers over **${targetDiscordUser.username}** like a very rude cloud.`,
        fields: [
          {
            name: "Target Bounty",
            value: formatCoins(targetState.systems.crime.bounty),
            inline: true
          },
          {
            name: "Target Heat",
            value: `${targetState.systems.crime.heat}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleSteal(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error("Tag someone to steal from.");
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error("Stealing from yourself is just moving pockets.");
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

      this.assertNotJailed(actorState);
      const args = this.cleanArgs(context.args);
      const desiredAmount = this.parseAmount(
        args[1],
        Math.min(450, Number(targetSummary.wallet)),
        Number(targetSummary.wallet)
      );
      const stealAmount = Math.min(desiredAmount, Number(targetSummary.wallet));
      if (stealAmount <= 0) throw new Error("That target has no wallet juice left.");

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
        description = `You snagged ${formatCoins(stealAmount)} from **${targetDiscordUser.username}** and sprinted into the fog.`;
      } else if (this.roll(0.45)) {
        actorState.systems.crime.jailUntil = new Date(Date.now() + 20 * 60 * 1000).toISOString();
        description = `You got caught trying to steal from **${targetDiscordUser.username}** and were launched directly into jail.`;
      } else {
        description = "You whiffed the theft. Everyone is now extremely suspicious of your face.";
      }

      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);

      return {
        title: "Steal Attempt",
        description,
        fields: [
          {
            name: "Success Chance",
            value: this.formatPercent(successChance),
            inline: true
          },
          {
            name: "Your Heat",
            value: `${actorState.systems.crime.heat}`,
            inline: true
          },
          {
            name: "Target Wallet",
            value: formatCoins(targetSummary.wallet),
            inline: true
          }
        ]
      };
    });
  },

  async handleArrest(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error("Tag someone to arrest.");
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error("Arresting yourself would be efficient but weird.");
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

      this.assertNotJailed(actorState);
      if (targetState.systems.crime.bounty <= 0 && targetState.systems.crime.heat < 20) {
        throw new Error("That target is not hot enough for an arrest payout.");
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
          title: "Arrest Complete",
          description: `You slammed the cuffs on **${targetDiscordUser.username}** and cashed out like a bounty gremlin.`,
          fields: [
            {
              name: "Payout",
              value: formatCoins(payout),
              inline: true
            },
            {
              name: "Target Jail Time",
              value: formatDuration(this.getJailMs(targetState)),
              inline: true
            },
            {
              name: "Your Arrests",
              value: `${actorState.systems.crime.arrests}`,
              inline: true
            }
          ]
        };
      }

      actorState.systems.crime.heat += 10;
      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);

      return {
        title: "Arrest Failed",
        description: `**${targetDiscordUser.username}** escaped the arrest attempt and now your dignity is in pieces.`,
        fields: [
          {
            name: "Your Heat",
            value: `${actorState.systems.crime.heat}`,
            inline: true
          },
          {
            name: "Success Chance",
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
      const remaining = this.getJailMs(bundle.state);

      return {
        title: "Jail Status",
        description:
          remaining > 0
            ? `**${targetDiscordUser ? targetDiscordUser.username : context.message.author.username}** is jailed for another **${formatDuration(
                remaining
              )}**.`
            : `**${targetDiscordUser ? targetDiscordUser.username : context.message.author.username}** is currently free to cause problems.`,
        fields: [
          {
            name: "Heat",
            value: `${bundle.state.systems.crime.heat}`,
            inline: true
          },
          {
            name: "Bounty",
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
      const remaining = this.getJailMs(state);
      if (remaining <= 0) throw new Error("You are not in jail right now.");

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
          title: "Escape Successful",
          description: "You slipped past the guards and vanished into the milk mist.",
          fields: [
            {
              name: "Escape Chance",
              value: this.formatPercent(chance),
              inline: true
            },
            {
              name: "Total Escapes",
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
        title: "Escape Failed",
        description: "You made it halfway through the plan before running into a wall and a guard at the same time.",
        fields: [
          {
            name: "New Jail Time",
            value: formatDuration(this.getJailMs(state)),
            inline: true
          },
          {
            name: "Heat",
            value: `${state.systems.crime.heat}`,
            inline: true
          }
        ]
      };
    });
  }
};

module.exports = { socialHousingCrimeMethods };
