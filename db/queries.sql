-- Global rich list
SELECT
  u.username,
  e.wallet,
  e.bank,
  (e.wallet + e.bank) AS net_worth,
  u.level,
  u.prestige
FROM economy e
INNER JOIN users u ON u.id = e.user_id
ORDER BY net_worth DESC
LIMIT 25;

-- Server leaderboard
SELECT
  sm.server_name,
  u.username,
  e.wallet,
  e.bank,
  sm.commands_used,
  sm.fish_caught
FROM server_memberships sm
INNER JOIN users u ON u.id = sm.user_id
INNER JOIN economy e ON e.user_id = u.id
WHERE sm.discord_guild_id = $1
ORDER BY (e.wallet + e.bank) DESC, sm.commands_used DESC
LIMIT 20;

-- Clan leaderboard
SELECT
  g.name,
  g.tag,
  g.bank,
  g.level,
  COALESCE(SUM(gm.contributions), 0) AS total_contributions,
  COUNT(gm.user_id) AS member_count
FROM guilds g
LEFT JOIN guild_members gm ON gm.guild_id = g.id
GROUP BY g.id
ORDER BY g.level DESC, total_contributions DESC, g.bank DESC
LIMIT 20;

-- Fishing inventory summary
SELECT
  species_name,
  rarity,
  COUNT(*) AS copies,
  MAX(est_value) AS best_est_value,
  MAX(caught_at) AS latest_catch
FROM fish_collection
WHERE user_id = $1
  AND sold = FALSE
GROUP BY species_name, rarity
ORDER BY
  CASE rarity
    WHEN 'mythical' THEN 6
    WHEN 'legendary' THEN 5
    WHEN 'epic' THEN 4
    WHEN 'rare' THEN 3
    WHEN 'uncommon' THEN 2
    ELSE 1
  END DESC,
  latest_catch DESC;

-- Seasonal ranking snapshot
SELECT
  sc.season_key,
  u.username,
  sus.coins_earned,
  sus.fish_points,
  sus.gambling_profit,
  (sus.coins_earned + sus.fish_points + sus.guild_points + sus.gambling_profit) AS total_points
FROM season_user_scores sus
INNER JOIN season_configs sc ON sc.id = sus.season_id
INNER JOIN users u ON u.id = sus.user_id
WHERE sc.is_active = TRUE
ORDER BY total_points DESC
LIMIT 50;
