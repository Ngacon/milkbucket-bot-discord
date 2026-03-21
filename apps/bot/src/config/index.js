const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function readNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    const sslMode = url.searchParams.get("sslmode");
    const useLibpqCompat = url.searchParams.get("uselibpqcompat");

    if (useLibpqCompat !== "true" && ["prefer", "require", "verify-ca"].includes(sslMode)) {
      url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function isLocalServiceUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function normalizeRngMode(rawMode, serviceUrl) {
  const normalized = String(rawMode || "")
    .trim()
    .toLowerCase();

  if (["auto", "local", "service"].includes(normalized)) {
    return normalized;
  }

  return isLocalServiceUrl(serviceUrl) ? "local" : "auto";
}

const rngServiceUrl = process.env.RNG_SERVICE_URL || "http://localhost:8080";
const defaultRngTimeoutMs = isLocalServiceUrl(rngServiceUrl) ? 700 : 1_800;
const rngMode = normalizeRngMode(process.env.RNG_MODE, rngServiceUrl);

module.exports = {
  discordToken: process.env.DISCORD_TOKEN,
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL),
  rngServiceUrl,
  rngMode,
  rngTimeoutMs: readNumber("RNG_TIMEOUT_MS", defaultRngTimeoutMs),
  rngFallbackCooldownMs: readNumber(
    "RNG_FALLBACK_COOLDOWN_MS",
    isLocalServiceUrl(rngServiceUrl) ? 90_000 : 30_000
  ),
  prefix: process.env.BOT_PREFIX || "N",
  defaultLanguage: process.env.BOT_DEFAULT_LANGUAGE || "en",
  embedColor: process.env.DEFAULT_EMBED_COLOR || "#00B894",
  antiSpamWindowMs: readNumber("ANTI_SPAM_WINDOW_MS", 10_000),
  antiSpamMaxCommands: readNumber("ANTI_SPAM_MAX_COMMANDS", 5),
  antiSpamLockMs: readNumber("ANTI_SPAM_LOCK_MS", 20_000),
  chaosEventChance: readNumber("CHAOS_EVENT_CHANCE", 0.05),
  ambientEventChance: readNumber("AMBIENT_EVENT_CHANCE", 0.012)
};
