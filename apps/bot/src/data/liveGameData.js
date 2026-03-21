const { FISHING_MAPS } = require("./fishingMaps");
const WORK_ACTIVITIES = {
  mine: {
    label: "Mine Rush",
    levelKey: "mineLevel",
    statKey: "ore",
    rewardRange: [95, 180],
    xpRange: [18, 36],
    lootRange: [1, 3],
    flavor: [
      "You bullied a crystal wall until it apologized with shiny ore.",
      "A gremlin foreman screamed 'faster' and the cave dropped extra coins.",
      "You found a suspiciously glowing rock and absolutely kept it."
    ]
  },
  hunt: {
    label: "Hunt Sprint",
    levelKey: "huntLevel",
    statKey: "pelts",
    rewardRange: [90, 170],
    xpRange: [16, 32],
    lootRange: [1, 3],
    flavor: [
      "You returned with pelts, stories, and at least one heroic leaf in your hair.",
      "A forest critter tried to unionize against you. You still got paid.",
      "You tracked footprints through chaos and came back richer."
    ]
  },
  farm: {
    label: "Farm Frenzy",
    levelKey: "farmLevel",
    statKey: "crops",
    rewardRange: [80, 155],
    xpRange: [14, 28],
    lootRange: [2, 5],
    flavor: [
      "You watered crops with determination and a tiny bit of panic.",
      "The harvest looked illegal. The market loved it anyway.",
      "You planted chaos and reaped profit."
    ]
  },
  cook: {
    label: "Kitchen Combo",
    levelKey: "cookLevel",
    statKey: "meals",
    rewardRange: [100, 190],
    xpRange: [18, 34],
    lootRange: [1, 2],
    flavor: [
      "Your pan made battle noises, but the food sold out instantly.",
      "A flaming saute moment became a premium menu item.",
      "You served suspiciously addictive comfort food and got tipped."
    ]
  },
  deliver: {
    label: "Delivery Dash",
    levelKey: "deliverLevel",
    statKey: "packages",
    rewardRange: [85, 175],
    xpRange: [15, 30],
    lootRange: [1, 3],
    flavor: [
      "You yeeted parcels across the city with elite goblin efficiency.",
      "Every box arrived mostly upright, which counts as excellence.",
      "Traffic lost. You won. The customers screamed five stars."
    ]
  }
};

const PET_SPECIES = {
  pup: {
    name: "Milk Hound",
    nameVi: "Khuyển Sữa",
    cost: 1200,
    feedBoost: 22,
    playBoost: 20,
    xpBoost: 14,
    passiveBonus: 0.03
  },
  slime: {
    name: "Mint Slime",
    nameVi: "Slime Bạc Hà",
    cost: 1500,
    feedBoost: 18,
    playBoost: 26,
    xpBoost: 16,
    passiveBonus: 0.04
  },
  dragon: {
    name: "Pocket Dragon",
    nameVi: "Rồng Bỏ Túi",
    cost: 2800,
    feedBoost: 15,
    playBoost: 18,
    xpBoost: 22,
    passiveBonus: 0.06
  },
  fox: {
    name: "Neon Fox",
    nameVi: "Cáo Neon",
    cost: 2100,
    feedBoost: 19,
    playBoost: 24,
    xpBoost: 18,
    passiveBonus: 0.05
  },
  axolotl: {
    name: "Bubble Axolotl",
    nameVi: "Axolotl Bong Bóng",
    cost: 1850,
    feedBoost: 21,
    playBoost: 21,
    xpBoost: 17,
    passiveBonus: 0.045
  },
  crow: {
    name: "Vault Crow",
    nameVi: "Quạ Kho Báu",
    cost: 2400,
    feedBoost: 16,
    playBoost: 22,
    xpBoost: 20,
    passiveBonus: 0.055
  }
};

const HOUSE_STYLES = {
  shack: { label: "Starter Shack", labelVi: "Nhà Tạm Khởi Đầu", buyCost: 2800, upgradeBase: 1900 },
  loft: { label: "Neon Loft", labelVi: "Căn Gác Neon", buyCost: 7200, upgradeBase: 3600 },
  manor: { label: "Moon Manor", labelVi: "Dinh Thự Trăng", buyCost: 15000, upgradeBase: 6200 }
};

const ZONES = Object.fromEntries(
  FISHING_MAPS.map((entry) => [
    entry.key,
    {
      label: entry.label,
      labelVi: entry.labelVi,
      unlockLevel: entry.unlockLevel,
      fare: entry.fare,
      danger: entry.danger,
      rewardRange: entry.rewardRange,
      chestChance: entry.chestChance,
      fishCount: entry.fish.length,
      description: entry.description,
      descriptionVi: entry.descriptionVi
    }
  ])
);

const QUIZ_BANK = [
  {
    prompt: "What material is bamboo mainly famous for in this bot?",
    promptVi: "Trong bot này, tre nổi tiếng nhất vì làm từ gì?",
    answer: "rod",
    hint: "It smacks fish professionally.",
    hintVi: "Nó chuyên dùng để vụt cá."
  },
  {
    prompt: "What command alias already exists for coinflip?",
    promptVi: "Alias nào đã có sẵn cho coinflip?",
    answer: "cf",
    hint: "Two letters, one bad decision.",
    hintVi: "Hai chữ cái, một quyết định sai lầm."
  },
  {
    prompt: "What biome does Nfish default to?",
    promptVi: "Biome mặc định của `Nfish` là gì?",
    answer: "reef",
    hint: "Warm, splashy, beginner-friendly.",
    hintVi: "Ấm áp, bắn nước, thân thiện cho người mới."
  },
  {
    prompt: "What coin does this economy worship?",
    promptVi: "Nền kinh tế này tôn thờ đồng coin nào?",
    answer: "milk",
    hint: "Dairy supremacy.",
    hintVi: "Quyền lực sữa bò."
  }
];

