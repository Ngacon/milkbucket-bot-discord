const { PET_SPECIES } = require("../../data/liveGameData");
const { progressBar } = require("../../utils/formatters");
const { formatCoins, rarityEmoji } = require("./shared");
const {
  IDLE_TASKS,
  PET_PERSONALITIES,
  createPetRecord,
  getPetByReference,
  getPetFormName,
  getMoodEmoji,
  getUnlockedAbilities,
  getAbilityProfile,
  grantPetXp,
  buildIdleRewards,
  touchIdleClaim,
  simulatePetBattle,
  syncLegacyPetSummary,
  upgradeRarity,
  xpToNextLevel
} = require("./petEngine");

function isVietnamese(context) {
  return String(context.language || "en").toLowerCase().startsWith("vi");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatStats(pet) {
  return `ATK ${pet.stats.attack} | DEF ${pet.stats.defense} | LUCK ${pet.stats.luck}`;
}

function formatMoodLine(pet) {
  return `${getMoodEmoji(pet)} ${pet.mood}`;
}

function formatAbilities(pet) {
  return getUnlockedAbilities(pet)
    .map((abilityKey) => {
      const ability = getAbilityProfile(abilityKey);
      const equipped = abilityKey === pet.equippedAbility ? " [EQUIPPED]" : "";
      return `- ${ability.label}${equipped}`;
    })
    .join("\n");
}

function createNpcPet(service, actorPet) {
  const speciesKeys = Object.keys(PET_SPECIES);
  const speciesKey = service.pick(speciesKeys);
  const stage = clamp(actorPet.stage + service.randomInt(-1, 1), 1, 4);
  const pet = createPetRecord(speciesKey, {
    stage,
    level: Math.max(1, actorPet.level + service.randomInt(-1, 2))
  });

  pet.stats.attack += service.randomInt(0, actorPet.stage + 2);
  pet.stats.defense += service.randomInt(0, actorPet.stage + 2);
  pet.stats.luck += service.randomInt(0, actorPet.stage + 2);
  return pet;
}

function normalizePetSpecies(service, rawSpecies) {
  const normalized = service.normalizeAnswer(rawSpecies || "pup");
  return PET_SPECIES[normalized] ? normalized : null;
}

function getPetReference(service, state, rawReference) {
  return getPetByReference(state, service.normalizeAnswer(rawReference || ""));
}

function finalizePetState(state) {
  syncLegacyPetSummary(state);
  return state;
}

function buildPetOverview(service, context, state) {
  const vi = isVietnamese(context);
  const petState = service.getPetState(state);
  const activePet = service.getActivePetRecord(state);

  if (!activePet) {
    return {
      title: vi ? "Trung Tam Pet" : "Pet Hub",
      description: vi
        ? "Ban chua co pet nao. Thu `Npet buy pup`, `Npet buy fox`, hoac `Npet buy dragon` de bat dau."
        : "You do not own a pet yet. Try `Npet buy pup`, `Npet buy fox`, or `Npet buy dragon` to begin.",
      fields: [
        {
          name: vi ? "Species Co San" : "Available Species",
          value: Object.entries(PET_SPECIES)
            .map(([key, pet]) => `\`${key}\` -> ${pet.name} (${formatCoins(pet.cost)})`)
            .join("\n"),
          inline: false
        }
      ]
    };
  }

  const nextXp = xpToNextLevel(activePet.level);
  const activeAbility = getAbilityProfile(activePet.equippedAbility);

  return {
    title: vi ? "Trung Tam Pet" : "Pet Hub",
    description: vi
      ? `${rarityEmoji(activePet.rarity)} **${getPetFormName(activePet)}** dang theo ban. He pet nay gio da la RPG mini that su.`
      : `${rarityEmoji(activePet.rarity)} **${getPetFormName(activePet)}** is currently following you. Your pet loop is now a tiny RPG.`,
    fields: [
      {
        name: vi ? "Thong Tin Chinh" : "Core Stats",
        value: [
          `${vi ? "Ten goi" : "Nickname"}: **${activePet.nickname}**`,
          `${vi ? "Cap / Form" : "Level / Form"}: **Lv.${activePet.level} / Stage ${activePet.stage}**`,
          `${vi ? "Rarity" : "Rarity"}: **${activePet.rarity}**`,
          `${vi ? "Tinh cach" : "Personality"}: **${PET_PERSONALITIES[activePet.personality]?.label || activePet.personality}**`,
          `${vi ? "Tam trang" : "Mood"}: **${formatMoodLine(activePet)}**`
        ].join("\n"),
        inline: false
      },
      {
        name: vi ? "Nang Luong" : "Condition",
        value: [
          `${vi ? "Hunger" : "Hunger"}: ${progressBar(activePet.hunger, 100, 8)} ${Math.floor(activePet.hunger)}`,
          `${vi ? "Energy" : "Energy"}: ${progressBar(activePet.energy, 100, 8)} ${Math.floor(activePet.energy)}`,
          `${vi ? "Mood" : "Mood"}: ${progressBar(activePet.moodValue, 100, 8)} ${Math.floor(activePet.moodValue)}`,
          `${vi ? "XP" : "XP"}: ${progressBar(activePet.xp, nextXp, 8)} ${activePet.xp}/${nextXp}`
        ].join("\n"),
        inline: false
      },
      {
        name: vi ? "Chi So" : "Stats",
        value: formatStats(activePet),
        inline: true
      },
      {
        name: vi ? "Ability Dang Mac" : "Equipped Ability",
        value: `${activeAbility.label}\n${activeAbility.description}`,
        inline: true
      },
      {
        name: vi ? "Nhiem Vu Thu Dong" : "Idle Task",
        value: `${IDLE_TASKS[activePet.idle.task]?.label || activePet.idle.task}`,
        inline: true
      },
      {
        name: vi ? "Tong Quan O Chuong" : "Stable Overview",
        value: [
          `${vi ? "So pet" : "Owned pets"}: **${petState.pets.length}/${petState.stableSlots}**`,
          `${vi ? "Train" : "Training"}: **${petState.totalTraining || 0}**`,
          `${vi ? "Battle" : "Battles"}: **${petState.totalBattles || 0}**`,
          `${vi ? "Thang" : "Wins"}: **${petState.totalWins || 0}**`
        ].join("\n"),
        inline: false
      }
    ],
    footer: vi
      ? "Thu Npet list, Npet train attack, Npet battle, Npet idle fish, Npet ability."
      : "Try Npet list, Npet train attack, Npet battle, Npet idle fish, and Npet ability."
  };
}

const petSystemMethods = {
  async handlePet(context) {
    const args = this.cleanArgs(context.args);
    const rawSubcommand = this.normalizeAnswer(args[0] || "view");
    const subcommandMap = {
      view: "view",
      show: "view",
      list: "list",
      pets: "list",
      equip: "equip",
      active: "equip",
      buy: "buy",
      adopt: "buy",
      feed: "feed",
      play: "play",
      train: "train",
      battle: "battle",
      fight: "battle",
      duel: "duel",
      evolve: "evolve",
      evo: "evolve",
      ability: "ability",
      skill: "ability",
      idle: "idle"
    };
    const subcommand = subcommandMap[rawSubcommand] || "view";

    if (subcommand === "list") return this.handlePetList(context);
    if (subcommand === "equip") return this.handlePetEquip(context);
    if (subcommand === "buy") return this.handlePetBuy(context);
    if (subcommand === "feed") return this.handlePetFeed(context);
    if (subcommand === "play") return this.handlePetPlay(context);
    if (subcommand === "train") return this.handlePetTrain(context);
    if (subcommand === "battle") return this.handlePetBattle(context);
    if (subcommand === "duel") return this.handlePetDuel(context);
    if (subcommand === "evolve") return this.handlePetEvolve(context);
    if (subcommand === "ability") return this.handlePetAbility(context);
    if (subcommand === "idle") return this.handlePetIdle(context);

    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      return buildPetOverview(this, context, state);
    });
  },

  async handlePetList(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const vi = isVietnamese(context);
      const petState = this.getPetState(state);

      if (!petState.pets.length) {
        throw new Error(vi ? "Ban chua co pet nao. Thu `Npet buy pup`." : "You do not own any pets yet. Try `Npet buy pup`.");
      }

      return {
        title: vi ? "Danh Sach Pet" : "Pet Roster",
        description: petState.pets
          .map((pet, index) => {
            const activeMarker = pet.id === petState.activePetId ? " [ACTIVE]" : "";
            return `**${index + 1}.** ${rarityEmoji(pet.rarity)} ${getPetFormName(pet)}${activeMarker}\nLv.${pet.level} | Stage ${pet.stage} | ${formatMoodLine(pet)} | ${formatStats(pet)}`;
          })
          .join("\n\n"),
        fields: [
          {
            name: vi ? "Chu O" : "Stable",
            value: `${petState.pets.length}/${petState.stableSlots}`,
            inline: true
          }
        ],
        footer: vi ? "Doi pet bang Npet equip <slot>." : "Swap pets with Npet equip <slot>."
      };
    });
  },

  async handlePetEquip(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const args = this.cleanArgs(context.args);
      const targetPet = getPetReference(this, state, args.slice(1).join(" "));

      if (!targetPet) {
        throw new Error(vi ? "Khong tim thay pet do. Dung `Npet list` de xem slot." : "That pet was not found. Use `Npet list` to see your slots.");
      }

      state.systems.pet.activePetId = targetPet.id;
      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Da Chon Pet" : "Pet Equipped",
        description: vi
          ? `**${getPetFormName(targetPet)}** gio la pet active cua ban.`
          : `**${getPetFormName(targetPet)}** is now your active pet.`,
        fields: [
          {
            name: vi ? "Thong So" : "Snapshot",
            value: `${formatMoodLine(targetPet)} | ${formatStats(targetPet)}`,
            inline: false
          }
        ]
      };
    });
  },

  async handlePetBuy(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const args = this.cleanArgs(context.args);
      const speciesKey = normalizePetSpecies(this, args[1] || "pup");
      const species = speciesKey ? PET_SPECIES[speciesKey] : null;
      const petState = this.getPetState(state);

      if (!species) {
        throw new Error(vi ? "Species khong hop le. Thu pup, slime, dragon, fox, axolotl, crow." : "Invalid species. Try pup, slime, dragon, fox, axolotl, or crow.");
      }

      if (petState.pets.length >= petState.stableSlots) {
        throw new Error(vi ? "Chuong pet dang day. Hay equip cho khon hoac mo them slot sau." : "Your stable is full right now. Equip smartly or expand later.");
      }

      if (Number(summary.wallet) < species.cost) {
        throw new Error(vi ? `${species.name} gia ${formatCoins(species.cost)}.` : `${species.name} costs ${formatCoins(species.cost)}.`);
      }

      await this.economyRepository.mutateWallet(actor.id, -species.cost, "pet_buy", tx);
      const newPet = createPetRecord(speciesKey);
      petState.pets.push(newPet);
      if (!petState.activePetId) {
        petState.activePetId = newPet.id;
      }

      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Nhan Nuoi Thanh Cong" : "Pet Adopted",
        description: vi
          ? `Ban da nhan nuoi **${species.name}**. No nhin tui tien cua ban nhu do la mon an vat.`
          : `You adopted **${species.name}**. It is already eyeing your wallet like a snack drawer.`,
        fields: [
          {
            name: vi ? "Tinh Cach" : "Personality",
            value: PET_PERSONALITIES[newPet.personality]?.label || newPet.personality,
            inline: true
          },
          {
            name: vi ? "Ability Dau Tien" : "Starting Ability",
            value: getAbilityProfile(newPet.equippedAbility).label,
            inline: true
          },
          {
            name: vi ? "Gia" : "Cost",
            value: formatCoins(species.cost),
            inline: true
          }
        ]
      };
    });
  },

  async handlePetFeed(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const pet = this.getActivePetRecord(state);
      const petConfig = this.getPetConfig(state);

      if (!pet || !petConfig) {
        throw new Error(vi ? "Mua pet truoc bang `Npet buy`." : "Buy a pet first with `Npet buy`.");
      }

      const cost = 90 + pet.level * 22;
      if (Number(summary.wallet) < cost) {
        throw new Error(vi ? `Do an pet gia ${formatCoins(cost)}.` : `Pet food costs ${formatCoins(cost)}.`);
      }

      await this.economyRepository.mutateWallet(actor.id, -cost, "pet_feed", tx);
      pet.hunger = clamp(pet.hunger + petConfig.feedBoost + 10, 0, 100);
      pet.energy = clamp(pet.energy + 8, 0, 100);
      pet.moodValue = clamp(pet.moodValue + 10, 0, 100);
      pet.lastFedAt = new Date().toISOString();
      const xpResult = grantPetXp(pet, petConfig.xpBoost + this.randomInt(6, 12));

      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Da Cho An" : "Pet Fed",
        description: vi
          ? `${pet.nickname} vua an xong va trong nguy hiem mot cach rat dang yeu.`
          : `${pet.nickname} devoured the meal and now looks dangerously adorable.`,
        fields: [
          {
            name: vi ? "Chi Phi" : "Cost",
            value: formatCoins(cost),
            inline: true
          },
          {
            name: vi ? "Tinh Trang" : "Condition",
            value: `Hunger ${Math.floor(pet.hunger)} | Energy ${Math.floor(pet.energy)}`,
            inline: true
          },
          {
            name: vi ? "XP Pet" : "Pet XP",
            value: `+${xpResult.gained}${xpResult.levels ? ` | +${xpResult.levels} level` : ""}`,
            inline: true
          }
        ]
      };
    });
  },

  async handlePetPlay(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const pet = this.getActivePetRecord(state);
      const petConfig = this.getPetConfig(state);

      if (!pet || !petConfig) {
        throw new Error(vi ? "Ban can co pet de choi." : "You need a pet before you can play.");
      }

      if (pet.energy < 12) {
        throw new Error(vi ? "Pet dang het pin. Thu `Npet idle rest` hoac cho an." : "Your pet is out of juice. Try `Npet idle rest` or feed it first.");
      }

      const coinGift = this.randomInt(110, 210) + pet.level * 38 + pet.stage * 50;
      await this.economyRepository.mutateWallet(actor.id, coinGift, "pet_play", tx);
      pet.energy = clamp(pet.energy - 12, 0, 100);
      pet.hunger = clamp(pet.hunger - 6, 0, 100);
      pet.moodValue = clamp(pet.moodValue + petConfig.playBoost, 0, 100);
      pet.lastPlayedAt = new Date().toISOString();
      const xpResult = grantPetXp(pet, petConfig.xpBoost + this.randomInt(10, 18));

      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Gio Choi Pet" : "Play Time",
        description: vi
          ? `${pet.nickname} tang dong, pha vay thu va somehow lai dao duoc tien cho ban.`
          : `${pet.nickname} went feral, broke the room rhythm, and somehow found extra coins for you.`,
        fields: [
          {
            name: vi ? "Tien Dao Duoc" : "Coins Found",
            value: formatCoins(coinGift),
            inline: true
          },
          {
            name: vi ? "Nang Luong / Hunger" : "Energy / Hunger",
            value: `${Math.floor(pet.energy)} / ${Math.floor(pet.hunger)}`,
            inline: true
          },
          {
            name: vi ? "XP Pet" : "Pet XP",
            value: `+${xpResult.gained}${xpResult.levels ? ` | +${xpResult.levels} level` : ""}`,
            inline: true
          }
        ]
      };
    });
  },

  async handlePetTrain(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const pet = this.getActivePetRecord(state);
      const args = this.cleanArgs(context.args);
      const focus = this.normalizeAnswer(args[1] || "balanced");

      if (!pet) {
        throw new Error(vi ? "Can co pet active de train." : "You need an active pet to train.");
      }

      if (pet.energy < 18 || pet.hunger < 20) {
        throw new Error(vi ? "Pet qua doi hoac qua met de train. Cho an hoac cho no nghi truoc." : "Your pet is too hungry or too tired to train right now.");
      }

      const cost = 120 + pet.level * 30;
      if (Number(summary.wallet) < cost) {
        throw new Error(vi ? `Buoi train ton ${formatCoins(cost)}.` : `Training costs ${formatCoins(cost)}.`);
      }

      await this.economyRepository.mutateWallet(actor.id, -cost, "pet_train", tx);
      const gains = { attack: 0, defense: 0, luck: 0 };

      if (focus === "attack" || focus === "atk") {
        gains.attack = this.randomInt(2, 4);
        gains.defense = this.randomInt(0, 1);
      } else if (focus === "defense" || focus === "def") {
        gains.defense = this.randomInt(2, 4);
        gains.attack = this.randomInt(0, 1);
      } else if (focus === "luck") {
        gains.luck = this.randomInt(2, 4);
        gains.attack = this.randomInt(0, 1);
      } else {
        gains.attack = this.randomInt(1, 2);
        gains.defense = this.randomInt(1, 2);
        gains.luck = this.randomInt(1, 2);
      }

      pet.stats.attack += gains.attack;
      pet.stats.defense += gains.defense;
      pet.stats.luck += gains.luck;
      pet.energy = clamp(pet.energy - 18, 0, 100);
      pet.hunger = clamp(pet.hunger - 10, 0, 100);
      pet.moodValue = clamp(pet.moodValue + 4, 0, 100);
      pet.lastTrainedAt = new Date().toISOString();
      state.systems.pet.totalTraining += 1;
      const xpResult = grantPetXp(pet, 28 + pet.stage * 10 + this.randomInt(4, 12));

      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Pet Da Train" : "Training Session",
        description: vi
          ? `${pet.nickname} vua ket thuc buoi train va nhin rat chien.`
          : `${pet.nickname} wrapped a hard training block and looks meaner already.`,
        fields: [
          {
            name: vi ? "Tang Chi So" : "Stat Gains",
            value: `ATK +${gains.attack} | DEF +${gains.defense} | LUCK +${gains.luck}`,
            inline: false
          },
          {
            name: vi ? "Chi Phi" : "Cost",
            value: formatCoins(cost),
            inline: true
          },
          {
            name: vi ? "XP Pet" : "Pet XP",
            value: `+${xpResult.gained}${xpResult.levels ? ` | +${xpResult.levels} level` : ""}`,
            inline: true
          },
          {
            name: vi ? "Tong Chi So" : "Current Stats",
            value: formatStats(pet),
            inline: true
          }
        ]
      };
    });
  },

  async handlePetBattle(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const pet = this.getActivePetRecord(state);

      if (!pet) {
        throw new Error(vi ? "Ban can pet active de battle." : "You need an active pet to battle.");
      }

      if (pet.energy < 16) {
        throw new Error(vi ? "Pet dang met. Hay cho nghi hoac cho an truoc." : "Your pet is too tired. Let it rest or feed it first.");
      }

      const enemy = createNpcPet(this, pet);
      const outcome = simulatePetBattle(pet, enemy);
      const won = outcome.winner === "actor";
      const coinReward = won ? 220 + pet.level * 45 + pet.stage * 80 : 40 + pet.level * 10;
      const xpGain = won ? 42 + pet.stage * 16 : 18 + pet.stage * 6;

      pet.energy = clamp(pet.energy - 16, 0, 100);
      pet.hunger = clamp(pet.hunger - 8, 0, 100);
      pet.lastBattleAt = new Date().toISOString();
      pet.wins += won ? 1 : 0;
      pet.losses += won ? 0 : 1;
      state.systems.pet.totalBattles += 1;
      state.systems.pet.totalWins += won ? 1 : 0;

      await this.economyRepository.mutateWallet(actor.id, coinReward, won ? "pet_battle_win" : "pet_battle_loss", tx);
      const xpResult = grantPetXp(pet, xpGain);
      if (won && this.roll(0.18 + pet.stage * 0.03)) {
        state.systems.rewards.keys += 1;
      }

      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Pet Battle" : "Pet Battle",
        description: won
          ? vi
            ? `**${pet.nickname}** ha guc **${enemy.nickname}** sau mot tran solo rat on ao.`
            : `**${pet.nickname}** flattened **${enemy.nickname}** in a loud little showdown.`
          : vi
            ? `**${enemy.nickname}** da canh tranh rat gac va ${pet.nickname} phai lui mot nhip.`
            : `**${enemy.nickname}** held the line and your pet had to back off this round.`,
        fields: [
          {
            name: vi ? "Log Nhanh" : "Quick Combat Log",
            value: outcome.log.join("\n"),
            inline: false
          },
          {
            name: vi ? "HP Cuoi Tran" : "Final HP",
            value: `${pet.nickname}: ${outcome.actorHp} | ${enemy.nickname}: ${outcome.targetHp}`,
            inline: false
          },
          {
            name: vi ? "Thuong" : "Reward",
            value: formatCoins(coinReward),
            inline: true
          },
          {
            name: vi ? "XP Pet" : "Pet XP",
            value: `+${xpResult.gained}${xpResult.levels ? ` | +${xpResult.levels} level` : ""}`,
            inline: true
          }
        ],
        footer: won
          ? vi
            ? "Thang tran nay se day mood grind len rat nhanh."
            : "Wins like this make the pet loop snowball nicely."
          : vi
            ? "Thua khong sao. Train them va quay lai tra no sau."
            : "A loss is still progress. Train up and come back louder."
      };
    });
  },

  async handlePetDuel(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);
      const vi = isVietnamese(context);

      if (!targetDiscordUser || targetDiscordUser.id === context.message.author.id) {
        throw new Error(vi ? "Tag mot nguoi khac de duel pet." : "Tag someone else if you want to duel pets.");
      }

      const actor = await this.getActorUser(context, tx);
      const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
      const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const actorState = stateMap.get(Number(actor.id));
      const targetState = stateMap.get(Number(targetUser.id));
      const actorPet = this.getActivePetRecord(actorState);
      const targetPet = this.getActivePetRecord(targetState);

      if (!actorPet || !targetPet) {
        throw new Error(vi ? "Ca 2 ben deu phai co pet active." : "Both players need an active pet for a duel.");
      }

      if (actorPet.energy < 18 || targetPet.energy < 18) {
        throw new Error(vi ? "Mot trong hai pet dang qua met de duel." : "One of the pets is too tired to duel.");
      }

      const outcome = simulatePetBattle(actorPet, targetPet);
      const actorWon = outcome.winner === "actor";
      const reward = 260 + actorPet.stage * 90 + actorPet.level * 30;

      actorPet.energy = clamp(actorPet.energy - 18, 0, 100);
      targetPet.energy = clamp(targetPet.energy - 18, 0, 100);
      actorPet.hunger = clamp(actorPet.hunger - 8, 0, 100);
      targetPet.hunger = clamp(targetPet.hunger - 8, 0, 100);
      actorState.systems.pet.totalBattles += 1;
      targetState.systems.pet.totalBattles += 1;

      if (actorWon) {
        actorPet.wins += 1;
        targetPet.losses += 1;
        actorState.systems.pet.totalWins += 1;
        await this.economyRepository.mutateWallet(actor.id, reward, "pet_duel_win", tx);
      } else {
        targetPet.wins += 1;
        actorPet.losses += 1;
        targetState.systems.pet.totalWins += 1;
        await this.economyRepository.mutateWallet(targetUser.id, reward, "pet_duel_win", tx);
      }

      const actorXp = grantPetXp(actorPet, actorWon ? 48 : 24);
      const targetXp = grantPetXp(targetPet, actorWon ? 24 : 48);

      finalizePetState(actorState);
      finalizePetState(targetState);
      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);
      await this.playerStateRepository.saveState(targetUser.id, targetState.systems, targetState.settings, tx);

      return {
        title: vi ? "Pet Duel" : "Pet Duel",
        description: actorWon
          ? vi
            ? `**${actorPet.nickname}** danh bai pet cua **${targetDiscordUser.username}**.`
            : `**${actorPet.nickname}** beat **${targetDiscordUser.username}**'s pet.`
          : vi
            ? `Pet cua **${targetDiscordUser.username}** da giu tran dau.`
            : `**${targetDiscordUser.username}**'s pet held the duel.`,
        fields: [
          {
            name: vi ? "Log Nhanh" : "Quick Combat Log",
            value: outcome.log.join("\n"),
            inline: false
          },
          {
            name: vi ? "Thuong" : "Reward",
            value: formatCoins(reward),
            inline: true
          },
          {
            name: vi ? "XP Pet Ban" : "Your Pet XP",
            value: `+${actorXp.gained}${actorXp.levels ? ` | +${actorXp.levels} level` : ""}`,
            inline: true
          },
          {
            name: vi ? "XP Pet Doi Thu" : "Rival Pet XP",
            value: `+${targetXp.gained}${targetXp.levels ? ` | +${targetXp.levels} level` : ""}`,
            inline: true
          }
        ]
      };
    });
  },

  async handlePetAbility(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const pet = this.getActivePetRecord(state);
      const args = this.cleanArgs(context.args);
      const choice = this.normalizeAnswer(args.slice(1).join(" "));

      if (!pet) {
        throw new Error(vi ? "Can co pet active moi doi ability duoc." : "You need an active pet before you can manage abilities.");
      }

      const unlocked = getUnlockedAbilities(pet);
      if (!choice) {
        return {
          title: vi ? "Ability Cua Pet" : "Pet Abilities",
          description: vi
            ? `Ability mo khoa cua **${pet.nickname}**. Dung \`Npet ability <ten>\` de equip.`
            : `Unlocked abilities for **${pet.nickname}**. Use \`Npet ability <name>\` to equip one.`,
          fields: [
            {
              name: vi ? "Danh Sach" : "Unlocked",
              value: formatAbilities(pet),
              inline: false
            }
          ]
        };
      }

      const matched = unlocked.find((abilityKey) => {
        const ability = getAbilityProfile(abilityKey);
        return this.normalizeAnswer(abilityKey) === choice || this.normalizeAnswer(ability.label) === choice;
      });

      if (!matched) {
        throw new Error(vi ? "Ability do chua mo khoa hoac khong ton tai." : "That ability is not unlocked or does not exist.");
      }

      pet.equippedAbility = matched;
      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      const ability = getAbilityProfile(matched);
      return {
        title: vi ? "Da Trang Bi Ability" : "Ability Equipped",
        description: vi
          ? `**${pet.nickname}** dang dung **${ability.label}**.`
          : `**${pet.nickname}** is now using **${ability.label}**.`,
        fields: [
          {
            name: vi ? "Mo Ta" : "Effect",
            value: ability.description,
            inline: false
          }
        ]
      };
    });
  },

  async handlePetIdle(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const pet = this.getActivePetRecord(state);
      const args = this.cleanArgs(context.args);
      const choice = this.normalizeAnswer(args[1] || "");

      
      if (!pet) {
        throw new Error(vi ? "Ban can co pet active moi giao viec idle duoc." : "You need an active pet before assigning idle tasks.");
      }

      if (!choice || ["view", "show", "xem"].includes(choice)) {
        const preview = buildIdleRewards(pet);
        return {
          title: vi ? "Pet Idle" : "Pet Idle",
          description: vi
            ? `Pet dang o che do **${IDLE_TASKS[pet.idle.task]?.label || pet.idle.task}**.`
            : `Your pet is currently on **${IDLE_TASKS[pet.idle.task]?.label || pet.idle.task}** duty.`,
          fields: [
            {
              name: vi ? "Co The Thu" : "Projected Rewards",
              value: preview.ticks
                ? `Coins ${formatCoins(preview.coins)} | XP +${preview.xp} | Keys +${preview.keys}`
                : vi
                  ? "Chua du tick de nhan thuong. Cho no lam viec them chut."
                  : "Not enough idle ticks yet. Let the little gremlin cook a bit longer.",
              inline: false
            }
          ],
          footer: vi
            ? "Dung Npet idle fish/work/scavenge/rest hoac Npet idle collect."
            : "Use Npet idle fish/work/scavenge/rest or Npet idle collect."
        };
      }

      if (["collect", "claim", "nhan"].includes(choice)) {
        const rewards = buildIdleRewards(pet);
        if (!rewards.ticks) {
          throw new Error(vi ? "Chua co loot idle de nhan." : "There is no idle loot ready to collect yet.");
        }

        if (rewards.coins > 0) {
          await this.economyRepository.mutateWallet(actor.id, rewards.coins, "pet_idle_claim", tx);
        }

        if (rewards.xp > 0) {
          grantPetXp(pet, rewards.xp);
          await this.userRepository.addXp(actor.id, Math.floor(rewards.xp * 0.4), tx);
        }

        state.systems.rewards.keys += rewards.keys;
        for (const good of rewards.goods) {
          this.pushOwnedGood(state, good);
        }

        pet.energy = clamp(pet.energy + rewards.energyRecovery, 0, 100);
        pet.moodValue = clamp(pet.moodValue + (rewards.task === "rest" ? 8 : 4), 0, 100);
        pet.totalIdleXp += rewards.xp;
        touchIdleClaim(pet);
        state.systems.pet.totalIdleClaims += 1;
        state.systems.pet.totalLootFinds += rewards.goods.length;

        finalizePetState(state);
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: vi ? "Da Nhan Loot Idle" : "Idle Rewards Claimed",
          description: vi
            ? `${pet.nickname} giao do va khong hoi mot cau nao.`
            : `${pet.nickname} dumped the haul in front of you without explanation.`,
          fields: [
            {
              name: vi ? "Tong Ket" : "Summary",
              value: [
                `Coins ${formatCoins(rewards.coins)}`,
                `Pet XP +${rewards.xp}`,
                `Keys +${rewards.keys}`,
                `${vi ? "Goods" : "Goods"} ${rewards.goods.length ? rewards.goods.join(", ") : "-"}`
              ].join("\n"),
              inline: false
            }
          ]
        };
      }

      const normalizedTask = {
        fish: "fish",
        autofish: "fish",
        work: "work",
        autowork: "work",
        scavenge: "scavenge",
        loot: "scavenge",
        rest: "rest",
        sleep: "rest"
      }[choice];

      if (!normalizedTask) {
        throw new Error(vi ? "Task idle khong hop le. Chon fish, work, scavenge, rest, collect." : "Invalid idle task. Choose fish, work, scavenge, rest, or collect.");
      }

      const nowIso = new Date().toISOString();
      pet.idle.task = normalizedTask;
      pet.idle.startedAt = nowIso;
      pet.idle.lastClaimAt = nowIso;

      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Da Giao Viec Idle" : "Idle Task Set",
        description: vi
          ? `**${pet.nickname}** chuyen sang che do **${IDLE_TASKS[normalizedTask].label}**.`
          : `**${pet.nickname}** is now running **${IDLE_TASKS[normalizedTask].label}**.`,
        fields: [
          {
            name: vi ? "Meo" : "Tip",
            value: vi
              ? "Quay lai bang `Npet idle collect` de rut loot khi du tick."
              : "Come back with `Npet idle collect` once enough ticks have built up.",
            inline: false
          }
        ]
      };
    });
  },

  async handlePetEvolve(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const vi = isVietnamese(context);
      const pet = this.getActivePetRecord(state);

      if (!pet) {
        throw new Error(vi ? "Can co pet moi evolve duoc." : "You need a pet before you can evolve one.");
      }

      if (pet.stage >= 4) {
        throw new Error(vi ? "Pet da o form cuoi roi." : "Your pet is already at its final form.");
      }

      const requiredLevel = pet.stage * 5 + 5;
      const cost = 650 + pet.stage * 420;
      const keyCost = pet.stage >= 3 ? 2 : 1;

      if (pet.level < requiredLevel) {
        throw new Error(vi ? `Pet can dat level ${requiredLevel} moi evolve duoc.` : `Your pet needs to reach level ${requiredLevel} before evolving.`);
      }

      if (Number(summary.wallet) < cost) {
        throw new Error(vi ? `Evolve ton ${formatCoins(cost)}.` : `Evolution costs ${formatCoins(cost)}.`);
      }

      if (state.systems.rewards.keys < keyCost) {
        throw new Error(vi ? `Ban can ${keyCost} key de evolve.` : `You need ${keyCost} key(s) to evolve this pet.`);
      }

      await this.economyRepository.mutateWallet(actor.id, -cost, "pet_evolve", tx);
      state.systems.rewards.keys -= keyCost;

      pet.stage += 1;
      pet.rarity = upgradeRarity(pet.rarity, 1);
      pet.stats.attack += 3 + pet.stage;
      pet.stats.defense += 3 + pet.stage;
      pet.stats.luck += 2 + pet.stage;
      pet.moodValue = clamp(pet.moodValue + 16, 0, 100);
      pet.energy = clamp(pet.energy + 20, 0, 100);
      const xpResult = grantPetXp(pet, 40 + pet.stage * 20);

      finalizePetState(state);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: vi ? "Pet Tien Hoa" : "Pet Evolution",
        description: vi
          ? `**${pet.nickname}** tien hoa thanh **${getPetFormName(pet)}**. Aura dang tang len thay ro.`
          : `**${pet.nickname}** evolved into **${getPetFormName(pet)}**. The aura spike is obvious.`,
        fields: [
          {
            name: vi ? "Chi Phi" : "Cost",
            value: `${formatCoins(cost)} + ${keyCost} key`,
            inline: true
          },
          {
            name: vi ? "Rarity Moi" : "New Rarity",
            value: `${rarityEmoji(pet.rarity)} ${pet.rarity}`,
            inline: true
          },
          {
            name: vi ? "XP Bonus" : "Evolution XP",
            value: `+${xpResult.gained}${xpResult.levels ? ` | +${xpResult.levels} level` : ""}`,
            inline: true
          },
          {
            name: vi ? "Ability Da Mo" : "Unlocked Abilities",
            value: formatAbilities(pet),
            inline: false
          }
        ]
      };
    });
  }
};

module.exports = { petSystemMethods };
