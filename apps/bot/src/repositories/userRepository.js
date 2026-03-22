class UserRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async ensureUser({ discordId, username }, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        INSERT INTO users (discord_id, username, last_seen_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (discord_id)
        DO UPDATE SET
          username = EXCLUDED.username,
          last_seen_at = NOW()
        RETURNING *
      `,
      [discordId, username]
    );

    return rows[0];
  }

  async addXp(userId, xp, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        UPDATE users
        SET xp = xp + $2,
            level = GREATEST(1, FLOOR(SQRT((xp + $2) / 120.0))::INT + 1)
        WHERE id = $1
        RETURNING id, xp, level, prestige, streak_days
      `,
      [userId, xp]
    );

    return rows[0];
  }

  async findById(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM users
        WHERE id = $1
      `,
      [userId]
    );

    return rows[0] || null;
  }

  async findByDiscordId(discordId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM users
        WHERE discord_id = $1
      `,
      [discordId]
    );

    return rows[0] || null;
  }

  async getUsersByIds(userIds, executor) {
    const uniqueIds = [...new Set(userIds.map(Number))].filter(Boolean);
    if (!uniqueIds.length) {
      return [];
    }

    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM users
        WHERE id = ANY($1::bigint[])
      `,
      [uniqueIds]
    );

    return rows;
  }

  async deleteByDiscordId(discordId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        DELETE FROM users
        WHERE discord_id = $1
        RETURNING *
      `,
      [discordId]
    );

    return rows[0] || null;
  }
}

module.exports = { UserRepository };
