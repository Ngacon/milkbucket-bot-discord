# Botgame Architecture

## Design goals

- Prefix-first gameplay with short aliases and fast command resolution.
- Discord.js handles UX, permissions, cooldowns, spam control, and social event triggers.
- Go owns all fairness-sensitive RNG for gambling, fishing, loot drops, and future boss/event rolls.
- PostgreSQL is the source of truth for player progress, inventory, fish dex, guilds, seasons, and leaderboards.
- The vibe is intentionally chaotic, meme-heavy, and reward-loop driven.

## Folder structure

```text
botgame/
├── apps/
│   └── bot/
│       ├── package.json
│       ├── .env.example
│       └── src/
│           ├── bootstrap/
│           ├── commands/
│           │   ├── economy/
│           │   ├── fishing/
│           │   └── gambling/
│           ├── config/
│           ├── events/
│           ├── handlers/
│           ├── repositories/
│           ├── services/
│           └── utils/
├── db/
│   ├── queries.sql
│   ├── schema.sql
│   └── seed_items.sql
├── docs/
│   └── architecture.md
└── services/
    └── rng/
        ├── go.mod
        ├── .env.example
        ├── internal/
        │   ├── api/
        │   └── domain/
        └── main.go
```

## Node.js bot responsibilities

- `events/messageCreate.js`: prefix parser, alias resolution, anti-spam, cooldown enforcement, error handling, and post-command chaos hooks.
- `handlers/aliasResolver.js`: maps `Nwallet`, `Nw`, `Nfish`, `Nf`, `Ncoinflip`, `Ncf`, `Ninventory`, `Ninv` to the canonical command modules.
- `services/profileService.js`: guarantees starter state for every player so commands can stay lean.
- `repositories/*`: isolates SQL access and keeps command code focused on game flow instead of query noise.

## Go RNG responsibilities

- `ResolveCoinflip`: fair 50/50 outcome with explicit house edge through payout multiplier.
- `ResolveFishingCast`: biome-aware species pools, rarity weights, trash outcomes, treasure chest rolls, jackpot fish, and ultra-rare boss fish.
- Future-ready for `Ndice`, `Nslots`, `Nbj`, `Nduel`, loot box openings, crime outcomes, and seasonal boss events.

## PostgreSQL design notes

- `users` + `economy`: core identity, progression, streaks, and monetary state.
- `inventory` + `items`: normalized item catalog with per-user state like quantity, durability, upgrades, and equipment flags.
- `fish_collection`: deep fishing history for `Ninv`, `Nsell`, fish dex, analytics, and seasonal scoring.
- `guilds` + `guild_members`: in-game clans with bank, contribution tracking, and leaderboard support.
- `server_memberships`: per-Discord-server slices for local leaderboards and event tuning.
- `season_configs` + `season_user_scores`: seasonal reset-friendly ranking layer.

## Planned command surface

- Economy: `Nwallet`, `Nbank`, `Ndaily`, `Nweekly`, `Nwork`, `Ncrime`, `Nbeg`, `Nleaderboard`
- Gambling: `Ncf`, `Nslots`, `Nbj`, `Ndice`, `Nduel`
- Fishing: `Nfish`, `Ninv`, `Nsell`, `Nrod`, `Nbait`, `Ncraft`, `Nupgrade`
- Social: `Nguild create`, `Nguild join`, `Nguild bank`, `Ncoopfish`
- Seasonal chaos: `Nseason`, `Npass`, `Nboss`, `Nraid`

## Sample API flow

1. User sends `Nf volcano`
2. Discord bot parses prefix `N`, resolves alias `f -> fish`, checks cooldown/spam limits
3. Bot loads player profile, equipped rod/bait, then POSTs to Go:

```json
{
  "user_id": "1234567890",
  "biome": "volcano",
  "rod_key": "rod_bamboo",
  "rod_tier": 1,
  "bait_key": "bait_worm",
  "bait_luck": 0.01,
  "durability_bonus": 0
}
```

4. Go returns the rolled catch:

```json
{
  "species_key": "volcano_smoketail",
  "species_name": "Smoketail Tuna",
  "biome": "volcano",
  "rarity": "rare",
  "weight_kg": "6.32",
  "length_cm": "88.14",
  "quality_score": 81,
  "estimated_value": 515,
  "xp": 75,
  "durability_loss": 2,
  "chest": false,
  "trash": false,
  "bait_used": true,
  "coin_bonus": 0,
  "is_boss": false,
  "is_jackpot": false,
  "flavor_text": "The water exploded and your rod made a sound it will remember forever."
}
```

5. Bot stores the catch in Postgres, updates XP, degrades durability, grants loot/coins, then replies with a flashy embed.

## Scaling notes

- Keep command handlers stateless and push persistence into repositories/services.
- Add Redis later for distributed cooldowns, anti-spam, and event queue fanout.
- Migrate REST to gRPC when more RNG-heavy commands require lower overhead or server-streamed seasonal events.
- Use materialized leaderboard views if guild/server rankings become hot paths.

