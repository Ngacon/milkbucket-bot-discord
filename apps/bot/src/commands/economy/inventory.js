const { createGameEmbed } = require("../../utils/embeds");
const { formatCoins, progressBar, rarityEmoji } = require("../../utils/formatters");

function getLocale(context) {
  return String(context.language || "en").startsWith("vi") ? "vi" : "en";
}

function getInventoryMood(items, fishSummary, locale) {
  if (!items.length && !fishSummary.total_catches) {
    return locale === "vi"
      ? "Ba lo hoi trong, nhung doi khi day la dau hieu cua mot pha loot sap no ra."
      : "The backpack is pretty empty, which is sometimes the first sign of incoming loot chaos.";
  }

  if (fishSummary.total_catches >= 8) {
    return locale === "vi"
      ? "Kho ca dang cang det. Ban mot phat la vi se reo am am."
      : "That fish vault is getting heavy. One big sell and the wallet will start singing.";
  }

  if (items.some((item) => item.equipped)) {
    return locale === "vi"
      ? "Do nghe da vao form, nhin la biet san sang di farm tiep."
      : "The loadout looks ready. This inventory has strong 'one more run' energy.";
  }

  return locale === "vi"
    ? "Kho do nhin kha co tuong lai, chi thieu them vai mon loot dam nua."
    : "The stash has potential. It just needs a few more juicy drops.";
}

function getInventoryFooter(items, fishSummary, locale) {
  if (fishSummary.total_catches > 0) {
    return locale === "vi"
      ? "Kho ca dang cho duoc xu ly. Thu Nmarket hoac len them vai cu Nfish."
      : "The fish vault is waiting for action. Try Nmarket or squeeze in a few more Nfish runs.";
  }

  if (!items.length) {
    return locale === "vi"
      ? "Thu Nfish reef, Nmine, hoac Nchest de nhan them do."
      : "Try Nfish reef, Nmine, or Nchest to start stuffing this bag.";
  }

  return locale === "vi"
    ? "Do nghe on roi, gio chi can them mot vong farm nua cho nong may."
    : "The gear is set. One more farming loop would make this bag look dangerous.";
}

module.exports = {
  name: "inventory",
  aliases: ["inv"],
  description: "Inspect rods, bait, and spicy loot.",
  cooldownMs: 5_000,
  async execute(context) {
    const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
    const locale = getLocale(context);
    const user =
      context.user || (await context.services.profileService.resolveByDiscordUser(context.message.author));
    const items = await context.repositories.inventoryRepository.getOverview(user.id);
    const fishSummary = await context.repositories.fishRepository.getUnsoldSummary(user.id);
    const mood = getInventoryMood(items, fishSummary, locale);

    const lines = items.slice(0, 12).map((item) => {
      const durability = item.durability
        ? ` | ${t("inventory.durability")} ${progressBar(
            item.durability,
            Math.max(item.durability, 100),
            6
          )} ${item.durability}`
        : "";
      const equipped = item.equipped ? ` ${t("inventory.equipped")}` : "";
      return `${item.emoji || rarityEmoji(item.rarity)} **${item.name}** x${item.quantity}${equipped}${durability}`;
    });

    const embed = createGameEmbed(t("inventory.title"), context.config.embedColor)
      .setDescription(
        lines.length ? `**${mood}**\n\n${lines.join("\n")}` : `${t("inventory.empty")}\n${mood}`
      )
      .addFields({
        name: t("inventory.unsoldFish"),
        value: t("inventory.unsoldFishValue", {
          catches: fishSummary.total_catches,
          shiny: fishSummary.shiny_count,
          value: formatCoins(fishSummary.est_value)
        }),
        inline: false
      })
      .setFooter({
        text: getInventoryFooter(items, fishSummary, locale)
      });

    await context.message.reply({ embeds: [embed] });
  }
};
