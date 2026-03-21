class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }

  getRemainingMs(userId, commandName, now = Date.now()) {
    const key = `${userId}:${commandName}`;
    const availableAt = this.cooldowns.get(key);

    if (!availableAt) {
      return 0;
    }

    return availableAt > now ? availableAt - now : 0;
  }

  set(userId, commandName, cooldownMs, now = Date.now()) {
    if (!cooldownMs) {
      return;
    }

    const key = `${userId}:${commandName}`;
    this.cooldowns.set(key, now + cooldownMs);
  }
}

module.exports = { CooldownManager };

