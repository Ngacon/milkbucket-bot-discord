const { createExpansionCommand } = require("./_createExpansionCommand");

module.exports = [
  createExpansionCommand({
    name: "guess",
    aliases: ["number", "gnum"],
    description: "Guess the hidden number.",
    cooldownMs: 4_000,
    handler: "handleGuess"
  }),
  createExpansionCommand({
    name: "battle",
    aliases: ["duel", "fight"],
    description: "Battle an NPC or another player.",
    cooldownMs: 7_000,
    handler: "handleBattle"
  }),
  createExpansionCommand({
    name: "travel",
    aliases: ["trip", "voyage"],
    description: "Travel to another zone.",
    cooldownMs: 6_000,
    handler: "handleTravel"
  }),
  createExpansionCommand({
    name: "map",
    aliases: ["worldmap", "atlas"],
    description: "View the world map.",
    cooldownMs: 3_000,
    handler: "handleMap"
  }),
  createExpansionCommand({
    name: "zone",
    aliases: ["area", "region"],
    description: "Inspect your current zone.",
    cooldownMs: 3_000,
    handler: "handleZone"
  }),
  createExpansionCommand({
    name: "dungeon",
    aliases: ["dg", "crawl"],
    description: "Run a dungeon in your current zone.",
    cooldownMs: 12_000,
    handler: "handleDungeon"
  }),
  createExpansionCommand({
    name: "gift",
    aliases: ["tip", "donate"],
    description: "Gift coins to another player.",
    cooldownMs: 4_000,
    handler: "handleGift"
  }),
  createExpansionCommand({
    name: "redeem",
    aliases: ["code", "claim"],
    description: "Redeem a promo code.",
    cooldownMs: 4_000,
    handler: "handleRedeem"
  }),
  createExpansionCommand({
    name: "chest",
    aliases: ["openchest", "crate"],
    description: "Open a reward chest.",
    cooldownMs: 5_000,
    handler: "handleChest"
  }),
  createExpansionCommand({
    name: "config",
    aliases: ["cfg", "setconfig"],
    description: "Update personal bot settings.",
    cooldownMs: 3_000,
    handler: "handleConfig"
  }),
  createExpansionCommand({
    name: "settings",
    aliases: ["prefs", "options"],
    description: "View your personal settings.",
    cooldownMs: 3_000,
    handler: "handleSettings"
  }),
  createExpansionCommand({
    name: "profile",
    aliases: ["prof", "card"],
    description: "View a player profile snapshot.",
    cooldownMs: 3_000,
    handler: "handleProfile"
  })
];
