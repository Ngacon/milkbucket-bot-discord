BEGIN;

CREATE TABLE IF NOT EXISTS guilds (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL UNIQUE,
  owner_user_id BIGINT UNIQUE,
  bank BIGINT NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  season_points BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  discord_id BIGINT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  prestige INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_daily_at TIMESTAMPTZ,
  last_weekly_at TIMESTAMPTZ,
  guild_id BIGINT REFERENCES guilds(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guilds_owner_user_fk'
  ) THEN
    ALTER TABLE guilds
      ADD CONSTRAINT guilds_owner_user_fk
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS economy (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wallet BIGINT NOT NULL DEFAULT 500,
  bank BIGINT NOT NULL DEFAULT 0,
  lifetime_earned BIGINT NOT NULL DEFAULT 0,
  lifetime_spent BIGINT NOT NULL DEFAULT 0,
  bank_interest_due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tax_bracket SMALLINT NOT NULL DEFAULT 0,
  last_tax_event_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  emoji TEXT,
  base_value INTEGER NOT NULL DEFAULT 0,
  max_durability INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 0,
  durability INTEGER,
  upgrade_level INTEGER NOT NULL DEFAULT 0,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_user_item_unique UNIQUE (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS maps (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  travel_cost BIGINT NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fish (
  id BIGSERIAL PRIMARY KEY,
  map_id BIGINT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  weight NUMERIC(10,2) NOT NULL DEFAULT 1,
  base_value BIGINT NOT NULL DEFAULT 0,
  min_weight_kg NUMERIC(8,2) NOT NULL,
  max_weight_kg NUMERIC(8,2) NOT NULL,
  min_length_cm NUMERIC(8,2) NOT NULL,
  max_length_cm NUMERIC(8,2) NOT NULL,
  shiny_chance NUMERIC(8,6) NOT NULL DEFAULT 0.0025,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fish_collection (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_key TEXT NOT NULL,
  species_name TEXT NOT NULL,
  biome TEXT NOT NULL,
  rarity TEXT NOT NULL,
  weight_kg NUMERIC(8,2) NOT NULL,
  length_cm NUMERIC(8,2) NOT NULL,
  quality_score INTEGER NOT NULL,
  est_value BIGINT NOT NULL DEFAULT 0,
  sold BOOLEAN NOT NULL DEFAULT FALSE,
  is_boss BOOLEAN NOT NULL DEFAULT FALSE,
  is_jackpot BOOLEAN NOT NULL DEFAULT FALSE,
  caught_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

ALTER TABLE fish_collection
  ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_fish (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fish_id BIGINT NOT NULL REFERENCES fish(id) ON DELETE CASCADE,
  map_id BIGINT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  is_shiny BOOLEAN NOT NULL DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 1,
  best_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
  best_length_cm NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_caught INTEGER NOT NULL DEFAULT 1,
  last_caught_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_fish_user_fish_variant_unique UNIQUE (user_id, fish_id, is_shiny)
);

CREATE TABLE IF NOT EXISTS economy_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount BIGINT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_states (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  systems JSONB NOT NULL DEFAULT '{}'::JSONB,
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS world_state (
  state_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_moderation (
  discord_id BIGINT PRIMARY KEY,
  username TEXT NOT NULL,
  warning_count INTEGER NOT NULL DEFAULT 0,
  last_warning_reason TEXT,
  last_warned_by_discord_id BIGINT,
  last_warned_by_username TEXT,
  last_warned_at TIMESTAMPTZ,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  banned_by_discord_id BIGINT,
  banned_by_username TEXT,
  banned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_warning_logs (
  id BIGSERIAL PRIMARY KEY,
  discord_id BIGINT NOT NULL,
  username TEXT NOT NULL,
  warned_by_discord_id BIGINT NOT NULL,
  warned_by_username TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_ban_logs (
  id BIGSERIAL PRIMARY KEY,
  discord_id BIGINT NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  moderated_by_discord_id BIGINT NOT NULL,
  moderated_by_username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_listings (
  id BIGSERIAL PRIMARY KEY,
  seller_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_key TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  price BIGINT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_auctions (
  id BIGSERIAL PRIMARY KEY,
  seller_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  starting_bid BIGINT NOT NULL,
  current_bid BIGINT NOT NULL,
  current_bidder_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_members (
  guild_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  contributions BIGINT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS server_memberships (
  discord_guild_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_name TEXT NOT NULL,
  commands_used BIGINT NOT NULL DEFAULT 0,
  fish_caught BIGINT NOT NULL DEFAULT 0,
  gambles_played BIGINT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (discord_guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS season_configs (
  id BIGSERIAL PRIMARY KEY,
  season_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  reset_mode TEXT NOT NULL DEFAULT 'soft'
);

CREATE TABLE IF NOT EXISTS season_user_scores (
  season_id BIGINT NOT NULL REFERENCES season_configs(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coins_earned BIGINT NOT NULL DEFAULT 0,
  fish_points BIGINT NOT NULL DEFAULT 0,
  gambling_profit BIGINT NOT NULL DEFAULT 0,
  guild_points BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (season_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_level_xp ON users (level DESC, xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_guild_id ON users (guild_id);
CREATE INDEX IF NOT EXISTS idx_economy_wallet_desc ON economy (wallet DESC);
CREATE INDEX IF NOT EXISTS idx_economy_bank_desc ON economy (bank DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_user_equipped ON inventory (user_id, equipped);
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON inventory (item_id);
CREATE INDEX IF NOT EXISTS idx_maps_key ON maps (key);
CREATE INDEX IF NOT EXISTS idx_fish_map_id ON fish (map_id);
CREATE INDEX IF NOT EXISTS idx_fish_key ON fish (key);
CREATE INDEX IF NOT EXISTS idx_fish_collection_user_sold_caught_at
  ON fish_collection (user_id, sold, caught_at DESC);
CREATE INDEX IF NOT EXISTS idx_fish_collection_rarity_biome
  ON fish_collection (rarity, biome);
CREATE INDEX IF NOT EXISTS idx_user_fish_user_map
  ON user_fish (user_id, map_id);
CREATE INDEX IF NOT EXISTS idx_user_fish_map_shiny
  ON user_fish (map_id, is_shiny, total_caught DESC);
CREATE INDEX IF NOT EXISTS idx_economy_ledger_user_created_at
  ON economy_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_states_updated_at
  ON player_states (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_moderation_is_banned
  ON bot_moderation (is_banned, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_warning_logs_discord_id
  ON bot_warning_logs (discord_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_ban_logs_discord_id
  ON bot_ban_logs (discord_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_listings_active_created_at
  ON market_listings (active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_auctions_status_ends_at
  ON market_auctions (status, ends_at ASC);
CREATE INDEX IF NOT EXISTS idx_guild_members_contributions
  ON guild_members (guild_id, contributions DESC);
CREATE INDEX IF NOT EXISTS idx_server_memberships_guild_wallet
  ON server_memberships (discord_guild_id, commands_used DESC);
CREATE INDEX IF NOT EXISTS idx_season_user_scores_ranking
  ON season_user_scores (season_id, coins_earned DESC, fish_points DESC, gambling_profit DESC);

COMMIT;
