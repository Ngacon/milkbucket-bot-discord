class EconomyRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async ensureAccount(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        INSERT INTO economy (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING *
      `,
      [userId]
    );

    if (rows[0]) {
      return rows[0];
    }

    const existing = await queryable.query(
      `
        SELECT *
        FROM economy
        WHERE user_id = $1
      `,
      [userId]
    );

    return existing.rows[0];
  }

  async getSummary(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          e.user_id,
          e.wallet,
          e.bank,
          e.lifetime_earned,
          e.lifetime_spent,
          u.level,
          u.prestige,
          u.xp,
          u.streak_days
        FROM economy e
        INNER JOIN users u ON u.id = e.user_id
        WHERE e.user_id = $1
      `,
      [userId]
    );

    return rows[0] || null;
  }

  async mutateWallet(userId, delta, reason, executor) {
    const queryable = this.runner(executor);
    const account = await this.ensureAccount(userId, queryable);
    const nextWallet = Math.max(0, Number(account.wallet) + Number(delta));
    const appliedDelta = nextWallet - Number(account.wallet);

    const { rows } = await queryable.query(
      `
        UPDATE economy
        SET wallet = $2,
            lifetime_earned = lifetime_earned + CASE WHEN $3 > 0 THEN $3 ELSE 0 END,
            lifetime_spent = lifetime_spent + CASE WHEN $3 < 0 THEN ABS($3) ELSE 0 END,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `,
      [userId, nextWallet, appliedDelta]
    );

    await queryable.query(
      `
        INSERT INTO economy_ledger (user_id, source, amount)
        VALUES ($1, $2, $3)
      `,
      [userId, reason, appliedDelta]
    );

    return {
      account: rows[0],
      appliedDelta
    };
  }

  async mutateBank(userId, delta, reason, executor) {
    const queryable = this.runner(executor);
    const account = await this.ensureAccount(userId, queryable);
    const nextBank = Math.max(0, Number(account.bank) + Number(delta));
    const appliedDelta = nextBank - Number(account.bank);

    const { rows } = await queryable.query(
      `
        UPDATE economy
        SET bank = $2,
            lifetime_earned = lifetime_earned + CASE WHEN $3 > 0 THEN $3 ELSE 0 END,
            lifetime_spent = lifetime_spent + CASE WHEN $3 < 0 THEN ABS($3) ELSE 0 END,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `,
      [userId, nextBank, appliedDelta]
    );

    await queryable.query(
      `
        INSERT INTO economy_ledger (user_id, source, amount)
        VALUES ($1, $2, $3)
      `,
      [userId, reason, appliedDelta]
    );

    return {
      account: rows[0],
      appliedDelta
    };
  }
}

module.exports = { EconomyRepository };
