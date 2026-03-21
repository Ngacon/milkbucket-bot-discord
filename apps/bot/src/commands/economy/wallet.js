const { createGameEmbed } = require("../../utils/embeds");
const { formatCoins } = require("../../utils/formatters");

function getLocale(context) {
  return String(context.language || "en").startsWith("vi") ? "vi" : "en";
}

function getWalletFlavor(summary, locale) {
  const netWorth = Number(summary.wallet) + Number(summary.bank);

  if (summary.streak_days >= 7) {
    return locale === "vi"
      ? "Chuỗi điểm danh đang chạy rất đẹp, máy in Milk Coin đang nóng dần."
      : "That streak is looking spicy. The Milk Coin printer is warming up.";
  }

  if (Number(summary.bank) > Number(summary.wallet) * 2) {
    return locale === "vi"
      ? "Bạn đang thủ khá kỹ, ngân hàng đang gánh phần flex tiền bạc."
      : "You are playing defense well. The bank is doing most of the flexing.";
  }

  if (summary.prestige > 0) {
    return locale === "vi"
      ? "Uy danh đã lên tiếng, đống coin bắt đầu nể bạn rồi."
      : "Prestige aura detected. The coins are starting to respect you.";
  }

  if (netWorth < 2_500) {
    return locale === "vi"
      ? "Ví còn hơi mỏng, làm vài cú fish hoặc work nữa là vào form."
      : "The wallet is still light. A few fish or work runs will wake it up.";
  }

  return locale === "vi"
    ? "Tài chính ổn áp, chỉ cần thêm một pha hên nữa là thành truyền thuyết server."
    : "The balance looks healthy. One lucky run away from becoming server lore.";
}

function getWalletFooter(summary, locale, fallbackFooter) {
  if (summary.streak_days >= 3) {
    return locale === "vi"
      ? "Combo đẹp đấy. Thử Ninvest hoặc Nlottery nếu muốn đánh lớn hơn."
      : "Nice streak. Try Ninvest or Nlottery if you want higher-stakes chaos.";
  }

  if (Number(summary.wallet) < 500) {
    return locale === "vi"
      ? "Ví đang cần được hồi sức. Nfish, Nmine, Nhunt đều là lựa chọn ngon."
      : "The wallet needs a refill. Nfish, Nmine, and Nhunt are all solid fuel.";
  }

  return fallbackFooter;
}

module.exports = {
  name: "wallet",
  aliases: ["w"],
  description: "Peek at your chaotic wallet, bank, and level progress.",
  cooldownMs: 3_000,
  async execute(context) {
    const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
    const locale = getLocale(context);
    const targetUser = context.message.mentions.users.first() || context.message.author;
    const isSelfTarget = targetUser.id === context.message.author.id && context.user;
    const snapshot = isSelfTarget
      ? {
          user: context.user,
          summary: await context.repositories.economyRepository.getSummary(context.user.id)
        }
      : await context.services.economyService.getWalletSnapshot(targetUser);
    const walletFlavor = getWalletFlavor(snapshot.summary, locale);
    const xpLocale = locale === "vi" ? "vi-VN" : "en-US";

    const embed = createGameEmbed(
      t("wallet.title", {
        user: targetUser.username
      }),
      context.config.embedColor,
      { commandName: "wallet" }
    )
      .setDescription(`${t("wallet.description")}\n${walletFlavor}`)
      .addFields(
        {
          name: t("wallet.cash"),
          value: formatCoins(snapshot.summary.wallet),
          inline: true
        },
        {
          name: t("wallet.bank"),
          value: formatCoins(snapshot.summary.bank),
          inline: true
        },
        {
          name: t("wallet.netWorth"),
          value: formatCoins(Number(snapshot.summary.wallet) + Number(snapshot.summary.bank)),
          inline: true
        },
        {
          name: t("wallet.level"),
          value: `Lv.${snapshot.summary.level} | 🔥 ${snapshot.summary.prestige}`,
          inline: true
        },
        {
          name: t("wallet.xp"),
          value: `${snapshot.summary.xp.toLocaleString(xpLocale)} XP`,
          inline: true
        },
        {
          name: t("wallet.streak"),
          value: t("wallet.streakDays", {
            count: snapshot.summary.streak_days
          }),
          inline: true
        }
      )
      .setFooter({
        text: getWalletFooter(snapshot.summary, locale, t("wallet.footer"))
      });

    await context.message.reply({ embeds: [embed] });
  }
};
