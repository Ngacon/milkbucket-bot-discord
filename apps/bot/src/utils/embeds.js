const { EmbedBuilder } = require("discord.js");

const COMMAND_GROUPS = {
  economy: new Set(["wallet", "inventory", "invest", "loan", "repay", "interest", "lottery", "jackpot"]),
  gambling: new Set(["coinflip", "crash", "mines", "wheel", "plinko", "baccarat"]),
  fishing: new Set(["fish", "deepsea", "net", "aquarium", "release", "mutate"]),
  work: new Set(["mine", "hunt", "farm", "cook", "deliver"]),
  utility: new Set(["help", "config", "settings", "profile"]),
  admin: new Set(["warn", "ban", "cleardata"]),
  pets: new Set(["pet"]),
  world: new Set(["island", "travel", "map", "zone", "dungeon", "gift", "redeem", "chest"]),
  social: new Set([
    "marry",
    "divorce",
    "family",
    "house",
    "decorate",
    "bounty",
    "steal",
    "arrest",
    "jail",
    "escape",
    "market",
    "sell",
    "buy",
    "auction"
  ]),
  minigames: new Set(["guess", "battle", "quiz", "fasttype"])
};

const THEME_PRESETS = {
  default: {
    color: "#00B894",
    iconCodepoint: "2728",
    imageTitle: "Live Feed",
    imageSubtitle: "Chaotic systems, cleaner panels.",
    imagePalette: ["0F172A", "155E75", "14B8A6"],
    author: "Milk Bucket // Live Feed",
    footer: "Chaotic systems, cleaner panels."
  },
  economy: {
    color: "#16A34A",
    iconCodepoint: "1f4b0",
    imageTitle: "Economy Desk",
    imageSubtitle: "Wallets, vaults, and pressure-tested loops.",
    imagePalette: ["111827", "065F46", "16A34A"],
    author: "Milk Bucket // Economy Desk",
    footer: "Wallets, vaults, and pressure-tested loops."
  },
  gambling: {
    color: "#EF4444",
    iconCodepoint: "1f3b0",
    imageTitle: "Casino Floor",
    imageSubtitle: "High risk, louder outcomes.",
    imagePalette: ["1F2937", "991B1B", "EF4444"],
    author: "Milk Bucket // Casino Floor",
    footer: "High risk, louder outcomes."
  },
  fishing: {
    color: "#0EA5E9",
    iconCodepoint: "1f41f",
    imageTitle: "Fishing Feed",
    imageSubtitle: "Maps, bites, and rare pull energy.",
    imagePalette: ["0F172A", "1D4ED8", "38BDF8"],
    author: "Milk Bucket // Fishing Feed",
    footer: "Maps, bites, and rare pull energy."
  },
  work: {
    color: "#F59E0B",
    iconCodepoint: "26cf",
    imageTitle: "Work Loop",
    imageSubtitle: "Shifts, skill bars, and resource stacks.",
    imagePalette: ["111827", "B45309", "F59E0B"],
    author: "Milk Bucket // Work Loop",
    footer: "Shifts, skill bars, and resource stacks."
  },
  utility: {
    color: "#8B5CF6",
    iconCodepoint: "1f4d8",
    imageTitle: "Command Desk",
    imageSubtitle: "Config, help, and operator controls.",
    imagePalette: ["111827", "4C1D95", "8B5CF6"],
    author: "Milk Bucket // Command Desk",
    footer: "Config, help, and operator controls."
  },
  admin: {
    color: "#DC2626",
    iconCodepoint: "1f6e1",
    imageTitle: "Operator Desk",
    imageSubtitle: "Moderation controls and irreversible buttons.",
    imagePalette: ["111827", "7F1D1D", "DC2626"],
    author: "Milk Bucket // Operator Desk",
    footer: "Moderation controls and irreversible buttons."
  },
  pets: {
    color: "#EC4899",
    iconCodepoint: "1f43e",
    imageTitle: "Pet Hub",
    imageSubtitle: "Companions, boosts, and idle chaos.",
    imagePalette: ["1F2937", "9D174D", "EC4899"],
    author: "Milk Bucket // Pet Hub",
    footer: "Companions, boosts, and idle chaos."
  },
  world: {
    color: "#14B8A6",
    iconCodepoint: "1f30d",
    imageTitle: "World Grid",
    imageSubtitle: "Zones, travel, and reward runs.",
    imagePalette: ["0F172A", "0F766E", "14B8A6"],
    author: "Milk Bucket // World Grid",
    footer: "Zones, travel, and reward runs."
  },
  social: {
    color: "#F97316",
    iconCodepoint: "1f91d",
    imageTitle: "Social Wire",
    imageSubtitle: "Players, homes, and criminal side quests.",
    imagePalette: ["1F2937", "9A3412", "F97316"],
    author: "Milk Bucket // Social Wire",
    footer: "Players, homes, and criminal side quests."
  },
  minigames: {
    color: "#6366F1",
    iconCodepoint: "1f579",
    imageTitle: "Mini Arena",
    imageSubtitle: "Quick hits, reaction checks, instant chaos.",
    imagePalette: ["111827", "4338CA", "818CF8"],
    author: "Milk Bucket // Mini Arena",
    footer: "Quick hits, reaction checks, instant chaos."
  }
};

