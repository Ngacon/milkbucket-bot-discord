function fish(
  key,
  name,
  rarity,
  weight,
  valueMin,
  valueMax,
  kgMin,
  kgMax,
  cmMin,
  cmMax,
  shinyChance = 0.0025
) {
  return {
    key,
    name,
    rarity,
    weight,
    valueRange: [valueMin, valueMax],
    weightKgRange: [kgMin, kgMax],
    lengthCmRange: [cmMin, cmMax],
    shinyChance
  };
}

function map(config) {
  return config;
}

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const FISHING_MAPS = [
  map({
    key: "milk_docks",
    label: "Milk Docks",
    labelVi: "Bến Sữa",
    aliases: ["docks", "milk", "harbor"],
    unlockLevel: 1,
    fare: 0,
    danger: 1,
    rewardRange: [80, 150],
    chestChance: 0.1,
    description: "A cozy beginner port with easy bites, loud gulls, and suspiciously cheap bait.",
    descriptionVi: "Bến cảng dễ câu cho người mới, hải âu la oai oái và mồi câu rẻ một cách đáng ngờ.",
    fish: [
      fish("milk_sardine", "Milk Sardine", "common", 28, 18, 34, 0.3, 0.9, 12, 26),
      fish("dock_minnow", "Dock Minnow", "common", 24, 20, 38, 0.4, 1.1, 14, 30),
      fish("rope_tetra", "Rope Tetra", "common", 18, 28, 45, 0.5, 1.4, 18, 34),
      fish("butter_goby", "Butter Goby", "common", 14, 30, 52, 0.7, 1.7, 20, 38),
      fish("crate_bream", "Crate Bream", "uncommon", 10, 55, 85, 1.1, 2.2, 26, 48, 0.003),
      fish("whistle_perch", "Whistle Perch", "uncommon", 8, 62, 96, 1.3, 2.6, 28, 52, 0.003),
      fish("harbor_koi", "Harbor Koi", "rare", 5, 110, 170, 2.2, 4.6, 34, 72, 0.004),
      fish("anchor_tuna", "Anchor Tuna", "rare", 3.5, 135, 210, 3.1, 5.8, 42, 88, 0.004),
      fish("dock_glowfin", "Dock Glowfin", "epic", 1.3, 260, 380, 4.8, 8.4, 54, 110, 0.0055),
      fish("milky_marlin", "Milky Marlin", "legendary", 0.45, 520, 840, 7.8, 14.5, 90, 170, 0.007)
    ]
  }),
  map({
    key: "coral_garden",
    label: "Coral Garden",
    labelVi: "Vườn San Hô",
    aliases: ["coral", "reef", "garden"],
    unlockLevel: 3,
    fare: 220,
    danger: 2,
    rewardRange: [120, 220],
    chestChance: 0.13,
    description: "Bright reef lanes packed with colorful fish, fast bites, and clean progression.",
    descriptionVi: "Những lối rạn sáng rực đầy cá màu mè, cá cắn nhanh và tiến trình rất mượt.",
    fish: [
      fish("coral_dart", "Coral Dart", "common", 26, 26, 42, 0.4, 1.0, 14, 28),
      fish("reef_popper", "Reef Popper", "common", 22, 30, 48, 0.6, 1.3, 18, 32),
      fish("shell_runner", "Shell Runner", "common", 17, 34, 58, 0.8, 1.7, 20, 38),
      fish("mint_clown", "Mint Clownfish", "common", 13, 38, 64, 0.9, 1.9, 22, 40),
      fish("coral_puffer", "Coral Puffer", "uncommon", 10, 70, 108, 1.4, 2.8, 26, 52, 0.003),
      fish("sea_ribbon", "Sea Ribbon", "uncommon", 8, 82, 126, 1.8, 3.2, 32, 60, 0.003),
      fish("glass_angel", "Glass Angel", "rare", 5, 135, 210, 2.6, 4.8, 36, 74, 0.004),
      fish("sunscale_snapper", "Sunscale Snapper", "rare", 3.2, 160, 248, 3.4, 5.9, 42, 88, 0.004),
      fish("prism_raylet", "Prism Raylet", "epic", 1.1, 320, 470, 5.2, 9.3, 60, 118, 0.006),
      fish("crown_koi", "Crown Koi", "legendary", 0.4, 650, 980, 8.8, 15.4, 96, 176, 0.0075)
    ]
  }),
  map({
    key: "kelp_labyrinth",
    label: "Kelp Labyrinth",
    labelVi: "Mê Cung Rong Bẹ",
    aliases: ["kelp", "forest", "labyrinth"],
    unlockLevel: 4,
    fare: 320,
    danger: 2,
    rewardRange: [135, 235],
    chestChance: 0.14,
    description: "Dense kelp tunnels where fish hide hard and loot quality starts climbing.",
    descriptionVi: "Đường hầm rong bẹ dày đặc, cá trốn kỹ hơn và chất lượng loot bắt đầu leo lên.",
    fish: [
      fish("kelp_drifter", "Kelp Drifter", "common", 25, 32, 50, 0.5, 1.1, 16, 30),
      fish("weed_skater", "Weed Skater", "common", 21, 36, 54, 0.7, 1.4, 18, 34),
      fish("frond_biter", "Frond Biter", "common", 16, 40, 62, 0.8, 1.8, 22, 40),
      fish("shade_dace", "Shade Dace", "common", 12, 45, 68, 0.9, 2.0, 24, 42),
      fish("kelp_perch", "Kelp Perch", "uncommon", 10, 76, 116, 1.5, 3.0, 28, 56, 0.003),
      fish("eel_moss", "Moss Eel", "uncommon", 7.5, 88, 132, 1.9, 3.6, 34, 64, 0.003),
      fish("lantern_wrasse", "Lantern Wrasse", "rare", 5, 146, 222, 2.8, 5.0, 40, 78, 0.004),
      fish("drift_serpent", "Drift Serpent", "rare", 3.1, 175, 268, 3.6, 6.2, 48, 96, 0.0045),
      fish("emerald_stalker", "Emerald Stalker", "epic", 1.05, 340, 495, 5.6, 9.8, 66, 126, 0.006),
      fish("maze_leviathan", "Maze Leviathan", "legendary", 0.35, 720, 1080, 9.5, 16.6, 102, 184, 0.008)
    ]
  }),
  map({
    key: "stormbreak_cove",
    label: "Stormbreak Cove",
    labelVi: "Vịnh Bão Vỡ",
    aliases: ["storm", "cove", "break"],
    unlockLevel: 5,
    fare: 420,
    danger: 3,
    rewardRange: [150, 270],
    chestChance: 0.16,
    description: "Windy water with faster bites, meaner fish, and better payout spikes.",
    descriptionVi: "Vùng nước gió giật, cá cắn nhanh hơn, hung hơn và tiền thưởng bật mạnh hơn.",
    fish: [
      fish("foam_mullet", "Foam Mullet", "common", 24, 38, 58, 0.6, 1.3, 18, 32),
      fish("gust_bass", "Gust Bass", "common", 20, 42, 62, 0.8, 1.6, 22, 38),
      fish("spray_runner", "Spray Runner", "common", 16, 46, 70, 1.0, 2.0, 24, 44),
      fish("squall_herring", "Squall Herring", "common", 12, 50, 76, 1.2, 2.2, 28, 48),
      fish("thunder_porgy", "Thunder Porgy", "uncommon", 9.5, 88, 128, 1.7, 3.2, 30, 60, 0.003),
      fish("bolt_mackerel", "Bolt Mackerel", "uncommon", 7.5, 96, 142, 2.0, 3.8, 36, 68, 0.003),
      fish("wave_slasher", "Wave Slasher", "rare", 4.8, 160, 235, 3.0, 5.4, 42, 84, 0.0045),
      fish("tempest_ray", "Tempest Ray", "rare", 3.2, 188, 280, 4.0, 6.8, 50, 102, 0.0045),
      fish("storm_sailfin", "Storm Sailfin", "epic", 1.1, 360, 525, 6.0, 10.2, 70, 132, 0.0065),
      fish("skybreaker_tuna", "Skybreaker Tuna", "legendary", 0.42, 760, 1140, 10.2, 17.4, 108, 190, 0.008)
    ]
  }),
  map({
    key: "moonreef_harbor",
    label: "Moonreef Harbor",
    labelVi: "Cảng Rạn Trăng",
    aliases: ["moonreef", "moon", "harbor_night"],
    unlockLevel: 6,
    fare: 520,
    danger: 3,
    rewardRange: [165, 290],
    chestChance: 0.17,
    description: "Night-lit water with cleaner rare odds and some very shiny flex fish.",
    descriptionVi: "Mặt nước sáng đêm với tỉ lệ cá hiếm đẹp hơn và vài con shiny để khoe cực gắt.",
    fish: [
      fish("luna_shrimp", "Luna Shrimp", "common", 23, 44, 64, 0.6, 1.2, 16, 30),
      fish("night_blenny", "Night Blenny", "common", 19, 48, 70, 0.9, 1.7, 20, 36),
      fish("glow_sardine", "Glow Sardine", "common", 15, 54, 76, 1.0, 2.0, 22, 40),
      fish("pearl_biter", "Pearl Biter", "common", 11, 58, 84, 1.1, 2.2, 26, 44),
      fish("moon_snapper", "Moon Snapper", "uncommon", 9, 96, 138, 1.8, 3.3, 30, 62, 0.0035),
      fish("silver_orbit", "Silver Orbit", "uncommon", 7.2, 108, 152, 2.1, 3.9, 36, 70, 0.0035),
      fish("starlight_koi", "Starlight Koi", "rare", 4.6, 175, 255, 3.1, 5.6, 42, 86, 0.005),
      fish("ghost_barracuda", "Ghost Barracuda", "rare", 3.1, 206, 305, 4.2, 7.2, 52, 108, 0.005),
      fish("halo_drakefish", "Halo Drakefish", "epic", 1.0, 390, 560, 6.5, 10.8, 72, 136, 0.007),
      fish("moonveil_marlin", "Moonveil Marlin", "legendary", 0.38, 810, 1190, 10.8, 18.0, 112, 194, 0.0085)
    ]
  }),
  map({
    key: "neon_bazaar",
    label: "Neon Bazaar",
    labelVi: "Chợ Neon",
    aliases: ["neon", "bazaar", "market"],
    unlockLevel: 7,
    fare: 650,
    danger: 3,
    rewardRange: [180, 310],
    chestChance: 0.18,
    description: "City-water chaos with pricey fish, flashy variants, and strong collection value.",
    descriptionVi: "Nước chảy giữa phố hỗn loạn, cá đắt tiền, biến thể chói lóa và giá trị sưu tầm cao.",
    fish: [
      fish("wire_guppy", "Wire Guppy", "common", 22, 52, 74, 0.7, 1.4, 18, 32),
      fish("spark_tetra", "Spark Tetra", "common", 18, 56, 80, 0.9, 1.8, 22, 36),
      fish("chrome_minnow", "Chrome Minnow", "common", 14, 60, 88, 1.1, 2.0, 24, 40),
      fish("circuit_eellet", "Circuit Eellet", "common", 10.5, 66, 94, 1.2, 2.4, 28, 46),
      fish("glitter_perch", "Glitter Perch", "uncommon", 8.5, 108, 152, 1.9, 3.6, 32, 64, 0.0035),
      fish("laser_jelly", "Laser Jelly", "uncommon", 6.8, 118, 166, 2.2, 4.0, 38, 72, 0.0035),
      fish("neon_angler", "Neon Angler", "rare", 4.5, 190, 275, 3.4, 5.8, 44, 92, 0.005),
      fish("club_krill", "Club Krill King", "rare", 3.0, 220, 320, 4.4, 7.5, 54, 110, 0.005),
      fish("holo_sting", "Holo Sting", "epic", 0.95, 410, 585, 6.8, 11.2, 74, 140, 0.007),
      fish("bazaar_phantom", "Bazaar Phantom", "legendary", 0.34, 860, 1240, 11.0, 18.6, 116, 198, 0.0085)
    ]
  }),
  map({
    key: "sunken_palace",
    label: "Sunken Palace",
    labelVi: "Cung Điện Chìm",
    aliases: ["palace", "sunken", "ruins"],
    unlockLevel: 8,
    fare: 780,
    danger: 4,
    rewardRange: [210, 360],
    chestChance: 0.2,
    description: "Treasure-heavy ruins where the fish are elegant and the chests start showing up.",
    descriptionVi: "Tàn tích ngập kho báu, cá ở đây sang chảnh và rương bắt đầu xuất hiện thường xuyên.",
    fish: [
      fish("ruin_carp", "Ruin Carp", "common", 21, 60, 84, 0.8, 1.5, 20, 34),
      fish("tile_blade", "Tile Bladefish", "common", 17, 64, 90, 1.0, 1.9, 24, 38),
      fish("coin_puffer", "Coin Puffer", "common", 13, 70, 98, 1.2, 2.2, 26, 42),
      fish("statue_loach", "Statue Loach", "common", 10, 74, 104, 1.3, 2.6, 30, 48),
      fish("royal_discus", "Royal Discus", "uncommon", 8, 122, 172, 2.0, 3.8, 34, 66, 0.0035),
      fish("silk_tangler", "Silk Tangler", "uncommon", 6.5, 132, 186, 2.3, 4.2, 40, 74, 0.0035),
      fish("vault_orfe", "Vault Orfe", "rare", 4.2, 208, 298, 3.6, 6.0, 48, 96, 0.005),
      fish("heirloom_ray", "Heirloom Ray", "rare", 2.8, 236, 338, 4.8, 7.8, 58, 116, 0.005),
      fish("throne_serpent", "Throne Serpent", "epic", 0.9, 445, 625, 7.0, 11.8, 80, 146, 0.007),
      fish("palace_celestine", "Palace Celestine", "legendary", 0.3, 910, 1310, 11.5, 19.0, 118, 202, 0.0085)
    ]
  }),
  map({
    key: "volcano_core",
    label: "Volcano Core",
    labelVi: "Lõi Núi Lửa",
    aliases: ["volcano", "lava", "core"],
    unlockLevel: 9,
    fare: 960,
    danger: 4,
    rewardRange: [230, 390],
    chestChance: 0.22,
    description: "Hot water, angry fish, bigger payouts, and a much sharper durability tax.",
    descriptionVi: "Nước nóng, cá gắt, payout lớn hơn và độ bền dụng cụ tụt đau hơn hẳn.",
    fish: [
      fish("ash_chub", "Ash Chub", "common", 20, 68, 92, 0.9, 1.6, 22, 36),
      fish("ember_minnow", "Ember Minnow", "common", 16, 74, 100, 1.1, 2.0, 24, 40),
      fish("smoke_blade", "Smoke Blade", "common", 12.5, 80, 110, 1.3, 2.4, 28, 46),
      fish("cinder_runt", "Cinder Runt", "common", 9.5, 86, 118, 1.5, 2.8, 32, 50),
      fish("magma_snapper", "Magma Snapper", "uncommon", 7.8, 134, 188, 2.2, 4.0, 36, 70, 0.0035),
      fish("lava_pike", "Lava Pike", "uncommon", 6.2, 146, 202, 2.6, 4.5, 42, 78, 0.0035),
      fish("forge_sting", "Forge Sting", "rare", 4.0, 226, 320, 3.8, 6.4, 52, 102, 0.005),
      fish("pyre_serpent", "Pyre Serpent", "rare", 2.6, 255, 360, 5.0, 8.0, 62, 122, 0.005),
      fish("inferno_tuna", "Inferno Tuna", "epic", 0.85, 470, 660, 7.6, 12.6, 84, 152, 0.0075),
      fish("crown_of_embers", "Crown of Embers", "legendary", 0.28, 960, 1380, 12.0, 19.6, 122, 206, 0.009)
    ]
  }),
  map({
    key: "glacier_basin",
    label: "Glacier Basin",
    labelVi: "Lòng Chảo Băng Hà",
    aliases: ["glacier", "ice", "basin"],
    unlockLevel: 10,
    fare: 1120,
    danger: 4,
    rewardRange: [245, 410],
    chestChance: 0.23,
    description: "Cold, slow water with expensive catches and strong shiny flex potential.",
    descriptionVi: "Mặt nước lạnh và chậm, cá bắt được rất giá trị và cực hợp để flex shiny.",
    fish: [
      fish("frost_sardine", "Frost Sardine", "common", 19, 72, 98, 0.8, 1.5, 20, 34),
      fish("ice_runner", "Ice Runner", "common", 15.5, 78, 106, 1.0, 1.9, 24, 38),
      fish("snow_perch", "Snow Perch", "common", 12, 84, 114, 1.2, 2.2, 28, 42),
      fish("crystal_dace", "Crystal Dace", "common", 9.2, 88, 120, 1.4, 2.5, 30, 46),
      fish("glacier_char", "Glacier Char", "uncommon", 7.5, 142, 198, 2.2, 3.9, 36, 68, 0.0035),
      fish("polar_ribbon", "Polar Ribbon", "uncommon", 6.0, 154, 212, 2.6, 4.4, 40, 76, 0.0035),
      fish("hush_cod", "Hush Cod", "rare", 3.9, 236, 332, 3.8, 6.2, 50, 100, 0.005),
      fish("aurora_pike", "Aurora Pike", "rare", 2.5, 264, 370, 4.8, 7.9, 60, 120, 0.005),
      fish("icefang_sturgeon", "Icefang Sturgeon", "epic", 0.82, 490, 690, 7.8, 12.8, 86, 154, 0.0075),
      fish("frozen_emperor", "Frozen Emperor", "legendary", 0.26, 1000, 1420, 12.2, 20.0, 124, 208, 0.009)
    ]
  }),
  map({
    key: "starfall_abyss",
    label: "Starfall Abyss",
    labelVi: "Vực Sao Rơi",
    aliases: ["abyss", "starfall", "void"],
    unlockLevel: 12,
    fare: 1450,
    danger: 5,
    rewardRange: [280, 520],
    chestChance: 0.28,
    description: "Late-game deep water with brutal odds, absurd value, and cosmic flex fish.",
    descriptionVi: "Vùng nước sâu cuối game với tỉ lệ khắc nghiệt, giá trị phi lý và cá flex mang tầm vũ trụ.",
    fish: [
      fish("abyss_shiner", "Abyss Shiner", "common", 18, 86, 116, 1.0, 1.8, 24, 38),
      fish("void_rasbora", "Void Rasbora", "common", 14.5, 92, 124, 1.2, 2.2, 28, 42),
      fish("meteor_krill", "Meteor Krill", "common", 11.2, 98, 132, 1.5, 2.6, 30, 46),
      fish("blackglass_perch", "Blackglass Perch", "common", 8.8, 104, 140, 1.6, 3.0, 34, 50),
      fish("rift_angler", "Rift Angler", "uncommon", 7.0, 164, 224, 2.5, 4.3, 40, 74, 0.004),
      fish("nova_eel", "Nova Eel", "uncommon", 5.6, 178, 240, 2.8, 4.8, 46, 82, 0.004),
      fish("starscale_serpent", "Starscale Serpent", "rare", 3.6, 270, 376, 4.2, 6.8, 56, 106, 0.0055),
      fish("orbit_manta", "Orbit Manta", "rare", 2.3, 300, 418, 5.4, 8.5, 66, 126, 0.0055),
      fish("nebula_whalelet", "Nebula Whalelet", "epic", 0.76, 560, 780, 8.6, 13.6, 90, 160, 0.008),
      fish("astral_leviathan", "Astral Leviathan", "legendary", 0.22, 1150, 1600, 13.6, 22.4, 132, 218, 0.01)
    ]
  })
];

const FISHING_MAPS_BY_KEY = new Map(FISHING_MAPS.map((entry) => [entry.key, entry]));

function resolveFishingMapKey(rawInput, fallbackKey = "milk_docks") {
  const normalized = normalize(rawInput);
  if (!normalized) {
    return fallbackKey;
  }

  if (FISHING_MAPS_BY_KEY.has(normalized)) {
    return normalized;
  }

  const legacyAliases = {
    reef: "coral_garden",
    island: "moonreef_harbor",
    volcano: "volcano_core"
  };
  if (legacyAliases[normalized]) {
    return legacyAliases[normalized];
  }

  for (const entry of FISHING_MAPS) {
    if (entry.aliases.some((alias) => normalize(alias) === normalized) || normalize(entry.label) === normalized) {
      return entry.key;
    }
  }

  return null;
}

module.exports = {
  FISHING_MAPS,
  FISHING_MAPS_BY_KEY,
  resolveFishingMapKey
};
