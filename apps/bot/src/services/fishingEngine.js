const RARITY_META = {
  common: { xp: 12, durabilityLoss: 1, rareFactor: 0.85, shinyBonus: 0.002 },
  uncommon: { xp: 24, durabilityLoss: 1, rareFactor: 1, shinyBonus: 0.0025 },
  rare: { xp: 48, durabilityLoss: 2, rareFactor: 1.25, shinyBonus: 0.0032 },
  epic: { xp: 88, durabilityLoss: 2, rareFactor: 1.6, shinyBonus: 0.004 },
  legendary: { xp: 145, durabilityLoss: 3, rareFactor: 2, shinyBonus: 0.0055 }
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function roundTwo(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scaleWeight(fish, rareBoost) {
  const meta = RARITY_META[fish.rarity] || RARITY_META.common;
  const weight = fish.weight * (meta.rareFactor <= 1 ? Math.max(0.45, 1 - rareBoost * 0.12) : 1 + rareBoost * meta.rareFactor);
  return Math.max(0.01, weight);
}

function getRandomFish(fishList, rareBoost) {
  const totalWeight = fishList.reduce((sum, fish) => sum + scaleWeight(fish, rareBoost), 0);
  let rand = Math.random() * totalWeight;

  for (const fish of fishList) {
    const weight = scaleWeight(fish, rareBoost);
    if (rand < weight) {
      return fish;
    }
    rand -= weight;
  }

  return fishList[fishList.length - 1];
}

function buildFishingResult({ map, rod, bait, petBonus = 0 }) {
  const rodMeta = rod?.metadata || {};
  const baitMeta = bait?.metadata || {};
  const rodTier = (rod?.upgrade_level || 0) + (rodMeta.tier || 1);
  const rareBoost =
    (rodMeta.rare_bonus || 0) +
    Math.max(0, rodTier - 1) * 0.035 +
    (baitMeta.luck || 0) * 1.35 +
    petBonus * 0.45;
  const speedBonus =
    (rodMeta.speed_bonus || 0) +
    (baitMeta.speed_bonus || 0) +
    Math.max(0, rodTier - 1) * 0.025;

  const caughtFish = getRandomFish(map.fish, rareBoost);
  const rarityMeta = RARITY_META[caughtFish.rarity] || RARITY_META.common;
  const weightKg = roundTwo(
    randomFloat(caughtFish.weightKgRange[0], caughtFish.weightKgRange[1]) *
      (1 + rareBoost * 0.05)
  );
  const lengthCm = roundTwo(
    randomFloat(caughtFish.lengthCmRange[0], caughtFish.lengthCmRange[1]) *
      (1 + rareBoost * 0.04)
  );
  const shinyChance =
    caughtFish.shinyChance +
    rarityMeta.shinyBonus +
    rareBoost * 0.01 +
    speedBonus * 0.006;
  const isShiny = Math.random() < Math.min(0.05, shinyChance);
  const qualityScore = clamp(
    randomInt(54, 88) + rodTier * 3 + Math.floor(rareBoost * 18) + (isShiny ? 10 : 0),
    30,
    100
  );
  let estimatedValue = randomInt(caughtFish.valueRange[0], caughtFish.valueRange[1]);
  estimatedValue += Math.floor(qualityScore * (caughtFish.rarity === "legendary" ? 3.2 : 2.1));
  if (isShiny) {
    estimatedValue = Math.floor(estimatedValue * 2.35);
  }

  const chest =
    Math.random() <
    Math.min(0.45, map.chestChance + rareBoost * 0.015 + (caughtFish.rarity === "legendary" ? 0.05 : 0));
  const coinBonus = chest ? randomInt(60, 180) + Math.floor(estimatedValue * 0.08) : 0;
  const castDelayMs = clamp(
    Math.round(randomInt(2_000, 5_000) - speedBonus * 1_600 - rodTier * 120),
    2_000,
    5_000
  );

  return {
    species_key: caughtFish.key,
    species_name: isShiny ? `Shiny ${caughtFish.name}` : caughtFish.name,
    base_species_name: caughtFish.name,
    biome: map.key,
    map_key: map.key,
    rarity: caughtFish.rarity,
    weight_kg: weightKg.toFixed(2),
    length_cm: lengthCm.toFixed(2),
    quality_score: qualityScore,
    estimated_value: estimatedValue,
    xp: rarityMeta.xp + Math.floor(qualityScore / 2) + (isShiny ? 35 : 0),
    durability_loss: rarityMeta.durabilityLoss + (caughtFish.rarity === "legendary" ? 1 : 0),
    chest,
    trash: false,
    bait_used: Boolean(bait),
    coin_bonus: coinBonus,
    is_boss: false,
    is_jackpot: false,
    is_shiny: isShiny,
    cast_delay_ms: castDelayMs,
    flavor_text: isShiny
      ? "The water flashed, the reel screamed, and a shiny flex fish hit the line."
      : `A clean pull from ${map.label}.`,
    bite_line: chest
      ? "The float dipped hard. Something greedy was down there."
      : "The line twitched, the reel hummed, and the map paid out."
  };
}

module.exports = {
  buildFishingResult
};
