class ModerationRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async getRecord(discordId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM bot_moderation
        WHERE discord_id = $1
      `,
      [discordId]
    );

    return rows[0] || null;
  }

  async listWarnings(discordId, limit = 5, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM bot_warning_logs
        WHERE discord_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [discordId, limit]
    );

    return rows;
  }

  async addWarning(
    { discordId, username, moderatorDiscordId, moderatorUsername, reason },
    executor
  ) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        INSERT INTO bot_moderation (
          discord_id,
          username,
          warning_count,
          last_warning_reason,
          last_warned_by_discord_id,
          last_warned_by_username,
          last_warned_at,
          updated_at
        )
        VALUES ($1, $2, 1, $5, $3, $4, NOW(), NOW())
        ON CONFLICT (discord_id)
        DO UPDATE SET
          username = EXCLUDED.username,
          warning_count = bot_moderation.warning_count + 1,
          last_warning_reason = EXCLUDED.last_warning_reason,
          last_warned_by_discord_id = EXCLUDED.last_warned_by_discord_id,
          last_warned_by_username = EXCLUDED.last_warned_by_username,
          last_warned_at = EXCLUDED.last_warned_at,
          updated_at = NOW()
        RETURNING *
      `,
      [discordId, username, moderatorDiscordId, moderatorUsername, reason]
    );

    await queryable.query(
      `
        INSERT INTO bot_warning_logs (
          discord_id,
          username,
          warned_by_discord_id,
          warned_by_username,
          reason
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [discordId, username, moderatorDiscordId, moderatorUsername, reason]
    );

    return rows[0];
  }

  async setBan(
    {
      discordId,
      username,
      moderatorDiscordId,
      moderatorUsername,
      reason,
      banned
    },
    executor
  ) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        INSERT INTO bot_moderation (
          discord_id,
          username,
          is_banned,
          ban_reason,
          banned_by_discord_id,
          banned_by_username,
          banned_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $5,
          $6,
          CASE WHEN $5 THEN $3 ELSE NULL END,
          CASE WHEN $5 THEN $4 ELSE NULL END,
          CASE WHEN $5 THEN NOW() ELSE NULL END,
          NOW()
        )
        ON CONFLICT (discord_id)
        DO UPDATE SET
          username = EXCLUDED.username,
          is_banned = EXCLUDED.is_banned,
          ban_reason = EXCLUDED.ban_reason,
          banned_by_discord_id = EXCLUDED.banned_by_discord_id,
          banned_by_username = EXCLUDED.banned_by_username,
          banned_at = EXCLUDED.banned_at,
          updated_at = NOW()
        RETURNING *
      `,
      [discordId, username, moderatorDiscordId, moderatorUsername, Boolean(banned), reason || null]
    );

    await queryable.query(
      `
        INSERT INTO bot_ban_logs (
          discord_id,
          username,
          action,
          reason,
          moderated_by_discord_id,
          moderated_by_username
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        discordId,
        username,
        banned ? "ban" : "unban",
        reason || null,
        moderatorDiscordId,
        moderatorUsername
      ]
    );

    return rows[0];
  }

  async listBanLogs(discordId, limit = 5, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM bot_ban_logs
        WHERE discord_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [discordId, limit]
    );

    return rows;
  }
}

module.exports = { ModerationRepository };
