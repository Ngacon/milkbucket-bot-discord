const path = require("path");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const config = require("./config");
const { loadCommands } = require("./bootstrap/loadCommands");
const { loadEvents } = require("./bootstrap/loadEvents");
const { AliasResolver } = require("./handlers/aliasResolver");
const { AntiSpamManager } = require("./handlers/antiSpamManager");
const { CooldownManager } = require("./handlers/cooldownManager");
const { Database } = require("./services/database");
const { ApiClient } = require("./services/apiClient");
const { UserRepository } = require("./repositories/userRepository");
const { EconomyRepository } = require("./repositories/economyRepository");
const { InventoryRepository } = require("./repositories/inventoryRepository");
const { FishRepository } = require("./repositories/fishRepository");
const { ServerRepository } = require("./repositories/serverRepository");
const { PlayerStateRepository } = require("./repositories/playerStateRepository");
const { WorldStateRepository } = require("./repositories/worldStateRepository");
const { MarketRepository } = require("./repositories/marketRepository");
const { ProfileService } = require("./services/profileService");
const { EconomyService } = require("./services/economyService");
const { FishingService } = require("./services/fishingService");
const { RandomEventService } = require("./services/randomEventService");
const { ExpansionService } = require("./services/expansionService");
const { FISHING_MAPS } = require("./data/fishingMaps");

if (!config.discordToken) {
  throw new Error("Missing DISCORD_TOKEN in apps/bot/.env");
}

if (!config.databaseUrl) {
  throw new Error("Missing DATABASE_URL in apps/bot/.env");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

process.on("unhandledRejection", (error) => {
  const message = error?.stack || error?.message || String(error);
  console.error(`[process:unhandledRejection] ${message}`);
});

const db = new Database(config.databaseUrl);
const apiClient = new ApiClient(config.rngServiceUrl, config.rngTimeoutMs, {
  mode: config.rngMode,
  fallbackCooldownMs: config.rngFallbackCooldownMs
});
const schemaFile = path.resolve(__dirname, "../../../db/schema.sql");
const seedItemsFile = path.resolve(__dirname, "../../../db/seed_items.sql");

const repositories = {
  userRepository: new UserRepository(db),
  economyRepository: new EconomyRepository(db),
  inventoryRepository: new InventoryRepository(db),
  fishRepository: new FishRepository(db),
  serverRepository: new ServerRepository(db),
  playerStateRepository: new PlayerStateRepository(db),
  worldStateRepository: new WorldStateRepository(db),
  marketRepository: new MarketRepository(db)
};

const services = {
  profileService: new ProfileService(repositories),
  economyService: new EconomyService({
    db,
    apiClient,
    userRepository: repositories.userRepository,
    economyRepository: repositories.economyRepository,
    playerStateRepository: repositories.playerStateRepository
  }),
  fishingService: new FishingService({
    db,
    apiClient,
    userRepository: repositories.userRepository,
    economyRepository: repositories.economyRepository,
    inventoryRepository: repositories.inventoryRepository,
    fishRepository: repositories.fishRepository,
    playerStateRepository: repositories.playerStateRepository
  }),
  expansionService: new ExpansionService({
    db,
    profileService: null,
    userRepository: repositories.userRepository,
    economyRepository: repositories.economyRepository,
    inventoryRepository: repositories.inventoryRepository,
    fishRepository: repositories.fishRepository,
    playerStateRepository: repositories.playerStateRepository,
    worldStateRepository: repositories.worldStateRepository,
    marketRepository: repositories.marketRepository
  })
};

services.expansionService.profileService = services.profileService;

services.randomEventService = new RandomEventService({
  chaosChance: config.chaosEventChance,
  ambientChance: config.ambientEventChance,
  profileService: services.profileService,
  economyRepository: repositories.economyRepository
});

async function start() {
  await db.bootstrap({
    schemaFile,
    seedFiles: [seedItemsFile]
  });

  await repositories.fishRepository.syncCatalog(FISHING_MAPS);

  const commands = loadCommands(path.join(__dirname, "commands"));

  client.botContext = {
    config,
    db,
    commands,
    languageCache: new Map(),
    repositories,
    services,
    aliasResolver: new AliasResolver(commands),
    antiSpamManager: new AntiSpamManager({
      windowMs: config.antiSpamWindowMs,
      maxCommands: config.antiSpamMaxCommands,
      lockMs: config.antiSpamLockMs
    }),
    cooldownManager: new CooldownManager()
  };

  loadEvents(client, path.join(__dirname, "events"));
  await client.login(config.discordToken);
}

start().catch((error) => {
  console.error("[startup]", error);
  process.exit(1);
});
