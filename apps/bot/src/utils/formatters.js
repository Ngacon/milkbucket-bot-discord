function formatCoins(value) {
  return `🪙 ${Number(value || 0).toLocaleString("en-US")}`;
}

function rarityEmoji(rarity) {
  switch ((rarity || "").toLowerCase()) {
    case "mythical":
      return "🌌";
    case "legendary":
      return "🟡";
    case "epic":
      return "🟣";
    case "rare":
      return "🔵";
    case "uncommon":
      return "🟢";
    default:
      return "⚪";
  }
}

function progressBar(current, max, size = 10) {
  if (max <= 0) {
    return "░".repeat(size);
  }

  const filled = Math.max(0, Math.min(size, Math.round((current / max) * size)));
  return `${"█".repeat(filled)}${"░".repeat(size - filled)}`;
}

function formatDuration(ms) {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}

module.exports = {
  formatCoins,
  rarityEmoji,
  progressBar,
  formatDuration
};

