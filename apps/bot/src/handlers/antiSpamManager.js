class AntiSpamManager {
  constructor({ windowMs, maxCommands, lockMs }) {
    this.windowMs = windowMs;
    this.maxCommands = maxCommands;
    this.lockMs = lockMs;
    this.activity = new Map();
    this.locks = new Map();
  }

  register(userId, now = Date.now()) {
    const lockedUntil = this.locks.get(userId);
    if (lockedUntil && lockedUntil > now) {
      return {
        blocked: true,
        remainingMs: lockedUntil - now
      };
    }

    if (lockedUntil && lockedUntil <= now) {
      this.locks.delete(userId);
    }

    const recent = (this.activity.get(userId) || []).filter(
      (timestamp) => now - timestamp <= this.windowMs
    );
    recent.push(now);
    this.activity.set(userId, recent);

    if (recent.length > this.maxCommands) {
      const nextLock = now + this.lockMs;
      this.locks.set(userId, nextLock);
      return {
        blocked: true,
        remainingMs: this.lockMs
      };
    }

    return { blocked: false, remainingMs: 0 };
  }
}

module.exports = { AntiSpamManager };

