function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function roundTwo(value) {
  return Math.round(value * 100) / 100;
}

function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

function normalizeCoinChoice(choice) {
  const lowered = String(choice || "").toLowerCase();
  if (lowered === "h") {
    return "heads";
  }

  if (lowered === "t") {
    return "tails";
  }

  return lowered;
}

function buildCoinEventTag(choice, bet, won) {
  if (bet >= 2_500 && won) return "high_roller_pop";
  if (bet >= 2_500) return "high_roller_pain";
  if (choice === "heads" && won) return "clean_read";
  if (won) return "backup_heat";
  return "coin_static";
}

function buildCoinMoodText(choice, bet, outcome, won) {
  if (won && bet >= 2_500) {
    return "Backup casino shook the room. That was a premium greed read.";
  }

  if (won) {
    return `The ${outcome} side folded. ${choice} energy is paying rent today.`;
  }

  if (bet >= 2_500) {
    return "That was a loud miss. The table now has fresh gossip about your wallet.";
  }

  return "The flip was rude, but the comeback narrative is still alive.";
}

function resolveCoinflipFallback(payload) {
  const choice = normalizeCoinChoice(payload.choice);
  if (!["heads", "tails"].includes(choice)) {
    throw new Error("choice must be heads or tails");
  }

  const bet = Math.max(1, Math.floor(Number(payload.bet) || 0));
  const outcome = Math.random() < 0.5 ? "heads" : "tails";
  const won = choice === outcome;
  const multiplier = 1.92;
  const profit = won ? Math.floor(bet * (multiplier - 1)) : -bet;
  const payout = won ? bet + profit : 0;

  return {
    outcome,
    won,
    profit,
    payout,
    multiplier,
    event_tag: buildCoinEventTag(choice, bet, won),
    mood_text: buildCoinMoodText(choice, bet, outcome, won),
    flavor_text: won
      ? pick([
          "Fallback casino blinked first. Huge scene.",
          "Local RNG said you are the main character for one round.",
          "You robbed the backup casino and it took it personally."
        ])
      : pick([
          "Backup coin chose violence. Classic.",
          "Local casino inhaled your bet like popcorn.",
          "The emergency coin was disrespectful too."
        ])
  };
}

function normalizeBiome(raw) {
  const lowered = String(raw || "").toLowerCase();
  if (["island", "shore", "beach"].includes(lowered)) {
    return "island";
  }

  if (["volcano", "lava", "ash"].includes(lowered)) {
    return "volcano";
  }

  return "reef";
}

function buildSeaEventTag(biome, rodTier, baitLuck) {
  const roll = Math.random() + rodTier * 0.04 + baitLuck * 0.25;

  if (biome === "volcano" && roll > 1.05) return "molten_fury";
  if (biome === "island" && roll > 0.96) return "trade_winds";
  if (roll > 1.08) return "coral_bloom";
  if (roll > 0.84) return "pressure_shift";
  return "calm_water";
}

function buildSeaMood(biome, eventTag, rarity) {
  if (eventTag === "molten_fury") {
    return "Sea mood: the water feels like it is arguing with the rocks.";
  }

  if (eventTag === "trade_winds") {
    return "Sea mood: warm gusts and greedy fish energy everywhere.";
  }

  if (eventTag === "coral_bloom") {
    return "Sea mood: the biome is glowing like it wants attention.";
  }

  if (rarity === "mythical" || rarity === "legendary") {
    return `Sea mood: ${biome} is acting suspiciously generous right now.`;
  }

  if (eventTag === "pressure_shift") {
    return "Sea mood: something below is moving and it definitely has opinions.";
  }

  return "Sea mood: quiet surface, messy loot table.";
}

