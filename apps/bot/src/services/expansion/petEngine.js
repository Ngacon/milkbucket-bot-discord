const { PET_SPECIES } = require("../../data/liveGameData");

const PET_RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythical"];

const PET_PERSONALITIES = {
  lazy: {
    label: "Lazy",
    attackMod: -1,
    defenseMod: 2,
    luckMod: 1,
    hungerRate: 0.85,
    energyRate: 0.78,
    restRecovery: 1.2
  },
  aggressive: {
    label: "Aggressive",
    attackMod: 3,
    defenseMod: -1,
    luckMod: 0,
    hungerRate: 1.12,
    energyRate: 1.08,
    restRecovery: 0.9
  },
  lucky: {
    label: "Lucky",
    attackMod: 0,
    defenseMod: 0,
    luckMod: 4,
    hungerRate: 1,
    energyRate: 0.96,
    restRecovery: 1
  },
  loyal: {
    label: "Loyal",
    attackMod: 1,
    defenseMod: 2,
    luckMod: 1,
    hungerRate: 0.94,
    energyRate: 0.92,
    restRecovery: 1.05
  },
  chaotic: {
    label: "Chaotic",
    attackMod: 2,
    defenseMod: -1,
    luckMod: 3,
    hungerRate: 1.08,
    energyRate: 1.04,
    restRecovery: 0.95
  }
};

const PET_ABILITIES = {
  fisher_frenzy: {
    label: "Fisher Frenzy",
    labelVi: "Cuồng Câu Cá",
    domain: "fishing",
    description: "Boosts fish value, quality, and lucky ocean spikes.",
    descriptionVi: "Tăng giá trị cá, chất lượng cá và các pha nổ vận may ngoài biển.",
    potency: 0.085
  },
  jackpot_nose: {
    label: "Jackpot Nose",
    labelVi: "Mũi Ngửi Jackpot",
    domain: "gambling",
    description: "Adds gambling luck and stronger comeback bursts.",
    descriptionVi: "Tăng vận đỏ khi cờ bạc và giúp lật kèo gắt hơn.",
    potency: 0.08
  },
  scavenger_rush: {
    label: "Scavenger Rush",
    labelVi: "Cơn Lốc Nhặt Nhạnh",
    domain: "idle",
    description: "Finds more loot and stray keys while idling.",
    descriptionVi: "Kiếm thêm loot và chìa khóa lạc trôi khi treo máy.",
    potency: 0.09
  },
  work_burst: {
    label: "Work Burst",
    labelVi: "Bùng Nổ Cày Cuốc",
    domain: "work",
    description: "Boosts work payout and shift XP.",
    descriptionVi: "Tăng tiền công và XP mỗi ca làm việc.",
    potency: 0.075
  },
  guardian_shell: {
    label: "Guardian Shell",
    labelVi: "Mai Hộ Vệ",
    domain: "combat",
    description: "Adds defense, sustain, and duel stability.",
    descriptionVi: "Tăng thủ, độ lì và độ ổn định khi solo.",
    potency: 0.1
  },
  chaos_engine: {
    label: "Chaos Engine",
    labelVi: "Động Cơ Hỗn Loạn",
    domain: "general",
    description: "Small boost to everything with extra swing.",
    descriptionVi: "Buff nhẹ mọi thứ kèm chút dao động hỗn loạn.",
    potency: 0.055
  }
};

