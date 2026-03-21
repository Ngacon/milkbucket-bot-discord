const { createExpansionCommand } = require("./_createExpansionCommand");

module.exports = [
  createExpansionCommand({
    name: "invest",
    aliases: ["stonks", "portfolio"],
    description: "Throw Milk Coins into the chaos market.",
    cooldownMs: 6_000,
    handler: "handleInvest"
  }),
  createExpansionCommand({
    name: "loan",
    aliases: ["borrow", "cashadvance"],
    description: "Take a dangerous but exciting loan.",
    cooldownMs: 8_000,
    handler: "handleLoan"
  }),
  createExpansionCommand({
    name: "repay",
    aliases: ["payloan"],
    description: "Repay your goblin debt.",
    cooldownMs: 4_000,
    handler: "handleRepay"
  }),
  createExpansionCommand({
    name: "interest",
    aliases: ["apy", "bankrate"],
    description: "Claim bank and investment interest.",
    cooldownMs: 10_000,
    handler: "handleInterest"
  }),
  createExpansionCommand({
    name: "lottery",
    aliases: ["lotto", "ticketbuy"],
    description: "Buy lottery tickets and antagonize fate.",
    cooldownMs: 6_000,
    handler: "handleLottery"
  }),
  createExpansionCommand({
    name: "jackpot",
    aliases: ["jp", "grandpool"],
    description: "Check the global jackpot pool.",
    cooldownMs: 3_000,
    handler: "handleJackpot"
  }),
  createExpansionCommand({
    name: "mine",
    aliases: ["dig", "orejob"],
    description: "Mine for ore, coins, and cave drama.",
    cooldownMs: 9_000,
    handler: "handleMine"
  }),
  createExpansionCommand({
    name: "hunt",
    aliases: ["tracker", "prey"],
    description: "Hunt for pelts and profit.",
    cooldownMs: 9_000,
    handler: "handleHunt"
  }),
  createExpansionCommand({
    name: "farm",
    aliases: ["harvest", "cropjob"],
    description: "Grow crops and speedrun capitalism.",
    cooldownMs: 9_000,
    handler: "handleFarm"
  }),
  createExpansionCommand({
    name: "cook",
    aliases: ["chef", "kitchen"],
    description: "Cook profitable chaos meals.",
    cooldownMs: 9_000,
    handler: "handleCook"
  }),
  createExpansionCommand({
    name: "deliver",
    aliases: ["delivery", "courier"],
    description: "Deliver boxes with goblin efficiency.",
    cooldownMs: 9_000,
    handler: "handleDeliver"
  }),
  createExpansionCommand({
    name: "crash",
    aliases: ["graph", "rocket"],
    description: "Cash out before the chart explodes.",
    cooldownMs: 5_000,
    handler: "handleCrash"
  }),
  createExpansionCommand({
    name: "mines",
    aliases: ["minefield", "bombboard"],
    description: "Click safe tiles and pray.",
    cooldownMs: 5_000,
    handler: "handleMines"
  }),
  createExpansionCommand({
    name: "wheel",
    aliases: ["spinwheel", "fortune"],
    description: "Spin a wheel with questionable morals.",
    cooldownMs: 5_000,
    handler: "handleWheel"
  }),
  createExpansionCommand({
    name: "plinko",
    aliases: ["plink", "drop"],
    description: "Drop chips into profit-shaped chaos.",
    cooldownMs: 5_000,
    handler: "handlePlinko"
  }),
  createExpansionCommand({
    name: "baccarat",
    aliases: ["bacc", "banker"],
    description: "Play baccarat against the house.",
    cooldownMs: 5_000,
    handler: "handleBaccarat"
  }),
  createExpansionCommand({
    name: "deepsea",
    aliases: ["abyss", "deeps"],
    description: "Fish in the abyss for rare monsters.",
    cooldownMs: 12_000,
    handler: "handleDeepsea"
  }),
  createExpansionCommand({
    name: "net",
    aliases: ["netfish", "haul"],
    description: "Catch multiple fish at once.",
    cooldownMs: 11_000,
    handler: "handleNet"
  }),
  createExpansionCommand({
    name: "aquarium",
    aliases: ["tank", "fishroom"],
    description: "Show off your display fish.",
    cooldownMs: 4_000,
    handler: "handleAquarium"
  }),
  createExpansionCommand({
    name: "release",
    aliases: ["freefish", "letgo"],
    description: "Release a fish from your aquarium.",
    cooldownMs: 4_000,
    handler: "handleRelease"
  }),
  createExpansionCommand({
    name: "mutate",
    aliases: ["mut8", "evolvefish"],
    description: "Mutate an aquarium fish for higher value.",
    cooldownMs: 7_000,
    handler: "handleMutate"
  })
];
