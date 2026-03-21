class FishRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async syncCatalog(mapDefinitions, executor) {
    const queryable = this.runner(executor);

    for (const map of mapDefinitions) {
      await queryable.query(
        `
          INSERT INTO maps (key, name, unlock_level, travel_cost, description, metadata)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT (key)
          DO UPDATE SET
            name = EXCLUDED.name,
            unlock_level = EXCLUDED.unlock_level,
            travel_cost = EXCLUDED.travel_cost,
            description = EXCLUDED.description,
            metadata = EXCLUDED.metadata
        `,
        [
          map.key,
          map.label,
          map.unlockLevel,
          map.fare,
          map.description,
          JSON.stringify({
            danger: map.danger,
            reward_range: map.rewardRange,
            chest_chance: map.chestChance,
            aliases: map.aliases
          })
        ]
      );

      for (const fish of map.fish) {
        await queryable.query(
          `
            INSERT INTO fish (
              map_id,
              key,
              name,
              rarity,
              weight,
              base_value,
              min_weight_kg,
              max_weight_kg,
              min_length_cm,
              max_length_cm,
              shiny_chance,
              metadata
            )
            VALUES (
              (SELECT id FROM maps WHERE key = $1),
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12::jsonb
            )
            ON CONFLICT (key)
            DO UPDATE SET
              map_id = EXCLUDED.map_id,
              name = EXCLUDED.name,
              rarity = EXCLUDED.rarity,
              weight = EXCLUDED.weight,
              base_value = EXCLUDED.base_value,
              min_weight_kg = EXCLUDED.min_weight_kg,
              max_weight_kg = EXCLUDED.max_weight_kg,
              min_length_cm = EXCLUDED.min_length_cm,
              max_length_cm = EXCLUDED.max_length_cm,
              shiny_chance = EXCLUDED.shiny_chance,
              metadata = EXCLUDED.metadata
          `,
          [
            map.key,
            fish.key,
            fish.name,
            fish.rarity,
            fish.weight,
            fish.valueRange[0],
            fish.weightKgRange[0],
            fish.weightKgRange[1],
            fish.lengthCmRange[0],
            fish.lengthCmRange[1],
            fish.shinyChance,
            JSON.stringify({
              map_key: map.key,
              max_value: fish.valueRange[1]
            })
          ]
        );
      }
    }
  }

  async recordCatch(userId, catchPayload, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        INSERT INTO fish_collection (
          user_id,
          species_key,
          species_name,
          biome,
          rarity,
          weight_kg,
          length_cm,
          quality_score,
          est_value,
          is_boss,
          is_jackpot,
          is_shiny,
          metadata
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13::jsonb
        )
        RETURNING *
      `,
      [
        userId,
        catchPayload.speciesKey,
        catchPayload.speciesName,
        catchPayload.biome,
        catchPayload.rarity,
        catchPayload.weightKg,
        catchPayload.lengthCm,
        catchPayload.qualityScore,
        catchPayload.estValue,
        catchPayload.isBoss,
        catchPayload.isJackpot,
        Boolean(catchPayload.isShiny),
        JSON.stringify(catchPayload.metadata || {})
      ]
    );

    return rows[0];
  }

  async recordCollectionEntry(userId, collectionPayload, executor) {
    const queryable = this.runner(executor);
    await queryable.query(
      `
        INSERT INTO user_fish (
          user_id,
          fish_id,
          map_id,
          is_shiny,
          quantity,
          best_weight_kg,
          best_length_cm,
          total_caught,
          last_caught_at
        )
        SELECT
          $1,
          f.id,
          m.id,
          $4,
          1,
          $5,
          $6,
          1,
          NOW()
        FROM fish f
        INNER JOIN maps m ON m.id = f.map_id
        WHERE f.key = $2
          AND m.key = $3
        ON CONFLICT (user_id, fish_id, is_shiny)
        DO UPDATE SET
          quantity = user_fish.quantity + 1,
          total_caught = user_fish.total_caught + 1,
          best_weight_kg = GREATEST(user_fish.best_weight_kg, EXCLUDED.best_weight_kg),
          best_length_cm = GREATEST(user_fish.best_length_cm, EXCLUDED.best_length_cm),
          last_caught_at = NOW()
      `,
      [
        userId,
        collectionPayload.speciesKey,
        collectionPayload.mapKey,
        Boolean(collectionPayload.isShiny),
        collectionPayload.weightKg,
        collectionPayload.lengthCm
      ]
    );
  }

  async getUnsoldSummary(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          COUNT(*)::INT AS total_catches,
          COALESCE(SUM(est_value), 0)::BIGINT AS est_value,
          COUNT(*) FILTER (WHERE is_shiny = TRUE)::INT AS shiny_count
        FROM fish_collection
        WHERE user_id = $1
          AND sold = FALSE
      `,
      [userId]
    );

    return rows[0];
  }

  async getCollectionProgress(userId, mapKey, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          COUNT(*)::INT AS caught_species,
          COALESCE(SUM(total_caught), 0)::INT AS total_caught,
          COUNT(*) FILTER (WHERE is_shiny = TRUE)::INT AS shiny_species
        FROM user_fish uf
        INNER JOIN maps m ON m.id = uf.map_id
        WHERE uf.user_id = $1
          AND m.key = $2
      `,
      [userId, mapKey]
    );

    return rows[0];
  }

  async getOverallCollection(userId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          COUNT(*)::INT AS caught_species,
          COALESCE(SUM(total_caught), 0)::INT AS total_caught,
          COUNT(*) FILTER (WHERE is_shiny = TRUE)::INT AS shiny_species
        FROM user_fish
        WHERE user_id = $1
      `,
      [userId]
    );

    return rows[0];
  }

  async getLeaderboard(limit = 10, mapKey = null, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          u.username,
          COUNT(*)::INT AS species_entries,
          COALESCE(SUM(uf.total_caught), 0)::INT AS total_caught,
          COUNT(*) FILTER (WHERE uf.is_shiny = TRUE)::INT AS shiny_species,
          COALESCE(SUM(uf.total_caught * f.base_value), 0)::BIGINT AS score
        FROM user_fish uf
        INNER JOIN users u ON u.id = uf.user_id
        INNER JOIN fish f ON f.id = uf.fish_id
        INNER JOIN maps m ON m.id = uf.map_id
        WHERE ($1::text IS NULL OR m.key = $1)
        GROUP BY u.id, u.username
        ORDER BY total_caught DESC, shiny_species DESC, score DESC, u.username ASC
        LIMIT $2
      `,
      [mapKey, limit]
    );

    return rows;
  }
}

module.exports = { FishRepository };