const PET_SPECIES_DETAILS = {
  pup: {
    baseRarity: "common",
    baseStats: { attack: 8, defense: 10, luck: 6 },
    personalities: ["loyal", "aggressive", "lucky"],
    forms: ["Milk Pup", "Alpha Hound", "Moon Hound", "Astral Fang"],
    abilities: ["scavenger_rush", "fisher_frenzy", "guardian_shell"]
  },
  slime: {
    baseRarity: "uncommon",
    baseStats: { attack: 7, defense: 8, luck: 10 },
    personalities: ["lazy", "lucky", "chaotic"],
    forms: ["Mint Slime", "Bounce Slime", "Prism Slime", "Nebula Ooze"],
    abilities: ["jackpot_nose", "scavenger_rush", "chaos_engine"]
  },
  dragon: {
    baseRarity: "rare",
    baseStats: { attack: 12, defense: 9, luck: 8 },
    personalities: ["aggressive", "chaotic", "loyal"],
    forms: ["Pocket Dragon", "Flare Dragon", "Storm Dragon", "Void Dragon"],
    abilities: ["fisher_frenzy", "work_burst", "guardian_shell"]
  },
  fox: {
    baseRarity: "uncommon",
    baseStats: { attack: 9, defense: 7, luck: 11 },
    personalities: ["lucky", "chaotic", "aggressive"],
    forms: ["Neon Fox", "Circuit Fox", "Mirage Fox", "Myth Fox"],
    abilities: ["jackpot_nose", "work_burst", "chaos_engine"]
  },
  axolotl: {
    baseRarity: "common",
    baseStats: { attack: 6, defense: 11, luck: 9 },
    personalities: ["lazy", "loyal", "lucky"],
    forms: ["Bubble Axolotl", "Tidal Axolotl", "Glow Axolotl", "Crown Axolotl"],
    abilities: ["fisher_frenzy", "guardian_shell", "scavenger_rush"]
  },
  crow: {
    baseRarity: "rare",
    baseStats: { attack: 10, defense: 8, luck: 10 },
    personalities: ["chaotic", "lucky", "aggressive"],
    forms: ["Vault Crow", "Chrome Crow", "Oracle Crow", "Eclipse Crow"],
    abilities: ["scavenger_rush", "jackpot_nose", "chaos_engine"]
  }
};

