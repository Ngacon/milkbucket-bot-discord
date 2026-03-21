const { createGameEmbed } = require("../../utils/embeds");
const { formatCoins } = require("../../utils/formatters");

function getLocale(context) {
  return String(context.language || "en").startsWith("vi") ? "vi" : "en";
}

function getCoinflipBuzz(outcome, locale) {
  const won = outcome.result.won;
  const bet = Number(outcome.bet || 0);

  if (won && bet >= 1_000) {
    return locale === "vi"
      ? "Pha all-in nay nghe mui spotlight roi do."
      : "That high-stakes call had main-character energy all over it.";
  }

  if (won) {
    return locale === "vi"
      ? "Dong xu vua quay xong da thay ban co aura thuoc he may man."
      : "The coin took one look at you and decided to be generous today.";
  }

  if (bet >= 1_000) {
    return locale === "vi"
      ? "Pha nay hoi dau tim, nhung casino rat biet cach tao ky niem."
      : "That one stung, but the casino definitely knows how to create lore.";
  }

  return locale === "vi"
    ? "Thua keo nay thoi, dong xu van con no ban mot man comeback."
    : "You dropped this round, but the coin still owes you a comeback arc.";
}

function getCoinflipPulse(outcome, locale) {
  return [
    locale === "vi"
      ? `Ket qua roi vao: **${outcome.result.outcome}**`
      : `The coin landed on: **${outcome.result.outcome}**`,
    locale === "vi"
      ? `Profit round nay: **${formatCoins(outcome.result.profit)}**`
      : `Round profit: **${formatCoins(outcome.result.profit)}**`,
    locale === "vi"
      ? `Vi sau cu flip: **${formatCoins(outcome.summary.wallet)}**`
      : `Wallet after the flip: **${formatCoins(outcome.summary.wallet)}**`,
    outcome.result.pet_bonus
      ? locale === "vi"
        ? `Pet chen vao: **+${formatCoins(outcome.result.pet_bonus)}**`
        : `Pet proc: **+${formatCoins(outcome.result.pet_bonus)}**`
      : locale === "vi"
        ? "Pet dang ngoi xem."
        : "Your pet just watched this one."
  ].join("\n");
}

function getCoinflipFooter(outcome, locale) {
  if (outcome.result.won) {
    return locale === "vi"
      ? "Dang vao cau. Thu them Ncrash hoac Nwheel neu muon gay bao hon nua."
      : "You are on rhythm. Try Ncrash or Nwheel if you want even louder chaos.";
  }

  return locale === "vi"
    ? "Dung de casino cuoi lau qua. Nem tiep mot keo nho hoac di Nfish hoi mau."
    : "Don't let the casino laugh too long. Run a smaller flip or cool off with Nfish.";
}

module.exports = {
  name: "coinflip",
  aliases: ["cf"],
  description: "Flip a coin and emotionally overreact to the result.",
  cooldownMs: 4_000,
  async execute(context) {
    const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
    const locale = getLocale(context);
    const rawChoice = (context.args[0] || "heads").toLowerCase();
    const choiceMap = {
      h: "heads",
      heads: "heads",
      t: "tails",
      tails: "tails"
    };
    const choice = choiceMap[rawChoice];

    if (!choice) {
      throw new Error(t("coinflip.invalidChoice"));
    }

    const rawBet = context.args[1] || "100";
    const outcome = await context.services.economyService.playCoinflip(
      context.message.author,
      choice,
      rawBet,
      {
        user: context.user,
        skipBootstrap: Boolean(context.user),
        language: context.language
      }
    );

    const embed = createGameEmbed(t("coinflip.title"), context.config.embedColor, {
      commandName: "coinflip"
    })
      .setDescription(
        `${t("coinflip.description", {
          choice,
          outcome: outcome.result.outcome,
          flavor: outcome.result.flavor_text
        })}\n${getCoinflipBuzz(outcome, locale)}${
          outcome.result.mood_text ? `\n${outcome.result.mood_text}` : ""
        }`
      )
      .addFields(
        {
          name: outcome.result.won ? t("coinflip.resultWin") : t("coinflip.resultLose"),
          value: outcome.result.won
            ? t("coinflip.winValue", {
                payout: formatCoins(outcome.result.payout),
                profit: formatCoins(outcome.result.profit)
              })
            : t("coinflip.loseValue", {
                loss: formatCoins(Math.abs(outcome.result.profit))
              }),
          inline: false
        },
        {
          name: t("coinflip.wallet"),
          value: formatCoins(outcome.summary.wallet),
          inline: true
        },
        {
          name: t("coinflip.bet"),
          value: formatCoins(outcome.bet),
          inline: true
        },
        {
          name: locale === "vi" ? "Pet Sync" : "Pet Sync",
          value: outcome.result.pet_name
            ? `${outcome.result.pet_name} -> ${outcome.result.pet_ability || "Support"}\nPet XP: **+${outcome.result.pet_xp || 0}**`
            : locale === "vi"
              ? "Khong co pet active tham gia keo nay."
              : "No active pet joined this flip.",
          inline: false
        },
        {
          name: locale === "vi" ? "Nhip Casino" : "Casino Pulse",
          value: getCoinflipPulse(outcome, locale),
          inline: false
        }
      )
      .setFooter({
        text: getCoinflipFooter(outcome, locale)
      });

    await context.message.reply({ embeds: [embed] });
  }
};
