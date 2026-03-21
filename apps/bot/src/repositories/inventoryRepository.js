class InventoryRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async grantItemByKey(userId, itemKey, quantity, options = {}, executor) {
    const queryable = this.runner(executor);
    const { rows: itemRows } = await queryable.query(
      `
        SELECT *
        FROM items
        WHERE key = $1
      `,
      [itemKey]
    );

    const item = itemRows[0];
    if (!item) {
      throw new Error(`Unknown item key: ${itemKey}`);
    }

    const durability =
      options.durability !== undefined
        ? options.durability
        : item.max_durability || null;

    const metadata = options.metadata || {};
    const equipped = Boolean(options.equipped);

    const { rows } = await queryable.query(
      `
        INSERT INTO inventory (
          user_id,
          item_id,
          quantity,
          durability,
          upgrade_level,
          equipped,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET
          quantity = inventory.quantity + EXCLUDED.quantity,
          durability = COALESCE(inventory.durability, EXCLUDED.durability),
          equipped = inventory.equipped OR EXCLUDED.equipped,
          metadata = inventory.metadata || EXCLUDED.metadata
        RETURNING *
      `,
      [
        userId,
        item.id,
        quantity,
        durability,
        options.upgradeLevel || 0,
        equipped,
        JSON.stringify(metadata)
      ]
    );

    return rows[0];
  }

  async ensureStarterKit(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT COUNT(*)::INT AS count
        FROM inventory
        WHERE user_id = $1
      `,
      [userId]
    );

    if (rows[0].count > 0) {
      return;
    }

    await this.grantItemByKey(userId, "rod_bamboo", 1, { equipped: true }, queryable);
    await this.grantItemByKey(userId, "bait_worm", 15, { equipped: true }, queryable);
    await this.grantItemByKey(userId, "lootbox_rusty", 1, {}, queryable);
  }

  async getFishingLoadout(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          i.category,
          i.key,
          i.name,
          i.rarity,
          i.metadata,
          inv.quantity,
          inv.durability,
          inv.upgrade_level
        FROM inventory inv
        INNER JOIN items i ON i.id = inv.item_id
        WHERE inv.user_id = $1
          AND inv.equipped = TRUE
          AND i.category IN ('rod', 'bait')
      `,
      [userId]
    );

    const rod = rows.find((entry) => entry.category === "rod") || null;
    const bait = rows.find((entry) => entry.category === "bait") || null;

    return { rod, bait };
  }

  async reduceDurability(userId, itemKey, amount, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        UPDATE inventory inv
        SET durability = GREATEST(0, COALESCE(inv.durability, 0) - $3)
        FROM items i
        WHERE inv.item_id = i.id
          AND inv.user_id = $1
          AND i.key = $2
        RETURNING inv.*
      `,
      [userId, itemKey, amount]
    );

    return rows[0] || null;
  }

  async consumeBait(userId, itemKey, quantity, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        UPDATE inventory inv
        SET quantity = GREATEST(0, inv.quantity - $3)
        FROM items i
        WHERE inv.item_id = i.id
          AND inv.user_id = $1
          AND i.key = $2
        RETURNING inv.*
      `,
      [userId, itemKey, quantity]
    );

    return rows[0] || null;
  }

  async getOverview(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          i.key,
          i.name,
          i.category,
          i.rarity,
          i.emoji,
          inv.quantity,
          inv.durability,
          inv.upgrade_level,
          inv.equipped
        FROM inventory inv
        INNER JOIN items i ON i.id = inv.item_id
        WHERE inv.user_id = $1
        ORDER BY
          CASE i.category
            WHEN 'rod' THEN 1
            WHEN 'bait' THEN 2
            WHEN 'lootbox' THEN 3
            ELSE 4
          END,
          i.name ASC
      `,
      [userId]
    );

    return rows;
  }
}

module.exports = { InventoryRepository };

