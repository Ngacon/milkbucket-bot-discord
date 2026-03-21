const { createGameEmbed } = require("../../utils/embeds");
const { formatCoins, rarityEmoji } = require("../../utils/formatters");

function getLocale(context) {
  return String(context.language || "en").startsWith("vi") ? "vi" : "en";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMapInfoEmbed(context, locale, payload) {
  const embed = createGameEmbed(
    locale === "vi" ? "Thông Tin Bản Đồ Câu Cá" : "Fishing Map Intel",
    context.config.embedColor
  );

  embed
    .setDescription(
      locale === "vi"
        ? `Bản đồ hiện tại: **${payload.map.label}**\n${payload.map.description}`
        : `Current map: **${payload.map.label}**\n${payload.map.description}`
    )
    .addFields(
      {
        name: locale === "vi" ? "Tiến Độ Bản Đồ" : "Map Progress",
        value: [
          `${locale === "vi" ? "Loài đã bắt" : "Caught species"}: **${payload.progress.caught_species || 0}/${payload.map.fish.length}**`,
          `${locale === "vi" ? "Tổng số cá" : "Total catches"}: **${payload.progress.total_caught || 0}**`,
          `${locale === "vi" ? "Loài Shiny" : "Shiny species"}: **${payload.progress.shiny_species || 0}**`
        ].join("\n"),
        inline: true
      },
      {
        name: locale === "vi" ? "Trang Bị" : "Loadout",
        value: [
          `${locale === "vi" ? "Cần câu" : "Rod"}: **${payload.loadout.rod?.name || "Không có"}**`,
          `${locale === "vi" ? "Mồi" : "Bait"}: **${payload.loadout.bait?.name || "Không có"}**`,
          `${locale === "vi" ? "Bộ sưu tập tổng" : "Overall collection"}: **${payload.overall.caught_species || 0} loài**`
        ].join("\n"),
        inline: true
      },
      {
        name: locale === "vi" ? "Danh Sách Cá" : "Fish List",
        value: payload.map.fish
          .map((fish) => `${rarityEmoji(fish.rarity)} ${fish.name}`)
          .join("\n"),
        inline: false
      }
    )
    .setFooter({
      text:
        locale === "vi"
          ? "Dùng Ntravel <map> để đổi bản đồ, Nfish để thả cần, Nfish collection để xem album."
          : "Use Ntravel <map> to move, Nfish to cast, and Nfish collection to inspect your album."
    });

  return embed;
}

function buildCollectionEmbed(context, locale, payload) {
  const embed = createGameEmbed(
    locale === "vi" ? "Bộ Sưu Tập Cá" : "Fish Collection",
    context.config.embedColor
  );

  embed
    .setDescription(
      locale === "vi"
        ? `Bản đồ đang xem: **${payload.map.label}**`
        : `Viewing collection progress for **${payload.map.label}**`
    )
    .addFields(
      {
        name: locale === "vi" ? "Bản Đồ Hiện Tại" : "Current Map",
        value: [
          `${locale === "vi" ? "Số loài" : "Species"}: **${payload.progress.caught_species || 0}/${payload.map.fish.length}**`,
          `${locale === "vi" ? "Tổng số cá" : "Total catches"}: **${payload.progress.total_caught || 0}**`,
          `${locale === "vi" ? "Số Shiny" : "Shiny"}: **${payload.progress.shiny_species || 0}**`
        ].join("\n"),
        inline: true
      },
      {
        name: locale === "vi" ? "Tổng Quan" : "Overall",
        value: [
          `${locale === "vi" ? "Số loài đã mở" : "Unlocked species"}: **${payload.overall.caught_species || 0}**`,
          `${locale === "vi" ? "Tổng số cá đã bắt" : "Total catches"}: **${payload.overall.total_caught || 0}**`,
          `${locale === "vi" ? "Tổng số Shiny" : "Total shiny species"}: **${payload.overall.shiny_species || 0}**`
        ].join("\n"),
        inline: true
      }
    );

  return embed;
}

function buildLeaderboardEmbed(context, locale, payload) {
  const embed = createGameEmbed(
    locale === "vi" ? "Bảng Xếp Hạng Câu Cá" : "Fishing Leaderboard",
    context.config.embedColor
  );

  const titleSuffix = payload.mapKey
    ? ` - ${payload.mapKey}`
    : locale === "vi"
      ? " - Tổng"
      : " - global";

  embed.setDescription(
    `${locale === "vi" ? "Top những ngư thủ hàng đầu" : "Top fishers"}${titleSuffix}`
  );

  embed.addFields({
    name: locale === "vi" ? "Thứ hạng" : "Standings",
    value: payload.rows.length
      ? payload.rows
          .map(
            (row, index) =>
              `**${index + 1}.** ${row.username} | ${row.total_caught} lần câu | ${row.shiny_species} shiny | ${formatCoins(row.score)}`
          )
          .join("\n")
      : locale === "vi"
        ? "Chưa có dữ liệu."
        : "No data yet.",
    inline: false
  });

  return embed;
}

function getFishBuzz(result, locale) {
  if (result.result.is_shiny) {
    return locale === "vi"
      ? "Cực phẩm Shiny đã xuất hiện! Pha này đem đi flex thì hết bài."
      : "Shiny proc. This is certified flex fuel.";
  }

  if (result.result.chest) {
    return locale === "vi"
      ? "Con cá này kéo theo cả một rương báu vật lên cùng luôn!"
      : "This catch dragged bonus loot up with it.";
  }

  if (["legendary", "epic"].includes(String(result.result.rarity || "").toLowerCase())) {
    return locale === "vi"
      ? "Cảm giác kéo cần rất nặng... Một con hàng cực phẩm đây rồi!"
      : "That pull had premium energy.";
  }

  return locale === "vi"
    ? "Dây câu khá mượt, nhịp độ đang rất tốt đấy!"
    : "Clean line. Keep the loop going.";
}

module.exports = {
  name: "fish",
  aliases: ["f"],
  description: "Cast into the current fishing map or inspect map fish pools and leaderboard.",
  cooldownMs: 10_000,
  async execute(context) {
    const locale = getLocale(context);
    const subcommand = String(context.args[0] || "").toLowerCase();
    const fishService = context.services.fishingService;
    const sharedOptions = {
      user: context.user,
      skipBootstrap: Boolean(context.user)
    };

    if (subcommand === "info") {
      const payload = await fishService.getMapInfo(context.message.author, {
        ...sharedOptions,
        mapKey: context.args[1] || ""
      });
      await context.message.reply({ embeds: [buildMapInfoEmbed(context, locale, payload)] });
      return;
    }

    if (subcommand === "collection" || subcommand === "album") {
      const payload = await fishService.getCollectionOverview(context.message.author, {
        ...sharedOptions,
        mapKey: context.args[1] || ""
      });
      await context.message.reply({ embeds: [buildCollectionEmbed(context, locale, payload)] });
      return;
    }

    if (subcommand === "leaderboard" || subcommand === "lb" || subcommand === "top") {
      const payload = await fishService.getLeaderboard({
        mapKey: context.args[1] || null
      });
      await context.message.reply({ embeds: [buildLeaderboardEmbed(context, locale, payload)] });
      return;
    }

    const castingMessage = await context.message.reply(
      locale === "vi" ? "🎣 Đang thả cần... Chờ chút nhé!" : "🎣 Casting..."
    );
    const result = await fishService.castLine(context.message.author, context.args[0] || "", sharedOptions);
    await wait(result.result.cast_delay_ms);

    const embed = createGameEmbed(
      locale === "vi" ? "Kết Quả Câu Cá" : "Fishing Result",
      context.config.embedColor
    )
      .setDescription(
        [
          `${rarityEmoji(result.result.rarity)} **${result.result.species_name}** từ **${result.map.label}**`,
          result.result.flavor_text,
          result.result.bite_line,
          getFishBuzz(result, locale)
        ].join("\n")
      )
      .addFields(
        {
          name: locale === "vi" ? "Thông Số" : "Catch",
          value: [
            `Độ hiếm: **${result.result.rarity}**`,
            `Shiny: **${result.result.is_shiny ? "Có" : "Không"}**`,
            `Cân nặng: **${result.result.weight_kg} kg**`,
            `Chiều dài: **${result.result.length_cm} cm**`,
            `Giá trị: **${formatCoins(result.result.estimated_value)}**`
          ].join("\n"),
          inline: true
        },
        {
          name: locale === "vi" ? "Phần Thưởng" : "Loop",
          value: [
            `Kinh nghiệm: **+${result.result.xp} XP**`,
            `Tiền thưởng: **${formatCoins(result.result.coin_bonus)}**`,
            `Rương: **${result.result.chest ? "Có" : "Không"}**`,
            `Thời gian kéo: **${(result.result.cast_delay_ms / 1000).toFixed(1)}s**`
          ].join("\n"),
          inline: true
        },
        {
          name: locale === "vi" ? "Tiến Độ Bản Đồ" : "Map Progress",
          value: [
            `Loài trong map: **${result.mapProgress.caught_species || 0}/${result.map.fish.length}**`,
            `Tổng cá tại map: **${result.mapProgress.total_caught || 0}**`,
            `Số cá Shiny: **${result.mapProgress.shiny_species || 0}**`,
            `Tổng số loài đã mở: **${result.overallCollection.caught_species || 0}**`
          ].join("\n"),
          inline: false
        },
        {
          name: locale === "vi" ? "Trang Bị & Tài Sản" : "Loadout",
          value: [
            `Cần câu: **${result.loadout.rod?.name || "Cần thủ tập sự"}**`,
            `Độ bền: **${result.loadout.rod?.durability ?? "?"}**`,
            `Mồi: **${result.loadout.bait?.name || "Không dùng"}**`,
            `Số dư: **${formatCoins(result.economy.wallet)}**`
          ].join("\n"),
          inline: false
        }
      )
      .setFooter({
        text: result.result.pet_name
          ? `${result.result.pet_name} đã hỗ trợ bằng kỹ năng ${result.result.pet_ability || "hỗ trợ"} | Pet XP +${result.result.pet_xp || 0}`
          : locale === "vi"
            ? "Mẹo: Thử Nfish info, Nfish collection, Nfish leaderboard để xem thêm thông tin."
            : "Tip: Nfish info, Nfish collection, Nfish leaderboard"
      });

    await castingMessage.edit({ content: null, embeds: [embed] });
  }
};