const FASTTYPE_PHRASES = [
  "milk coins never sleep",
  "one more spin for science",
  "chaos economy speedrun",
  "deep sea jackpot fish",
  "gremlin profit protocol"
];

const REDEEM_CODES = {
  MILKSTART: {
    coins: 500,
    xp: 80,
    keys: 1,
    description: "Starter sugar rush.",
    descriptionVi: "Cú tăng đường mở màn."
  },
  CHAOS2026: {
    coins: 900,
    xp: 150,
    keys: 2,
    description: "Season opener nonsense.",
    descriptionVi: "Mớ hỗn loạn khai mùa."
  },
  DEEPSEA: {
    coins: 650,
    xp: 120,
    keys: 1,
    description: "Ocean tax refund.",
    descriptionVi: "Tiền hoàn thuế từ đại dương."
  }
};

const MARKET_TEMPLATES = [
  "Glitter Rod Skin",
  "Pet Snack Crate",
  "Dungeon Map Fragment",
  "Island Defense Drone",
  "House Party Pass"
];

const DEEPSEA_SPECIES = [
  { key: "abyss_lantern", name: "Abyss Lanternfish", rarity: "uncommon", valueRange: [140, 240] },
  { key: "tide_reaper", name: "Tide Reaper Eel", rarity: "rare", valueRange: [220, 420] },
  { key: "void_koi", name: "Void Koi", rarity: "epic", valueRange: [380, 680] },
  { key: "star_whale", name: "Starfall Whale Pup", rarity: "legendary", valueRange: [650, 1200] }
];

function createDefaultSystems() {
  return {
    economy: {
      invested: 0,
      loanBalance: 0,
      loanTakenAt: null,
      lastInterestAt: null,
      totalInterestCollected: 0,
      totalLotterySpent: 0
    },
    work: {
      mineLevel: 1,
      huntLevel: 1,
      farmLevel: 1,
      cookLevel: 1,
      deliverLevel: 1,
      ore: 0,
      pelts: 0,
      crops: 0,
      meals: 0,
      packages: 0,
      totalShifts: 0
    },
    fishing: {
      deepseaLevel: 1,
      netLevel: 1,
      deepseaCatches: 0,
      netCasts: 0,
      aquarium: [],
      released: 0,
      mutations: 0
    },
    island: {
      owned: false,
      tier: 0,
      fishStock: 0,
      shells: 0,
      defense: 0,
      visitors: 0,
      name: "Unclaimed Sand Lump"
    },
    pet: {
      owned: false,
      speciesKey: null,
      stage: 0,
      xp: 0,
      hunger: 100,
      joy: 100,
      energy: 100,
      lastFedAt: null,
      lastPlayedAt: null,
      activePetId: null,
      stableSlots: 3,
      totalTraining: 0,
      totalBattles: 0,
      totalWins: 0,
      totalIdleClaims: 0,
      totalLootFinds: 0,
      pets: []
    },
    social: {
      partnerUserId: null,
      familyBlessing: 0,
      giftsSent: 0,
      giftsReceived: 0
    },
    housing: {
      owned: false,
      style: "shack",
      tier: 0,
      comfort: 0,
      decorations: []
    },
    crime: {
      heat: 0,
      bounty: 0,
      jailUntil: null,
      steals: 0,
      arrests: 0,
      escapes: 0
    },
    market: {
      sales: 0,
      purchases: 0,
      auctionWins: 0,
      ownedGoods: []
    },
    minigames: {
      quizWins: 0,
      fasttypeWins: 0,
      guessWins: 0,
      battleWins: 0,
      streak: 0,
      pendingQuiz: null,
      pendingFasttype: null,
      pendingGuess: null
    },
    world: {
      zone: "milk_docks",
      discovered: ["milk_docks"],
      travelCount: 0,
      dungeonClears: 0
    },
    rewards: {
      keys: 1,
      chestsOpened: 0,
      redeemedCodes: [],
      giftedCoins: 0
    },
    utility: {
      favoriteZone: "milk_docks",
      profileStyle: "chaotic"
    }
  };
}

function createDefaultSettings() {
  return {
    language: "en",
    notifications: true,
    compactProfile: false,
    chaosMode: "maximum",
    profileTheme: "chaotic"
  };
}

function createWorldDefaults() {
  return {
    jackpotPool: 15000,
    lastWinnerUserId: null,
    lastWinAmount: 0,
    featuredTemplateIndex: 0
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDefaults(defaultValue, existingValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(existingValue) ? existingValue : clone(defaultValue);
  }

  if (defaultValue && typeof defaultValue === "object") {
    const merged = {};
    const source = existingValue && typeof existingValue === "object" ? existingValue : {};
    for (const key of Object.keys(defaultValue)) {
      merged[key] = mergeDefaults(defaultValue[key], source[key]);
    }
    for (const key of Object.keys(source)) {
      if (!(key in merged)) {
        merged[key] = source[key];
      }
    }
    return merged;
  }

  return existingValue === undefined ? defaultValue : existingValue;
}

module.exports = {
  WORK_ACTIVITIES,
  FISHING_MAPS,
  PET_SPECIES,
  HOUSE_STYLES,
  ZONES,
  QUIZ_BANK,
  FASTTYPE_PHRASES,
  REDEEM_CODES,
  MARKET_TEMPLATES,
  DEEPSEA_SPECIES,
  createDefaultSystems,
  createDefaultSettings,
  createWorldDefaults,
  mergeDefaults
};