const IDLE_TASKS = {
  rest: {
    label: "Rest",
    tickMs: 10 * 60 * 1000
  },
  fish: {
    label: "Auto Fish",
    tickMs: 12 * 60 * 1000
  },
  work: {
    label: "Auto Work",
    tickMs: 12 * 60 * 1000
  },
  scavenge: {
    label: "Scavenge",
    tickMs: 14 * 60 * 1000
  }
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createPetId() {
  return `pet_${Date.now().toString(36)}_${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

function getSpeciesProfile(speciesKey) {
  if (!speciesKey || !PET_SPECIES[speciesKey]) {
    return null;
  }

  return {
    ...PET_SPECIES[speciesKey],
    ...(PET_SPECIES_DETAILS[speciesKey] || {})
  };
}

function getPersonalityProfile(personality) {
  return PET_PERSONALITIES[personality] || PET_PERSONALITIES.loyal;
}

function getAbilityProfile(abilityKey) {
  return {
    key: PET_ABILITIES[abilityKey] ? abilityKey : "chaos_engine",
    ...(PET_ABILITIES[abilityKey] || PET_ABILITIES.chaos_engine)
  };
}

function getMoodEmoji(pet) {
  switch (pet.mood) {
    case "ecstatic":
      return "😄";
    case "happy":
      return "🙂";
    case "grumpy":
      return "😒";
    case "sleepy":
      return "😴";
    case "angry":
      return "😡";
    default:
      return "🙂";
  }
}

function refreshMood(pet) {
  if (pet.energy <= 18 || pet.hunger <= 18) {
    pet.mood = pet.energy <= pet.hunger ? "sleepy" : "angry";
  } else if (pet.moodValue >= 85) {
    pet.mood = "ecstatic";
  } else if (pet.moodValue >= 60) {
    pet.mood = "happy";
  } else if (pet.moodValue >= 35) {
    pet.mood = "grumpy";
  } else {
    pet.mood = "angry";
  }

  return pet.mood;
}

function xpToNextLevel(level) {
  return 60 + level * 45;
}

function getStageAbilityCount(stage) {
  if (stage >= 4) {
    return 3;
  }

  if (stage >= 2) {
    return 2;
  }

  return 1;
}

function getUnlockedAbilities(pet) {
  const profile = getSpeciesProfile(pet.speciesKey);
  if (!profile) {
    return [];
  }

  const source = Array.isArray(pet.abilityKeys) && pet.abilityKeys.length
    ? pet.abilityKeys
    : profile.abilities || [];

  return source.slice(0, getStageAbilityCount(pet.stage));
}

function ensureEquippedAbility(pet) {
  const unlocked = getUnlockedAbilities(pet);
  if (!unlocked.length) {
    pet.equippedAbility = "chaos_engine";
    return pet.equippedAbility;
  }

  if (!unlocked.includes(pet.equippedAbility)) {
    pet.equippedAbility = unlocked[0];
  }

  return pet.equippedAbility;
}

function upgradeRarity(rarity, steps = 1) {
  const index = PET_RARITY_ORDER.indexOf(String(rarity || "").toLowerCase());
  if (index === -1) {
    return PET_RARITY_ORDER[Math.min(steps, PET_RARITY_ORDER.length - 1)];
  }

  return PET_RARITY_ORDER[Math.min(index + steps, PET_RARITY_ORDER.length - 1)];
}

function getPetFormName(pet) {
  const profile = getSpeciesProfile(pet.speciesKey);
  if (!profile || !Array.isArray(profile.forms) || !profile.forms.length) {
    return pet.nickname || "Unknown Pet";
  }

  return profile.forms[Math.min(profile.forms.length - 1, Math.max(0, pet.stage - 1))];
}

function createPetRecord(speciesKey, options = {}) {
  const profile = getSpeciesProfile(speciesKey);
  if (!profile) {
    return null;
  }

  const personality = options.personality || pick(profile.personalities || Object.keys(PET_PERSONALITIES));
  const traits = getPersonalityProfile(personality);
  const nowIso = new Date().toISOString();
  const stage = clamp(options.stage || 1, 1, 4);
  const baseStats = {
    attack: Math.max(1, (profile.baseStats?.attack || 8) + traits.attackMod),
    defense: Math.max(1, (profile.baseStats?.defense || 8) + traits.defenseMod),
    luck: Math.max(1, (profile.baseStats?.luck || 8) + traits.luckMod)
  };

  const pet = {
    id: options.id || createPetId(),
    speciesKey,
    nickname: options.nickname || profile.name,
    rarity: options.rarity || upgradeRarity(profile.baseRarity || "common", stage - 1),
    stage,
    level: Math.max(1, options.level || 1),
    xp: Math.max(0, options.xp || 0),
    mood: options.mood || "happy",
    moodValue: clamp(options.moodValue ?? 74, 0, 100),
    energy: clamp(options.energy ?? 100, 0, 100),
    hunger: clamp(options.hunger ?? 88, 0, 100),
    lastFedAt: options.lastFedAt || nowIso,
    lastPlayedAt: options.lastPlayedAt || nowIso,
    lastDecayAt: options.lastDecayAt || nowIso,
    lastTrainedAt: options.lastTrainedAt || null,
    lastBattleAt: options.lastBattleAt || null,
    wins: Math.max(0, options.wins || 0),
    losses: Math.max(0, options.losses || 0),
    trainingCount: Math.max(0, options.trainingCount || 0),
    totalIdleXp: Math.max(0, options.totalIdleXp || 0),
    personality,
    stats: {
      attack: Math.max(1, options.stats?.attack ?? baseStats.attack),
      defense: Math.max(1, options.stats?.defense ?? baseStats.defense),
      luck: Math.max(1, options.stats?.luck ?? baseStats.luck)
    },
    abilityKeys: Array.isArray(options.abilityKeys) && options.abilityKeys.length
      ? options.abilityKeys
      : [...(profile.abilities || ["chaos_engine"])],
    equippedAbility: options.equippedAbility || (profile.abilities || ["chaos_engine"])[0],
    idle: {
      task: options.idle?.task || "rest",
      startedAt: options.idle?.startedAt || nowIso,
      lastClaimAt: options.idle?.lastClaimAt || nowIso,
      totalClaims: Math.max(0, options.idle?.totalClaims || 0)
    }
  };

  ensureEquippedAbility(pet);
  refreshMood(pet);
  return pet;
}

function hydrateLegacyPet(petState) {
  if (!petState?.owned || petState.activePetId || (Array.isArray(petState.pets) && petState.pets.length)) {
    return;
  }

  const speciesKey = petState.speciesKey || "pup";
  const legacyPet = createPetRecord(speciesKey, {
    stage: clamp(petState.stage || 1, 1, 4),
    xp: Math.max(0, petState.xp || 0),
    moodValue: clamp(petState.joy ?? 70, 0, 100),
    hunger: clamp(petState.hunger ?? 88, 0, 100),
    energy: clamp(petState.energy ?? 100, 0, 100),
    lastFedAt: petState.lastFedAt || null,
    lastPlayedAt: petState.lastPlayedAt || null
  });

  legacyPet.level = Math.max(1, legacyPet.stage + Math.floor((petState.xp || 0) / 160));
  petState.pets = [legacyPet];
  petState.activePetId = legacyPet.id;
}

function normalizePetRecord(rawPet) {
  if (!rawPet?.speciesKey) {
    return null;
  }

  return createPetRecord(rawPet.speciesKey, rawPet);
}

function ensurePetStateShape(state) {
  if (!state?.systems?.pet) {
    return null;
  }

  const petState = state.systems.pet;
  if (!Array.isArray(petState.pets)) {
    petState.pets = [];
  }

  hydrateLegacyPet(petState);
  petState.pets = petState.pets.map(normalizePetRecord).filter(Boolean);

  if (!petState.stableSlots) {
    petState.stableSlots = 3;
  }

  if (!petState.activePetId && petState.pets.length) {
    petState.activePetId = petState.pets[0].id;
  }

  if (petState.activePetId && !petState.pets.some((pet) => pet.id === petState.activePetId)) {
    petState.activePetId = petState.pets[0]?.id || null;
  }

  return petState;
}

function getActivePet(state) {
  const petState = ensurePetStateShape(state);
  if (!petState?.activePetId) {
    return null;
  }

  return petState.pets.find((pet) => pet.id === petState.activePetId) || null;
}

function getPetByReference(state, reference) {
  const petState = ensurePetStateShape(state);
  if (!petState?.pets?.length) {
    return null;
  }

  const lowered = String(reference || "")
    .trim()
    .toLowerCase();
  const numericIndex = Number(lowered);
  if (Number.isFinite(numericIndex) && numericIndex >= 1 && numericIndex <= petState.pets.length) {
    return petState.pets[numericIndex - 1];
  }

  return petState.pets.find((pet) => {
    const formName = getPetFormName(pet).toLowerCase();
    return pet.id === reference || pet.nickname.toLowerCase() === lowered || formName === lowered;
  }) || null;
}

function applyPetDecay(pet, now = Date.now()) {
  const lastTouch = new Date(
    pet.lastDecayAt || pet.lastPlayedAt || pet.lastFedAt || new Date(now).toISOString()
  ).getTime();

  if (!Number.isFinite(lastTouch) || now <= lastTouch) {
    pet.lastDecayAt = new Date(now).toISOString();
    refreshMood(pet);
    return false;
  }

  const elapsedHours = (now - lastTouch) / (60 * 60 * 1000);
  if (elapsedHours < 0.08) {
    refreshMood(pet);
    return false;
  }

  const traits = getPersonalityProfile(pet.personality);
  const idleTask = pet.idle?.task || "rest";
  const hungerRate = (idleTask === "rest" ? 3.2 : idleTask === "scavenge" ? 4.5 : 5.4) * traits.hungerRate;
  const energyDelta = idleTask === "rest"
    ? -(8.5 * traits.restRecovery)
    : 6.2 * traits.energyRate;
  const moodDrift = idleTask === "rest" ? 2.5 : -2.3;

  pet.hunger = clamp(pet.hunger - elapsedHours * hungerRate, 0, 100);
  pet.energy = clamp(pet.energy - elapsedHours * energyDelta, 0, 100);
  pet.moodValue = clamp(
    pet.moodValue +
      elapsedHours * moodDrift +
      (pet.hunger < 35 ? -elapsedHours * 6 : 0) +
      (pet.energy < 35 ? -elapsedHours * 5 : 0),
    0,
    100
  );
  pet.lastDecayAt = new Date(now).toISOString();
  refreshMood(pet);
  return true;
}

function applyPetDecayToState(state, now = Date.now()) {
  const petState = ensurePetStateShape(state);
  if (!petState?.pets?.length) {
    return false;
  }

  let changed = false;
  for (const pet of petState.pets) {
    changed = applyPetDecay(pet, now) || changed;
  }

  syncLegacyPetSummary(state);
  return changed;
}

function syncLegacyPetSummary(state) {
  const petState = ensurePetStateShape(state);
  if (!petState) {
    return state;
  }

  const activePet = getActivePet(state);
  petState.owned = Boolean(activePet);
  petState.speciesKey = activePet?.speciesKey || null;
  petState.stage = activePet?.stage || 0;
  petState.xp = activePet?.xp || 0;
  petState.hunger = activePet?.hunger ?? 100;
  petState.joy = activePet?.moodValue ?? 100;
  petState.energy = activePet?.energy ?? 100;
  petState.lastFedAt = activePet?.lastFedAt || null;
  petState.lastPlayedAt = activePet?.lastPlayedAt || null;
  return state;
}

function grantPetXp(pet, amount) {
  const xpGain = Math.max(0, Math.floor(amount || 0));
  if (!xpGain) {
    return { gained: 0, levels: 0 };
  }

  let levels = 0;
  pet.xp += xpGain;

  while (pet.xp >= xpToNextLevel(pet.level)) {
    pet.xp -= xpToNextLevel(pet.level);
    pet.level += 1;
    pet.stats.attack += 1 + (pet.level % 4 === 0 ? 1 : 0);
    pet.stats.defense += 1 + (pet.level % 5 === 0 ? 1 : 0);
    pet.stats.luck += 1 + (pet.level % 3 === 0 ? 1 : 0);
    levels += 1;
  }

  return { gained: xpGain, levels };
}

function calculatePetPassiveBonus(state, domain = "general") {
  const pet = getActivePet(state);
  if (!pet) {
    return 0;
  }

  const profile = getSpeciesProfile(pet.speciesKey);
  const ability = getAbilityProfile(ensureEquippedAbility(pet));
  const personality = getPersonalityProfile(pet.personality);
  const moodMultiplier = pet.energy <= 20 || pet.hunger <= 20
    ? 0.55
    : pet.moodValue >= 82
      ? 1.18
      : pet.moodValue >= 60
        ? 1
        : 0.82;

  let bonus =
    (profile?.passiveBonus || 0) +
    pet.level * 0.0035 +
    pet.stage * 0.014 +
    pet.stats.luck * 0.0014;

  if (domain === ability.domain || ability.domain === "general") {
    bonus += ability.potency;
  }

  if (domain === "fishing" && pet.personality === "lucky") {
    bonus += 0.025;
  }

  if (domain === "gambling" && pet.personality === "chaotic") {
    bonus += 0.022;
  }

  if (domain === "work" && pet.personality === "loyal") {
    bonus += 0.02;
  }

  if (domain === "combat" && pet.personality === "aggressive") {
    bonus += 0.026;
  }

  bonus *= moodMultiplier;
  bonus += personality.luckMod * 0.002;

  return clamp(bonus, 0, 0.42);
}

function calculatePetBattleRating(state) {
  const pet = getActivePet(state);
  if (!pet) {
    return 0;
  }

  return Math.floor(
    pet.level * 4 +
      pet.stage * 9 +
      pet.stats.attack * 1.8 +
      pet.stats.defense * 1.6 +
      pet.stats.luck * 1.2 +
      calculatePetPassiveBonus(state, "combat") * 100
  );
}

function calculateCombatSnapshot(pet) {
  const ability = getAbilityProfile(ensureEquippedAbility(pet));
  return {
    name: pet.nickname || getPetFormName(pet),
    pet,
    hp: 85 + pet.stage * 18 + pet.level * 7 + pet.stats.defense * 5,
    attack: pet.stats.attack * 2 + pet.level * 1.5 + pet.stage * 3,
    defense: pet.stats.defense * 1.8 + pet.level + pet.stage * 2,
    critChance: 0.05 + pet.stats.luck * 0.004 + (ability.domain === "gambling" ? 0.04 : 0),
    dodgeChance: 0.03 + pet.stats.luck * 0.003,
    lifesteal: ability.key === "scavenger_rush" ? 0.08 : 0,
    ability
  };
}

function simulatePetBattle(actorPet, targetPet) {
  const left = calculateCombatSnapshot(clone(actorPet));
  const right = calculateCombatSnapshot(clone(targetPet));
  const log = [];
  let attacker = left.critChance + left.dodgeChance >= right.critChance + right.dodgeChance ? left : right;
  let defender = attacker === left ? right : left;

  for (let round = 1; round <= 8; round += 1) {
    if (left.hp <= 0 || right.hp <= 0) {
      break;
    }

    const dodgeRoll = Math.random();
    if (dodgeRoll <= defender.dodgeChance) {
      log.push(`R${round}: ${defender.name} dodged ${attacker.name}.`);
    } else {
      let damage = Math.max(
        5,
        Math.floor(attacker.attack + randomInt(-4, 8) - defender.defense * 0.28)
      );

      if (attacker.ability.domain === "combat") {
        damage += Math.floor(3 + attacker.pet.stage * 1.5);
      }

      if (attacker.ability.key === "chaos_engine") {
        damage += randomInt(-2, 6);
      }

      const crit = Math.random() <= attacker.critChance;
      if (crit) {
        damage = Math.floor(damage * 1.5);
      }

      defender.hp = Math.max(0, defender.hp - damage);
      if (attacker.lifesteal > 0 && damage > 0) {
        attacker.hp += Math.floor(damage * attacker.lifesteal);
      }

      if (attacker.ability.key === "guardian_shell") {
        attacker.hp += 3;
      }

      log.push(
        `R${round}: ${attacker.name} hit ${defender.name} for ${damage}${crit ? " CRIT" : ""}.`
      );
    }

    const swap = attacker;
    attacker = defender;
    defender = swap;
  }

  const winner = left.hp >= right.hp ? "actor" : "target";

  return {
    winner,
    actorHp: Math.max(0, left.hp),
    targetHp: Math.max(0, right.hp),
    rounds: log.length,
    log: log.slice(0, 6)
  };
}

function buildIdleRewards(pet, now = Date.now()) {
  const task = IDLE_TASKS[pet.idle?.task] ? pet.idle.task : "rest";
  const tickMs = IDLE_TASKS[task].tickMs;
  const lastClaimAt = new Date(pet.idle?.lastClaimAt || pet.idle?.startedAt || new Date(now).toISOString()).getTime();
  const elapsedMs = Math.max(0, now - lastClaimAt);
  const ticks = clamp(Math.floor(elapsedMs / tickMs), 0, 24);
  const abilityBonus = getAbilityProfile(ensureEquippedAbility(pet)).domain === "idle" ? 0.08 : 0;

  if (!ticks) {
    return {
      task,
      ticks: 0,
      coins: 0,
      xp: 0,
      keys: 0,
      goods: [],
      energyRecovery: task === "rest" ? 8 : 0
    };
  }

  const baseCoins = {
    rest: 0,
    fish: 55 + pet.stage * 12 + pet.stats.luck * 2,
    work: 68 + pet.stage * 14 + pet.stats.attack * 2,
    scavenge: 38 + pet.stage * 10 + pet.stats.luck * 3
  }[task];
  const baseXp = {
    rest: 10 + pet.stage * 3,
    fish: 16 + pet.stage * 5,
    work: 18 + pet.stage * 5,
    scavenge: 14 + pet.stage * 4
  }[task];

  const coins = task === "rest"
    ? 0
    : Math.floor(ticks * baseCoins * (1 + abilityBonus + pet.level * 0.012));
  const xp = Math.floor(ticks * baseXp * (1 + pet.level * 0.01));
  const keyChance = task === "scavenge" ? 0.12 + abilityBonus + pet.stats.luck * 0.002 : 0;
  const keys = Array.from({ length: ticks }).reduce(
    (sum) => sum + (Math.random() < keyChance ? 1 : 0),
    0
  );
  const goods = [];

  if (task === "scavenge") {
    const goodPool = [
      "Pet Snack Crate",
      "Lucky Feather",
      "Rogue Fish Map",
      "Glitter Collar",
      "Mini Treasure Beacon"
    ];

    for (let index = 0; index < ticks; index += 1) {
      if (Math.random() < 0.18 + abilityBonus) {
        goods.push(pick(goodPool));
      }
    }
  }

  return {
    task,
    ticks,
    coins,
    xp,
    keys,
    goods,
    energyRecovery: task === "rest" ? 14 + ticks * 4 : 0
  };
}

function touchIdleClaim(pet, now = Date.now()) {
  if (!pet.idle) {
    pet.idle = {
      task: "rest",
      startedAt: new Date(now).toISOString(),
      lastClaimAt: new Date(now).toISOString(),
      totalClaims: 0
    };
  }

  pet.idle.lastClaimAt = new Date(now).toISOString();
  pet.idle.totalClaims = Math.max(0, pet.idle.totalClaims || 0) + 1;
}

module.exports = {
  PET_ABILITIES,
  PET_PERSONALITIES,
  PET_RARITY_ORDER,
  IDLE_TASKS,
  getSpeciesProfile,
  getAbilityProfile,
  getMoodEmoji,
  getPetFormName,
  getUnlockedAbilities,
  createPetRecord,
  ensurePetStateShape,
  getActivePet,
  getPetByReference,
  syncLegacyPetSummary,
  applyPetDecayToState,
  grantPetXp,
  calculatePetPassiveBonus,
  calculatePetBattleRating,
  simulatePetBattle,
  buildIdleRewards,
  touchIdleClaim,
  upgradeRarity,
  xpToNextLevel
};
