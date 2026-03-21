const USER_CACHE_TTL_MS = 10 * 60 * 1000;
const PROFILE_SCAFFOLD_TTL_MS = 15 * 60 * 1000;
const MEMBERSHIP_CACHE_TTL_MS = 30 * 60 * 1000;

class ProfileService {
  constructor({
    userRepository,
    economyRepository,
    inventoryRepository,
    serverRepository,
    playerStateRepository
  }) {
    this.userRepository = userRepository;
    this.economyRepository = economyRepository;
    this.inventoryRepository = inventoryRepository;
    this.serverRepository = serverRepository;
    this.playerStateRepository = playerStateRepository;
    this.userCache = new Map();
    this.scaffoldCache = new Map();
    this.membershipCache = new Map();
  }

  getFreshCacheValue(store, key) {
    const cached = store.get(String(key));
    if (!cached) {
      return null;
    }

    if (cached.expiresAt <= Date.now()) {
      store.delete(String(key));
      return null;
    }

    return cached.value;
  }

  setCacheValue(store, key, value, ttlMs) {
    store.set(String(key), {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  getMembershipKey(guildId, userId) {
    return `${guildId}:${userId}`;
  }

  getCachedUser(discordId, username) {
    const cached = this.getFreshCacheValue(this.userCache, discordId);
    if (!cached) {
      return null;
    }

    return cached.username === username ? cached.user : null;
  }

  rememberUser(discordId, username, user) {
    this.setCacheValue(this.userCache, discordId, { username, user }, USER_CACHE_TTL_MS);
  }

  isScaffoldWarm(userId) {
    return Boolean(this.getFreshCacheValue(this.scaffoldCache, userId));
  }

  markScaffoldWarm(userId) {
    this.setCacheValue(this.scaffoldCache, userId, true, PROFILE_SCAFFOLD_TTL_MS);
  }

  isMembershipWarm(guildId, userId) {
    return Boolean(this.getFreshCacheValue(this.membershipCache, this.getMembershipKey(guildId, userId)));
  }

  markMembershipWarm(guildId, userId) {
    this.setCacheValue(
      this.membershipCache,
      this.getMembershipKey(guildId, userId),
      true,
      MEMBERSHIP_CACHE_TTL_MS
    );
  }

  async ensureUserRecord(discordUser, executor) {
    if (!executor) {
      const cached = this.getCachedUser(discordUser.id, discordUser.username);
      if (cached) {
        return cached;
      }
    }

    const user = await this.userRepository.ensureUser(
      {
        discordId: discordUser.id,
        username: discordUser.username
      },
      executor
    );

    if (!executor) {
      this.rememberUser(discordUser.id, discordUser.username, user);
    }

    return user;
  }

  async ensureProfileScaffold(userId, guild, executor) {
    if (executor) {
      const tasks = [
        () => this.economyRepository.ensureAccount(userId, executor),
        () => this.inventoryRepository.ensureStarterKit(userId, executor),
        () => this.serverRepository.ensureMembership(guild, userId, executor)
      ];

      if (this.playerStateRepository) {
        tasks.push(() => this.playerStateRepository.ensureStateRecord(userId, executor));
      }

      for (const task of tasks) {
        await task();
      }
      return;
    }

    const tasks = [];

    if (!this.isScaffoldWarm(userId)) {
      tasks.push(() => this.economyRepository.ensureAccount(userId, executor));
      tasks.push(() => this.inventoryRepository.ensureStarterKit(userId, executor));
      if (this.playerStateRepository) {
        tasks.push(() => this.playerStateRepository.ensureStateRecord(userId, executor));
      }
    }

    if (guild && !this.isMembershipWarm(guild.id, userId)) {
      tasks.push(() => this.serverRepository.ensureMembership(guild, userId, executor));
    }

    if (!tasks.length) {
      return;
    }

    await Promise.all(tasks.map((task) => task()));

    this.markScaffoldWarm(userId);
    if (guild) {
      this.markMembershipWarm(guild.id, userId);
    }
  }

  async syncFromMessage(message, executor) {
    const user = await this.ensureUserRecord(message.author, executor);

    await this.ensureProfileScaffold(user.id, message.guild, executor);

    return user;
  }

  async resolveByDiscordUser(discordUser, executor) {
    const user = await this.ensureUserRecord(discordUser, executor);

    await this.ensureProfileScaffold(user.id, null, executor);

    return user;
  }
}

module.exports = { ProfileService };
