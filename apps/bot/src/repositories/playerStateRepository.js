const {
  createDefaultSystems,
  createDefaultSettings,
  mergeDefaults
} = require("../data/liveGameData");

class PlayerStateRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async ensureState(userId, executor) {
    const queryable = this.runner(executor);
    await queryable.query(
      `
        INSERT INTO player_states (user_id, systems, settings)
        VALUES ($1, $2::jsonb, $3::jsonb)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId, JSON.stringify(createDefaultSystems()), JSON.stringify(createDefaultSettings())]
    );

    return this.getState(userId, executor);
  }

  async getState(userId, executor, options = {}) {
    const queryable = this.runner(executor);
    await this.ensureStateRecord(userId, queryable);

    const lockingClause = options.forUpdate ? "FOR UPDATE" : "";
    const { rows } = await queryable.query(
      `
        SELECT user_id, systems, settings, created_at, updated_at
        FROM player_states
        WHERE user_id = $1
        ${lockingClause}
      `,
      [userId]
    );

    return this.hydrate(rows[0]);
  }

  async getStates(userIds, executor, options = {}) {
    const uniqueIds = [...new Set(userIds.map(Number))].filter(Boolean).sort((a, b) => a - b);
    if (!uniqueIds.length) {
      return [];
    }

    const queryable = this.runner(executor);
    for (const userId of uniqueIds) {
      await this.ensureStateRecord(userId, queryable);
    }

    const lockingClause = options.forUpdate ? "FOR UPDATE" : "";
    const { rows } = await queryable.query(
      `
        SELECT user_id, systems, settings, created_at, updated_at
        FROM player_states
        WHERE user_id = ANY($1::bigint[])
        ORDER BY user_id ASC
        ${lockingClause}
      `,
      [uniqueIds]
    );

    return rows.map((row) => this.hydrate(row));
  }

  async saveState(userId, systems, settings, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        UPDATE player_states
        SET systems = $2::jsonb,
            settings = $3::jsonb,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING user_id, systems, settings, created_at, updated_at
      `,
      [userId, JSON.stringify(systems), JSON.stringify(settings)]
    );

    return this.hydrate(rows[0]);
  }

  async updateState(userId, updater, executor) {
    const current = await this.getState(userId, executor, { forUpdate: true });
    const draft = {
      systems: JSON.parse(JSON.stringify(current.systems)),
      settings: JSON.parse(JSON.stringify(current.settings))
    };

    const maybeDraft = await updater(draft, current);
    const next = maybeDraft || draft;

    return this.saveState(userId, next.systems, next.settings, executor);
  }

  async ensureStateRecord(userId, executor) {
    const queryable = this.runner(executor);
    await queryable.query(
      `
        INSERT INTO player_states (user_id, systems, settings)
        VALUES ($1, $2::jsonb, $3::jsonb)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId, JSON.stringify(createDefaultSystems()), JSON.stringify(createDefaultSettings())]
    );
  }

  hydrate(row) {
    if (!row) {
      return null;
    }

    return {
      ...row,
      systems: mergeDefaults(createDefaultSystems(), row.systems || {}),
      settings: mergeDefaults(createDefaultSettings(), row.settings || {})
    };
  }
}

module.exports = { PlayerStateRepository };
