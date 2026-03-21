INSERT INTO items (key, name, category, rarity, emoji, base_value, max_durability, metadata)
VALUES
  ('rod_bamboo', 'Bamboo Bonker', 'rod', 'common', '🎣', 100, 120, '{"tier":1,"durability_bonus":0}'::jsonb),
  ('rod_tidal', 'Tidal Twister', 'rod', 'uncommon', '🌊', 950, 220, '{"tier":2,"durability_bonus":1}'::jsonb),
  ('rod_volcanic', 'Volcanic Bonkstick', 'rod', 'epic', '🌋', 4800, 360, '{"tier":4,"durability_bonus":2}'::jsonb),
  ('bait_worm', 'Wriggly Worm', 'bait', 'common', '🪱', 20, NULL, '{"luck":0.01}'::jsonb),
  ('bait_glowbug', 'Glow Bug', 'bait', 'uncommon', '🪲', 95, NULL, '{"luck":0.04}'::jsonb),
  ('bait_kraken', 'Mini Kraken Snack', 'bait', 'epic', '🦑', 350, NULL, '{"luck":0.10}'::jsonb),
  ('lootbox_rusty', 'Rusty Loot Box', 'lootbox', 'common', '📦', 60, NULL, '{"table":"starter"}'::jsonb),
  ('lootbox_salty', 'Salty Treasure Crate', 'lootbox', 'uncommon', '🧳', 150, NULL, '{"table":"salty"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

