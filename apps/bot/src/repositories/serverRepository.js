class ServerRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async ensureMembership(guild, userId, executor) {
    if (!guild) {
      return null;
    }

    const queryable = this.runner(executor);
    await queryable.query(
      `
        INSERT INTO server_memberships (discord_guild_id, user_id, server_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (discord_guild_id, user_id)
        DO UPDATE SET server_name = EXCLUDED.server_name
      `,
      [guild.id, userId, guild.name]
    );

    return {
      discordGuildId: guild.id,
      serverName: guild.name
    };
  }

  async recordCommandUsage(guild, userId, commandName, executor) {
    if (!guild) {
      return;
    }

    const queryable = this.runner(executor);
    const isFish = commandName === "fish" ? 1 : 0;
    const isGamble = commandName === "coinflip" ? 1 : 0;

    await queryable.query(
      `
        UPDATE server_memberships
        SET commands_used = commands_used + 1,
            fish_caught = fish_caught + $3,
            gambles_played = gambles_played + $4
        WHERE discord_guild_id = $1
          AND user_id = $2
      `,
      [guild.id, userId, isFish, isGamble]
    );
  }
}

module.exports = { ServerRepository };