function resolveThemeKey(commandName) {
  const normalized = String(commandName || "").trim().toLowerCase();
  for (const [themeKey, commands] of Object.entries(COMMAND_GROUPS)) {
    if (commands.has(normalized)) {
      return themeKey;
    }
  }

  return "default";
}

function buildTwemojiUrl(codepoint) {
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/${codepoint}.png`;
}

function buildHeroImageUrl(theme, options = {}) {
  const title = options.imageTitle || theme.imageTitle || "Milk Bucket";
  const subtitle = options.imageSubtitle || theme.imageSubtitle || theme.footer || "";
  const palette = Array.isArray(options.imagePalette) && options.imagePalette.length
    ? options.imagePalette
    : theme.imagePalette || ["0F172A", "155E75", "14B8A6"];
  const colorStops = palette
    .slice(0, 3)
    .map((hex, index) => `${index * 50}:${String(hex).replace(/^#/, "")}`)
    .join(",");

  return (
    "https://capsule-render.vercel.app/api" +
    `?type=soft` +
    `&height=240` +
    `&color=${encodeURIComponent(colorStops)}` +
    `&text=${encodeURIComponent(title)}` +
    `&fontColor=${encodeURIComponent("F8FAFC")}` +
    `&fontAlign=50` +
    `&fontAlignY=42` +
    `&desc=${encodeURIComponent(subtitle)}` +
    `&descAlign=50` +
    `&descAlignY=65` +
    `&descSize=18`
  );
}

function resolveTheme(options = {}) {
  const baseTheme = THEME_PRESETS[options.theme || resolveThemeKey(options.commandName)] || THEME_PRESETS.default;

  return {
    ...baseTheme,
    iconUrl: buildTwemojiUrl(baseTheme.iconCodepoint),
    imageUrl: buildHeroImageUrl(baseTheme, options)
  };
}

function createGameEmbed(title, color, options = {}) {
  const theme = resolveTheme(options);
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(options.useThemeColor ? theme.color : color || theme.color)
    .setTimestamp()
    .setAuthor({
      name: options.author || theme.author,
      iconURL: theme.iconUrl
    });

  if (options.thumbnail !== false) {
    embed.setThumbnail(options.thumbnailUrl || theme.iconUrl);
  }

  if (options.image !== false) {
    embed.setImage(options.imageUrl || theme.imageUrl);
  }

  if (options.footer !== false) {
    embed.setFooter({
      text: options.footerText || theme.footer,
      iconURL: theme.iconUrl
    });
  }

  return embed;
}

module.exports = { createGameEmbed };
