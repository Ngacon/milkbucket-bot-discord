const { createWorldDefaults, mergeDefaults } = require("../data/liveGameData");

class WorldStateRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async ensureState(stateKey, executor) {
    const queryable = this.runner(executor);
    await queryable.query(
      `
        INSERT INTO world_state (state_key, payload)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (state_key) DO NOTHING
      `,
      [stateKey, JSON.stringify(createWorldDefaults())]
    );

    return this.getState(stateKey, executor);
  }

  async getState(stateKey, executor, options = {}) {
    const queryable = this.runner(executor);
    await this.ensureStateRecord(stateKey, queryable);
    const lockingClause = options.forUpdate ? "FOR UPDATE" : "";
    const { rows } = await queryable.query(
      `
        SELECT state_key, payload, updated_at
        FROM world_state
        WHERE state_key = $1
        ${lockingClause}
      `,
      [stateKey]
    );

    return this.hydrate(rows[0]);
  }

  async updateState(stateKey, updater, executor) {
    const current = await this.getState(stateKey, executor, { forUpdate: true });
    const payload = JSON.parse(JSON.stringify(current.payload));
    const maybePayload = await updater(payload, current.payload);
    const nextPayload = maybePayload || payload;

    return this.saveState(stateKey, nextPayload, executor);
  }

  async saveState(stateKey, payload, executor) {
    const queryable = this.runner(executor);

    const { rows } = await queryable.query(
      `
        UPDATE world_state
        SET payload = $2::jsonb,
            updated_at = NOW()
        WHERE state_key = $1
        RETURNING state_key, payload, updated_at
      `,
      [stateKey, JSON.stringify(payload)]
    );

    return this.hydrate(rows[0]);
  }

  async ensureStateRecord(stateKey, executor) {
    const queryable = this.runner(executor);
    await queryable.query(
      `
        INSERT INTO world_state (state_key, payload)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (state_key) DO NOTHING
      `,
      [stateKey, JSON.stringify(createWorldDefaults())]
    );
  }

  hydrate(row) {
    if (!row) {
      return null;
    }

    return {
      ...row,
      payload: mergeDefaults(createWorldDefaults(), row.payload || {})
    };
  }
}

module.exports = { WorldStateRepository };
