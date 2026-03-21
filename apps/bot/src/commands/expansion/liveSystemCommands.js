const { createExpansionCommand } = require("./_createExpansionCommand");

module.exports = [
  createExpansionCommand({
    name: "island",
    aliases: ["isl", "isle"],
    description: "Manage your island empire.",
    cooldownMs: 5_000,
    handler: "handleIsland"
  }),
  createExpansionCommand({
    name: "pet",
    aliases: ["buddy", "companion"],
    description: "Run your Pet 2.0 loop with training, battle, idle jobs, and evolution.",
    cooldownMs: 4_000,
    handler: "handlePet"
  }),
  createExpansionCommand({
    name: "marry",
    aliases: ["proposal", "ring"],
    description: "Marry another player.",
    cooldownMs: 8_000,
    handler: "handleMarry"
  }),
  createExpansionCommand({
    name: "divorce",
    aliases: ["split", "unmarry"],
    description: "File a chaotic divorce.",
    cooldownMs: 8_000,
    handler: "handleDivorce"
  }),
  createExpansionCommand({
    name: "family",
    aliases: ["fam", "household"],
    description: "View your family stats.",
    cooldownMs: 4_000,
    handler: "handleFamily"
  }),
  createExpansionCommand({
    name: "house",
    aliases: ["home", "crib"],
    description: "Buy and upgrade housing.",
    cooldownMs: 4_000,
    handler: "handleHouse"
  }),
  createExpansionCommand({
    name: "decorate",
    aliases: ["decor", "style"],
    description: "Decorate your house.",
    cooldownMs: 4_000,
    handler: "handleDecorate"
  }),
  createExpansionCommand({
    name: "bounty",
    aliases: ["wanted", "contract"],
    description: "Place a bounty on another player.",
    cooldownMs: 6_000,
    handler: "handleBounty"
  }),
  createExpansionCommand({
    name: "steal",
    aliases: ["heist", "pickpocket"],
    description: "Attempt to steal from a player.",
    cooldownMs: 12_000,
    handler: "handleSteal"
  }),
  createExpansionCommand({
    name: "arrest",
    aliases: ["cuff", "capture"],
    description: "Arrest a wanted player.",
    cooldownMs: 10_000,
    handler: "handleArrest"
  }),
  createExpansionCommand({
    name: "jail",
    aliases: ["cell", "wantedstatus"],
    description: "Check jail and bounty status.",
    cooldownMs: 3_000,
    handler: "handleJail"
  }),
  createExpansionCommand({
    name: "escape",
    aliases: ["breakout", "fleejail"],
    description: "Try to escape jail.",
    cooldownMs: 15_000,
    handler: "handleEscape"
  }),
  createExpansionCommand({
    name: "market",
    aliases: ["bazaar", "pmarket"],
    description: "Browse the player market.",
    cooldownMs: 4_000,
    handler: "handleMarket"
  }),
  createExpansionCommand({
    name: "sell",
    aliases: ["list", "vendor"],
    description: "List something on the player market.",
    cooldownMs: 4_000,
    handler: "handleSell"
  }),
  createExpansionCommand({
    name: "buy",
    aliases: ["purchase", "grab"],
    description: "Buy a listing from the player market.",
    cooldownMs: 4_000,
    handler: "handleBuy"
  }),
  createExpansionCommand({
    name: "auction",
    aliases: ["bidboard", "auc"],
    description: "Start or bid on player auctions.",
    cooldownMs: 4_000,
    handler: "handleAuction"
  }),
  createExpansionCommand({
    name: "quiz",
    aliases: ["trivia", "brain"],
    description: "Solve a quiz prompt for rewards.",
    cooldownMs: 4_000,
    handler: "handleQuiz"
  }),
  createExpansionCommand({
    name: "fasttype",
    aliases: ["ftype", "speedtype"],
    description: "Type a phrase exactly for a reward.",
    cooldownMs: 4_000,
    handler: "handleFasttype"
  })
];
