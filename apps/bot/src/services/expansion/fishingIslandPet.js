const { PET_SPECIES, formatCoins, rarityEmoji } = require("./shared");
const { progressBar } = require("../../utils/formatters");

const fishingIslandPetMethods = {
  async handleDeepsea(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      this.assertNotJailed(state);

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
        title: "Deep Sea Run",
        description: `${rarityEmoji(catchData.rarity)} **${catchData.speciesName}** surfaced from the abyss. ${catchData.flavorText}`,
        fields: [
          {
            name: "Catch Value",
            value: formatCoins(catchData.estimatedValue),
            inline: true
          },
          {
            name: "Quality",
            value: `${catchData.qualityScore}/100`,
            inline: true
          },
          {
            name: "Coin Bonus",
            value: formatCoins(coinBonus),
            inline: true
          },
          {
            name: "Weight / Length",
            value: `${catchData.weightKg}kg / ${catchData.lengthCm}cm`,
            inline: true
          },
          {
            name: "Deep Sea Level",
            value: `Lv.${state.systems.fishing.deepseaLevel}`,
            inline: true
          },
          {
            name: "Aquarium",
            value: stored?.stored
              ? stored.replaced
                ? `${stored.entry.name} replaced a weaker tank fish`
                : `${stored.entry.name} joined your tank`
              : "No new aquarium fish this run",
            inline: false
          }
        ],
        footer: catchData.isJackpot ? "Mythical glow detected. The ocean is clearly showing off." : null
      };
    });
  },

  async handleNet(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      this.assertNotJailed(state);

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
        title: "Net Haul",
        description: `You dragged in **${catchCount}** catches at once and absolutely ruined the local fish mood.`,
        fields: [
          {
            name: "Highlights",
            value: summaryLines,
            inline: false
          },
          {
            name: "Total Est. Value",
            value: formatCoins(totalValue),
            inline: true
          },
          {
            name: "Coin Bonus",
            value: formatCoins(coinBonus),
            inline: true
          },
          {
            name: "XP",
            value: `+${totalXp}`,
            inline: true
          },
          {
            name: "Net Level",
            value: `Lv.${state.systems.fishing.netLevel}`,
            inline: true
          },
          {
            name: "Aquarium Upgrade",
            value: stored.replaced ? `${stored.entry.name} stole a slot` : `${stored.entry.name} was added`,
            inline: true
          }
        ]
      };
    });
  },

  async handleAquarium(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const aquarium = state.systems.fishing.aquarium;

      return {
        title: "Aquarium",
        description: aquarium.length
          ? aquarium
              .map(
                (fish, index) =>
                  `**${index + 1}.** ${rarityEmoji(fish.rarity)} ${fish.name} | ${formatCoins(
                    fish.value
                  )} | quality ${fish.quality} | mutations ${fish.mutations}`
              )
              .join("\n")
          : "Your aquarium is empty. Go bully the ocean with Ndeepsea or Nnet.",
        fields: [
          {
            name: "Capacity",
            value: `${aquarium.length}/6`,
            inline: true
          },
          {
            name: "Released",
            value: `${state.systems.fishing.released}`,
            inline: true
          },
          {
            name: "Mutations",
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
      const args = this.cleanArgs(context.args);
      const aquarium = state.systems.fishing.aquarium;

      if (!aquarium.length) {
        throw new Error("There is nothing in your aquarium to release.");
      }

      const slot = this.parseCount(args[0], 1, 1, aquarium.length) - 1;
      const [releasedFish] = aquarium.splice(slot, 1);
      const releaseReward = Math.floor(releasedFish.value * 0.35) + releasedFish.mutations * 40;
      const keyDrop = this.roll(0.2) ? 1 : 0;

      await this.economyRepository.mutateWallet(actor.id, releaseReward, "aquarium_release", tx);
      state.systems.fishing.released += 1;
      state.systems.rewards.keys += keyDrop;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Catch And Release",
        description: `You released **${releasedFish.name}** back into the chaos and got tipped for the drama.`,
        fields: [
          {
            name: "Reward",
            value: formatCoins(releaseReward),
            inline: true
          },
          {
            name: "Mutation Count",
            value: `${releasedFish.mutations}`,
            inline: true
          },
          {
            name: "Bonus Key",
            value: keyDrop ? "1 key dropped" : "No key this time",
            inline: true
          }
        ]
      };
    });
  },

  async handleMutate(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const aquarium = state.systems.fishing.aquarium;

      if (!aquarium.length) {
        throw new Error("Mutate what? Your aquarium is spiritually empty.");
      }

      const slot = this.parseCount(args[0], 1, 1, aquarium.length) - 1;
      const fish = aquarium[slot];
      const cost = 450 + fish.mutations * 250;

      if (Number(summary.wallet) < cost) {
        throw new Error(`Mutation goo costs ${formatCoins(cost)}.`);
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
        title: "Mutation Chamber",
        description: `${fish.name} entered the sparkle tank and came out objectively more threatening.`,
        fields: [
          {
            name: "Cost",
            value: formatCoins(cost),
            inline: true
          },
          {
            name: "New Value",
            value: formatCoins(fish.value),
            inline: true
          },
          {
            name: "Rarity / Quality",
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
      const island = state.systems.island;

      return {
        title: "Island Ledger",
        description: island.owned
          ? `**${island.name}** is yours. Tiny, profitable, slightly cursed.`
          : "You do not own an island yet. Use `Nisland buy` to begin the sand empire.",
        fields: [
          {
            name: "Tier",
            value: `${island.tier}`,
            inline: true
          },
          {
            name: "Fish Stock",
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: "Defense",
            value: `${island.defense}`,
            inline: true
          },
          {
            name: "Shells",
            value: `${island.shells}`,
            inline: true
          },
          {
            name: "Visitors",
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
      const island = state.systems.island;
      const buyCost = 7500;

      if (island.owned) {
        throw new Error("You already own an island. This is greed with extra steps.");
      }

      if (Number(summary.wallet) < buyCost) {
        throw new Error(`Island deeds cost ${formatCoins(buyCost)}.`);
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
        title: "Island Purchased",
        description: `You bought **${island.name}** and immediately started acting like a tiny ocean tyrant.`,
        fields: [
          {
            name: "Cost",
            value: formatCoins(buyCost),
            inline: true
          },
          {
            name: "Tier",
            value: `${island.tier}`,
            inline: true
          },
          {
            name: "Starter Stock",
            value: `${island.fishStock} fish / ${island.shells} shells`,
            inline: true
          }
        ]
      };
    });
  },

  async handleIslandUpgrade(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const island = state.systems.island;
      if (!island.owned) throw new Error("Buy an island first with `Nisland buy`.");

      const cost = 2800 + island.tier * 2100;
      if (Number(summary.wallet) < cost) throw new Error(`Island upgrades cost ${formatCoins(cost)}.`);

      await this.economyRepository.mutateWallet(actor.id, -cost, "island_upgrade", tx);
      island.tier += 1;
      island.fishStock += island.tier * 3;
      island.shells += island.tier * 4;
      island.defense += 4;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Island Upgraded",
        description: "The island got bigger, richer, and slightly more capable of defending itself with coconuts.",
        fields: [
          {
            name: "New Tier",
            value: `${island.tier}`,
            inline: true
          },
          {
            name: "Fish Stock",
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: "Defense",
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
      const island = state.systems.island;
      if (!island.owned) throw new Error("You need an island to visit. That is how geography works.");

      const shellGain = this.randomInt(1, 4) + island.tier;
      island.visitors += 1;
      island.shells += shellGain;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Island Visit",
        description: `You took a lap around **${island.name}**. The locals cheered, a crab judged you, and shells appeared.`,
        fields: [
          {
            name: "Shells Found",
            value: `${shellGain}`,
            inline: true
          },
          {
            name: "Visitors",
            value: `${island.visitors}`,
            inline: true
          },
          {
            name: "Total Shells",
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
      const island = state.systems.island;
      if (!island.owned) throw new Error("Buy an island first. The lagoon refuses unauthorized labor.");

      const catchData = this.buildLocalCatch("island", island.tier + 1, "lagoon");
      await this.recordLocalCatch(actor.id, catchData, "island", tx);
      await this.userRepository.addXp(actor.id, Math.floor(catchData.xp * 0.8), tx);

      island.fishStock += this.randomInt(3, 6) + island.tier;
      island.shells += this.randomInt(1, 3);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Island Fishing",
        description: `${rarityEmoji(catchData.rarity)} **${catchData.speciesName}** came from your private lagoon. The island is flexing.`,
        fields: [
          {
            name: "Catch Value",
            value: formatCoins(catchData.estimatedValue),
            inline: true
          },
          {
            name: "Stock Pile",
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: "Shells",
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
      const island = state.systems.island;
      if (!island.owned) throw new Error("No island, no collection route.");

      const payout = island.fishStock * (65 + island.tier * 8) + island.shells * 22;
      if (payout <= 0) throw new Error("Your island stash is empty right now.");

      await this.economyRepository.mutateWallet(actor.id, payout, "island_collect", tx);
      island.fishStock = 0;
      island.shells = 0;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Island Collection",
        description: "You vacuumed up the island stash and left the accountant in a full sprint.",
        fields: [
          {
            name: "Collected",
            value: formatCoins(payout),
            inline: true
          },
          {
            name: "Fish Stock",
            value: `${island.fishStock}`,
            inline: true
          },
          {
            name: "Shells",
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
      const island = state.systems.island;
      if (!island.owned) throw new Error("You cannot defend an island you do not own.");

      const defenseGain = this.randomInt(2, 5) + island.tier;
      const payout = this.randomInt(120, 260) + island.defense * 10;
      island.defense += defenseGain;

      await this.economyRepository.mutateWallet(actor.id, payout, "island_defend", tx);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Island Defense Drill",
        description: "You repelled imaginary raiders with very real enthusiasm and a large stick.",
        fields: [
          {
            name: "Defense Gain",
            value: `+${defenseGain}`,
            inline: true
          },
          {
            name: "New Defense",
            value: `${island.defense}`,
            inline: true
          },
          {
            name: "Payout",
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
      const petState = state.systems.pet;
      const pet = this.getPetConfig(state);

      return {
        title: "Pet Panel",
        description: petState.owned
          ? `Your pet is **${pet.name}** at stage **${petState.stage}**. It is thriving in a dangerously cute way.`
          : "You do not own a pet yet. Available species: `pup`, `slime`, `dragon`.",
        fields: [
          {
            name: "Hunger",
            value: `${progressBar(petState.hunger, 100, 8)} ${petState.hunger}`,
            inline: false
          },
          {
            name: "Joy",
            value: `${progressBar(petState.joy, 100, 8)} ${petState.joy}`,
            inline: false
          },
          {
            name: "Pet XP",
            value: `${petState.xp}`,
            inline: true
          },
          {
            name: "Passive Bonus",
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
      const args = this.cleanArgs(context.args);
      const speciesKey = this.normalizeAnswer(args[1] || "pup");
      const pet = PET_SPECIES[speciesKey];

      if (!pet) throw new Error("Pick one of: `pup`, `slime`, `dragon`.");
      if (state.systems.pet.owned) throw new Error("You already own a pet. This is enough responsibility.");
      if (Number(summary.wallet) < pet.cost) throw new Error(`${pet.name} costs ${formatCoins(pet.cost)}.`);

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
        title: "Pet Adopted",
        description: `You adopted **${pet.name}**. It already believes you are the snack dispenser of destiny.`,
        fields: [
          {
            name: "Cost",
            value: formatCoins(pet.cost),
            inline: true
          },
          {
            name: "Stage",
            value: "1",
            inline: true
          },
          {
            name: "Passive",
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
      const pet = this.getPetConfig(state);
      if (!pet || !state.systems.pet.owned) throw new Error("Buy a pet first with `Npet buy`.");

      const cost = 70 + state.systems.pet.stage * 18;
      if (Number(summary.wallet) < cost) throw new Error(`Pet food costs ${formatCoins(cost)}.`);

      await this.economyRepository.mutateWallet(actor.id, -cost, "pet_feed", tx);
      state.systems.pet.hunger = this.clamp(state.systems.pet.hunger + pet.feedBoost, 0, 100);
      state.systems.pet.xp += pet.xpBoost;
      state.systems.pet.lastFedAt = new Date().toISOString();
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Pet Fed",
        description: `${pet.name} inhaled the meal and is now vibrating with love and questionable power.`,
        fields: [
          {
            name: "Food Cost",
            value: formatCoins(cost),
            inline: true
          },
          {
            name: "Hunger",
            value: `${state.systems.pet.hunger}`,
            inline: true
          },
          {
            name: "Pet XP",
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
      const pet = this.getPetConfig(state);
      if (!pet || !state.systems.pet.owned) throw new Error("You need a pet to play with.");

      const coinGift = this.randomInt(90, 180) + state.systems.pet.stage * 40;
      await this.economyRepository.mutateWallet(actor.id, coinGift, "pet_play", tx);
      state.systems.pet.joy = this.clamp(state.systems.pet.joy + pet.playBoost, 0, 100);
      state.systems.pet.xp += pet.xpBoost;
      state.systems.pet.lastPlayedAt = new Date().toISOString();
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Play Time",
        description: `${pet.name} zoomed around the room, broke nothing important, and found you free money somehow.`,
        fields: [
          {
            name: "Joy",
            value: `${state.systems.pet.joy}`,
            inline: true
          },
          {
            name: "Pet XP",
            value: `${state.systems.pet.xp}`,
            inline: true
          },
          {
            name: "Found Coins",
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
      const pet = this.getPetConfig(state);
      if (!pet || !state.systems.pet.owned) throw new Error("You need a pet before you can evolve it.");

      const stage = state.systems.pet.stage;
      const requiredXp = stage * 140;
      if (state.systems.pet.xp < requiredXp) throw new Error(`Your pet needs ${requiredXp} XP to evolve.`);
      if (stage >= 4) throw new Error("Your pet is already in its maximum menace form.");

      state.systems.pet.stage += 1;
      state.systems.pet.xp -= requiredXp;
      state.systems.rewards.keys += 2;
      await this.economyRepository.mutateWallet(actor.id, 500 * state.systems.pet.stage, "pet_evolve", tx);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Pet Evolution",
        description: `${pet.name} evolved into a more expensive emotional support gremlin.`,
        fields: [
          {
            name: "New Stage",
            value: `${state.systems.pet.stage}`,
            inline: true
          },
          {
            name: "Passive Bonus",
            value: this.formatPercent(this.getPetPassiveBonus(state)),
            inline: true
          },
          {
            name: "Evolution Loot",
            value: "2 chest keys + coin burst",
            inline: true
          }
        ]
      };
    });
  }
};

module.exports = { fishingIslandPetMethods };
