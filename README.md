# Botgame

Chaotic Discord economy bot with:

- `apps/bot`: Node.js + Discord.js command layer
- `db`: PostgreSQL schema and seeds
- `services/rng`: optional Go RNG service

## Runtime Notes

- The bot now boots and plays fine without Go.
- Local RNG is the default path for localhost setups via `RNG_MODE=local`.
- Go RNG is optional if you want to experiment with a separate service again later.

## Quick Start

### 1. Database

The bot auto-runs `db/schema.sql` and `db/seed_items.sql` on startup.

### 2. Bot

```powershell
cd apps/bot
Copy-Item .env.example .env
npm install
npm start
```

## Environment

Example values in [apps/bot/.env.example](/c:/Users/Admin/.vscode/Project/botgame/apps/bot/.env.example):

- `DISCORD_TOKEN=...`
- `DATABASE_URL=postgresql://...`
- `RNG_SERVICE_URL=http://localhost:8080`
- `RNG_MODE=local`
- `RNG_FALLBACK_COOLDOWN_MS=90000`
- `BOT_PREFIX=N`
- `BOT_DEFAULT_LANGUAGE=en`

## Existing Commands

- `Nwallet` / `Nw`
- `Ninventory` / `Ninv`
- `Nfish` / `Nf`
- `Ncoinflip` / `Ncf`

## Expanded Commands

- Economy: `Ninvest`, `Nloan`, `Nrepay`, `Ninterest`, `Nlottery`, `Njackpot`
- Work: `Nmine`, `Nhunt`, `Nfarm`, `Ncook`, `Ndeliver`
- Gambling: `Ncrash`, `Nmines`, `Nwheel`, `Nplinko`, `Nbaccarat`
- Fishing: `Ndeepsea`, `Nnet`, `Naquarium`, `Nrelease`, `Nmutate`
- Island: `Nisland buy`, `Nisland upgrade`, `Nisland visit`, `Nisland fish`, `Nisland collect`, `Nisland defend`
- Pets: `Npet`, `Npet list`, `Npet buy`, `Npet equip`, `Npet train`, `Npet battle`, `Npet duel`, `Npet ability`, `Npet idle`, `Npet evolve`
- Social: `Nmarry @user`, `Ndivorce`, `Nfamily`
- Housing: `Nhouse`, `Nhouse buy`, `Nhouse upgrade`, `Ndecorate`
- Crime: `Nbounty @user`, `Nsteal`, `Narrest`, `Njail`, `Nescape`
- Player market: `Nmarket`, `Nsell player`, `Nbuy player`, `Nauction`
- Mini games: `Nquiz`, `Nfasttype`, `Nguess`, `Nbattle`
- World: `Ntravel`, `Nmap`, `Nzone`, `Ndungeon`
- Rewards: `Ngift`, `Nredeem`, `Nchest`
- Utility: `Nconfig`, `Nsettings`, `Nprofile view @user`, `Nhelp`

## Pet 2.0 Highlights

- Multiple pets in a roster with one active pet
- Pet stats: level, XP, mood, hunger, energy, rarity, personality
- `Npet train` for attack / defense / luck growth
- `Npet battle` for PvE pet fights
- `Npet duel @user` for PvP pet duels
- `Npet ability` to inspect and equip unlocked abilities
- `Npet idle fish|work|scavenge|rest` for passive loops
- `Npet idle collect` to claim time-based rewards
- Evolution stages that unlock stronger forms and more abilities

## Language

- `Nconfig language vi`
- `Nconfig language en`
- `Nsettings`
- `Nhelp <command>`