const SPECIES_POOL = [
  { key: "reef_sardine", name: "Reef Sardine", biome: "reef", rarity: "common", minKg: 0.4, maxKg: 1.4, minCm: 15, maxCm: 35, baseValue: 40 },
  { key: "reef_puffer", name: "Puffed-Up Menace", biome: "reef", rarity: "uncommon", minKg: 1.2, maxKg: 3.4, minCm: 25, maxCm: 55, baseValue: 115 },
  { key: "reef_glassfin", name: "Glassfin Idol", biome: "reef", rarity: "rare", minKg: 2.1, maxKg: 5.8, minCm: 35, maxCm: 85, baseValue: 320 },
  { key: "reef_sunblade", name: "Sunblade Snapper", biome: "reef", rarity: "epic", minKg: 4.6, maxKg: 9.3, minCm: 50, maxCm: 110, baseValue: 860 },
  { key: "reef_prism", name: "Prism Koi", biome: "reef", rarity: "legendary", minKg: 5.3, maxKg: 11.7, minCm: 70, maxCm: 130, baseValue: 2350 },
  { key: "reef_leviathan", name: "Coral Leviathan", biome: "reef", rarity: "mythical", minKg: 14.0, maxKg: 28.0, minCm: 140, maxCm: 260, baseValue: 7800 },
  { key: "island_mullet", name: "Island Mullet", biome: "island", rarity: "common", minKg: 0.5, maxKg: 1.8, minCm: 18, maxCm: 42, baseValue: 45 },
  { key: "island_parrot", name: "Parrot Biter", biome: "island", rarity: "uncommon", minKg: 1.4, maxKg: 3.8, minCm: 24, maxCm: 60, baseValue: 120 },
  { key: "island_sting", name: "Stingray Jr.", biome: "island", rarity: "rare", minKg: 3.0, maxKg: 7.0, minCm: 45, maxCm: 100, baseValue: 340 },
  { key: "island_monsoon", name: "Monsoon Marlin", biome: "island", rarity: "epic", minKg: 6.5, maxKg: 13.5, minCm: 90, maxCm: 170, baseValue: 950 },
  { key: "island_aurora", name: "Aurora Sailfin", biome: "island", rarity: "legendary", minKg: 8.0, maxKg: 16.8, minCm: 110, maxCm: 200, baseValue: 2580 },
  { key: "island_krakenling", name: "Pocket Krakenling", biome: "island", rarity: "mythical", minKg: 16.5, maxKg: 31.0, minCm: 160, maxCm: 280, baseValue: 8400 },
  { key: "volcano_ashgill", name: "Ashgill", biome: "volcano", rarity: "common", minKg: 0.7, maxKg: 2.0, minCm: 20, maxCm: 48, baseValue: 55 },
  { key: "volcano_magma", name: "Magma Guppy", biome: "volcano", rarity: "uncommon", minKg: 1.8, maxKg: 4.2, minCm: 30, maxCm: 68, baseValue: 140 },
  { key: "volcano_smoketail", name: "Smoketail Tuna", biome: "volcano", rarity: "rare", minKg: 4.2, maxKg: 8.8, minCm: 55, maxCm: 115, baseValue: 390 },
  { key: "volcano_emberjaw", name: "Emberjaw Serpent", biome: "volcano", rarity: "epic", minKg: 7.2, maxKg: 15.4, minCm: 95, maxCm: 185, baseValue: 1080 },
  { key: "volcano_crown", name: "Crown of Cinders", biome: "volcano", rarity: "legendary", minKg: 10.3, maxKg: 19.7, minCm: 120, maxCm: 215, baseValue: 2890 },
  { key: "volcano_phoenix", name: "Phoenix Eel", biome: "volcano", rarity: "mythical", minKg: 18.5, maxKg: 36.5, minCm: 170, maxCm: 320, baseValue: 9200 }
];

function weightedPick(choices) {
  const total = choices.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;

  for (const choice of choices) {
    roll -= choice.weight;
    if (roll <= 0) {
      return choice.item;
    }
  }

  return choices[choices.length - 1].item;
}

function rollRarity(rodTier, baitLuck) {
  const bonus = Math.max(0, rodTier - 1) * 0.9;
  return weightedPick([
    { item: "common", weight: Math.max(10, 57 - bonus * 2.3 - baitLuck * 40) },
    { item: "uncommon", weight: 25 + bonus * 1.2 + baitLuck * 20 },
    { item: "rare", weight: 11 + bonus * 0.8 + baitLuck * 12 },
    { item: "epic", weight: 5 + bonus * 0.35 + baitLuck * 8 },
    { item: "legendary", weight: 1.7 + bonus * 0.15 + baitLuck * 5 },
    { item: "mythical", weight: 0.3 + bonus * 0.08 + baitLuck * 3 }
  ]);
}

function rarityXp(rarity) {
  switch (rarity) {
    case "mythical":
      return 180;
    case "legendary":
      return 130;
    case "epic":
      return 90;
    case "rare":
      return 55;
    case "uncommon":
      return 30;
    default:
      return 12;
  }
}

function buildTrash(biome, baitUsed, eventTag) {
  const trashNames = ["Cursed Sandal", "Suspicious Tire", "Wet Homework", "Plastic Emperor"];
  const name = pick(trashNames);

  return {
    species_key: `trash_${name.toLowerCase().replace(/\s+/g, "_")}`,
    species_name: name,
    biome,
    rarity: "common",
    weight_kg: roundTwo(randomFloat(0.8, 4.0)).toFixed(2),
    length_cm: roundTwo(randomFloat(18, 85)).toFixed(2),
    quality_score: randomInt(1, 28),
    estimated_value: randomInt(5, 25),
    xp: 6,
    durability_loss: 1,
    chest: false,
    trash: true,
    bait_used: baitUsed,
    coin_bonus: 0,
    is_boss: false,
    is_jackpot: false,
    event_tag: eventTag,
    sea_mood: buildSeaMood(biome, eventTag, "common"),
    flavor_text: "The ocean has gifted you... literal nonsense. Inspiring."
  };
}

function buildCatch(species, options) {
  const weight = roundTwo(randomFloat(species.minKg, species.maxKg));
  const length = roundTwo(randomFloat(species.minCm, species.maxCm));
  const quality = randomInt(options.isBoss ? 92 : 58, 100);
  const chest = Boolean(options.chest || options.isBoss);
  const jackpot = Boolean(options.jackpot || options.isBoss);

  let valueMultiplier = 1 + (quality - 50) / 100;
  if (jackpot) {
    valueMultiplier += 0.35;
  }
  if (options.isBoss) {
    valueMultiplier += 0.75;
  }

  const estimatedValue = Math.floor(species.baseValue * valueMultiplier);
  let durabilityLoss = 1;
  if (["epic", "legendary"].includes(species.rarity)) {
    durabilityLoss = 2;
  }
  if (species.rarity === "mythical" || options.isBoss) {
    durabilityLoss = 3;
  }

  let coinBonus = chest ? randomInt(90, 260) : 0;
  let flavorText = pick([
    "It flopped dramatically like it knew it had an audience.",
    "The water exploded and your rod made a sound it will remember forever.",
    "You locked eyes for one second and immediately knew this was content."
  ]);

  if (options.isBoss) {
    flavorText = "The sea boss surfaced. Nearby fishermen would absolutely call this unfair.";
  }

  if (jackpot) {
    coinBonus += 400 + options.rodTier * 75;
    flavorText = "Jackpot fish sparkles everywhere. Nearby wallets tremble with envy.";
  }

  return {
    species_key: species.key,
    species_name: species.name,
    biome: species.biome,
    rarity: species.rarity,
    weight_kg: weight.toFixed(2),
    length_cm: length.toFixed(2),
    quality_score: quality,
    estimated_value: estimatedValue,
    xp: 20 + rarityXp(species.rarity) + Math.floor(quality / 4),
    durability_loss: Math.max(1, durabilityLoss - options.durabilityBonus),
    chest,
    trash: false,
    bait_used: options.baitUsed,
    coin_bonus: coinBonus,
    is_boss: options.isBoss,
    is_jackpot: jackpot,
    event_tag: options.eventTag,
    sea_mood: buildSeaMood(species.biome, options.eventTag, species.rarity),
    flavor_text: flavorText
  };
}

function resolveFishingFallback(payload) {
  const biome = normalizeBiome(payload.biome);
  const rodTier = Math.max(1, Number(payload.rod_tier) || 1);
  const baitLuck = Math.max(0, Number(payload.bait_luck) || 0);
  const durabilityBonus = Math.max(0, Number(payload.durability_bonus) || 0);
  const baitUsed = Boolean(payload.bait_key);
  const eventTag = buildSeaEventTag(biome, rodTier, baitLuck);

  const bossChance = 0.0007 + rodTier * 0.0003 + baitLuck * 0.0015;
  if (Math.random() < bossChance) {
    return buildCatch(
      {
        key: "boss_abyssal",
        name: "Abyssal Dragonfish",
        biome: "reef",
        rarity: "mythical",
        minKg: 45.0,
        maxKg: 88.0,
        minCm: 300,
        maxCm: 520,
        baseValue: 32000
      },
      {
        isBoss: true,
        chest: true,
        jackpot: true,
        baitUsed,
        rodTier,
        durabilityBonus,
        eventTag
      }
    );
  }

  const trashChance = Math.max(
    0.04,
    0.18 - rodTier * 0.01 - baitLuck * 0.55 - (eventTag === "coral_bloom" ? 0.03 : 0)
  );
  if (Math.random() < trashChance) {
    return buildTrash(biome, baitUsed, eventTag);
  }

  const rarity = rollRarity(rodTier, baitLuck);
  const candidates = SPECIES_POOL.filter((entry) => entry.biome === biome && entry.rarity === rarity);
  const species = pick(candidates.length ? candidates : SPECIES_POOL.filter((entry) => entry.biome === biome));
  const chestChance =
    0.06 +
    baitLuck * 0.25 +
    rodTier * 0.004 +
    (eventTag === "trade_winds" ? 0.03 : 0) +
    (eventTag === "coral_bloom" ? 0.02 : 0);

  return buildCatch(species, {
    isBoss: false,
    chest: Math.random() < chestChance,
    jackpot: rarity === "mythical",
    baitUsed,
    rodTier,
    durabilityBonus,
    eventTag
  });
}

module.exports = {
  resolveCoinflipFallback,
  resolveFishingFallback
};
