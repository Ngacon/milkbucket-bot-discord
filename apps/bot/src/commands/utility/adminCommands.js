const { createGameEmbed } = require("../../utils/embeds");

function isBotAdmin(context, discordId) {
  return Boolean(context.config.adminUserIds?.has(String(discordId)));
}

function requireBotAdmin(context, t) {
  if (isBotAdmin(context, context.message.author.id)) {
    return;
  }

  throw new Error(
    t("admin.notAuthorized", {}, { fallback: "Only configured bot admins can use this command." })
  );
}

function getLocale(context) {
  return String(context.language || "en").toLowerCase().startsWith("vi") ? "vi" : "en";
}

function getTargetUser(message) {
  return message.mentions.users.first() || null;
}

function formatTimestamp(value, locale) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
}

function buildAdminEmbed(title, context, commandName) {
  return createGameEmbed(title, context.config.embedColor, {
    commandName,
    theme: "admin",
    useThemeColor: true
  });
}

function assertAllowedTarget(context, targetUser, t) {
  if (!targetUser) {
    throw new Error(
      t("admin.targetRequired", {}, { fallback: "Mention a user to target with this admin command." })
    );
  }

  if (targetUser.id === context.message.author.id) {
    throw new Error(
      t("admin.cannotTargetSelf", {}, { fallback: "You cannot target yourself with this admin command." })
    );
  }

  if (isBotAdmin(context, targetUser.id)) {
    throw new Error(
      t("admin.cannotTargetAdmin", {}, { fallback: "You cannot target another configured bot admin." })
    );
  }
}

function formatWarningLog(rows, locale) {
  if (!rows.length) {
    return locale === "vi" ? "Chưa có warning nào." : "No warnings logged yet.";
  }

  return rows
    .map((row, index) => {
      const timestamp = formatTimestamp(row.created_at, locale);
      return `**${index + 1}.** ${row.reason}\n${row.warned_by_username} • ${timestamp}`;
    })
    .join("\n\n");
}

function getBanSubcommand(args) {
  const first = String(args[0] || "").trim().toLowerCase();
  if (["view", "show", "status"].includes(first)) {
    return "view";
  }

  if (["remove", "unban", "off"].includes(first)) {
    return "remove";
  }

  return "add";
}

module.exports = [
  {
    name: "warn",
    aliases: ["warning", "strike"],
    description: "Warn a player in the bot moderation log or inspect their warning history.",
    cooldownMs: 2_000,
    async execute(context) {
      const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
      const locale = getLocale(context);
      requireBotAdmin(context, t);

      const targetUser = getTargetUser(context.message);
      assertAllowedTarget(context, targetUser, t);

      const reason = context.args.slice(1).join(" ").trim();

      if (!reason) {
        const record = await context.repositories.moderationRepository.getRecord(targetUser.id);
        const warnings = await context.repositories.moderationRepository.listWarnings(targetUser.id, 5);

        const embed = buildAdminEmbed(
          t("admin.warn.summaryTitle", {}, { fallback: locale === "vi" ? "Hồ Sơ Warning" : "Warning Record" }),
          context,
          "warn"
        )
          .setDescription(
            t("admin.warn.summaryDescription", {
              user: targetUser.username
            }, {
              fallback:
                locale === "vi"
                  ? `Đây là lịch sử warning hiện tại của **${targetUser.username}**.`
                  : `This is the current warning record for **${targetUser.username}**.`
            })
          )
          .addFields(
            {
              name: t("admin.warn.fields.count", {}, { fallback: locale === "vi" ? "Số Warning" : "Warnings" }),
              value: `${record?.warning_count || 0}`,
              inline: true
            },
            {
              name: t("admin.warn.fields.latestReason", {}, { fallback: locale === "vi" ? "Lý Do Gần Nhất" : "Latest Reason" }),
              value: record?.last_warning_reason || t("admin.noReason", {}, { fallback: locale === "vi" ? "Không có." : "None." }),
              inline: true
            },
            {
              name: t("admin.warn.fields.latestAt", {}, { fallback: locale === "vi" ? "Lần Gần Nhất" : "Latest At" }),
              value: formatTimestamp(record?.last_warned_at, locale),
              inline: true
            },
            {
              name: t("admin.warn.fields.history", {}, { fallback: locale === "vi" ? "5 Warning Gần Nhất" : "Latest 5 Warnings" }),
              value: formatWarningLog(warnings, locale),
              inline: false
            }
          );

        await context.message.reply({ embeds: [embed] });
        return;
      }

      const record = await context.db.withTransaction(async (tx) =>
        context.repositories.moderationRepository.addWarning(
          {
            discordId: targetUser.id,
            username: targetUser.username,
            moderatorDiscordId: context.message.author.id,
            moderatorUsername: context.message.author.username,
            reason
          },
          tx
        )
      );

      const embed = buildAdminEmbed(
        t("admin.warn.title", {}, { fallback: locale === "vi" ? "Đã Warning User" : "Warning Issued" }),
        context,
        "warn"
      )
        .setDescription(
          t("admin.warn.description", {
            user: targetUser.username,
            reason
          }, {
            fallback:
              locale === "vi"
                ? `Đã ghi warning cho **${targetUser.username}**.\nLý do: ${reason}`
                : `Logged a warning for **${targetUser.username}**.\nReason: ${reason}`
          })
        )
        .addFields(
          {
            name: t("admin.warn.fields.count", {}, { fallback: locale === "vi" ? "Số Warning" : "Warnings" }),
            value: `${record.warning_count}`,
            inline: true
          },
          {
            name: t("admin.warn.fields.moderator", {}, { fallback: locale === "vi" ? "Moderator" : "Moderator" }),
            value: context.message.author.username,
            inline: true
          },
          {
            name: t("admin.warn.fields.latestAt", {}, { fallback: locale === "vi" ? "Thời Gian" : "Timestamp" }),
            value: formatTimestamp(record.last_warned_at, locale),
            inline: true
          }
        );

      await context.message.reply({ embeds: [embed] });
    }
  },
  {
    name: "ban",
    aliases: ["botban"],
    description: "Ban, unban, or inspect a player's bot moderation status.",
    cooldownMs: 2_000,
    async execute(context) {
      const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
      const locale = getLocale(context);
      requireBotAdmin(context, t);

      const subcommand = getBanSubcommand(context.args);
      const targetUser = getTargetUser(context.message);
      assertAllowedTarget(context, targetUser, t);

      if (subcommand === "view") {
        const record = await context.repositories.moderationRepository.getRecord(targetUser.id);
        const logs = await context.repositories.moderationRepository.listBanLogs(targetUser.id, 3);

        const embed = buildAdminEmbed(
          t("admin.ban.summaryTitle", {}, { fallback: locale === "vi" ? "Trạng Thái Ban" : "Ban Status" }),
          context,
          "ban"
        )
          .setDescription(
            record?.is_banned
              ? t("admin.ban.summaryDescriptionBanned", {
                  user: targetUser.username
                }, {
                  fallback:
                    locale === "vi"
                      ? `**${targetUser.username}** hiện đang bị cấm dùng bot.`
                      : `**${targetUser.username}** is currently banned from the bot.`
                })
              : t("admin.ban.summaryDescriptionClear", {
                  user: targetUser.username
                }, {
                  fallback:
                    locale === "vi"
                      ? `**${targetUser.username}** hiện không bị cấm.`
                      : `**${targetUser.username}** is not currently banned.`
                })
          )
          .addFields(
            {
              name: t("admin.ban.fields.status", {}, { fallback: locale === "vi" ? "Trạng Thái" : "Status" }),
              value: record?.is_banned
                ? t("admin.ban.statusBanned", {}, { fallback: locale === "vi" ? "Đang Ban" : "Banned" })
                : t("admin.ban.statusClear", {}, { fallback: locale === "vi" ? "Bình Thường" : "Clear" }),
              inline: true
            },
            {
              name: t("admin.ban.fields.reason", {}, { fallback: locale === "vi" ? "Lý Do" : "Reason" }),
              value: record?.ban_reason || t("admin.noReason", {}, { fallback: locale === "vi" ? "Không có." : "None." }),
              inline: true
            },
            {
              name: t("admin.ban.fields.warningCount", {}, { fallback: locale === "vi" ? "Số Warning" : "Warnings" }),
              value: `${record?.warning_count || 0}`,
              inline: true
            },
            {
              name: t("admin.ban.fields.log", {}, { fallback: locale === "vi" ? "3 Log Ban Gần Nhất" : "Latest 3 Ban Logs" }),
              value: logs.length
                ? logs
                    .map(
                      (row, index) =>
                        `**${index + 1}.** ${row.action.toUpperCase()} - ${row.reason || t("admin.noReason", {}, { fallback: locale === "vi" ? "Không có." : "None." })}\n${row.moderated_by_username} • ${formatTimestamp(row.created_at, locale)}`
                    )
                    .join("\n\n")
                : locale === "vi"
                  ? "Chưa có log ban."
                  : "No ban logs yet.",
              inline: false
            }
          );

        await context.message.reply({ embeds: [embed] });
        return;
      }

      const reasonStartIndex = subcommand === "remove" ? 2 : 1;
      const reason = context.args.slice(reasonStartIndex).join(" ").trim() ||
        t("admin.noReason", {}, { fallback: locale === "vi" ? "Không có lý do." : "No reason provided." });

      const currentRecord = await context.repositories.moderationRepository.getRecord(targetUser.id);
      if (subcommand === "remove" && !currentRecord?.is_banned) {
        throw new Error(
          t("admin.ban.notBanned", {}, { fallback: locale === "vi" ? "User này hiện không bị ban." : "That user is not currently banned." })
        );
      }

      if (subcommand === "add" && currentRecord?.is_banned) {
        throw new Error(
          t("admin.ban.alreadyBanned", {}, { fallback: locale === "vi" ? "User này đã bị ban rồi." : "That user is already banned." })
        );
      }

      const record = await context.db.withTransaction(async (tx) =>
        context.repositories.moderationRepository.setBan(
          {
            discordId: targetUser.id,
            username: targetUser.username,
            moderatorDiscordId: context.message.author.id,
            moderatorUsername: context.message.author.username,
            reason,
            banned: subcommand !== "remove"
          },
          tx
        )
      );

      const embed = buildAdminEmbed(
        subcommand === "remove"
          ? t("admin.ban.unbanTitle", {}, { fallback: locale === "vi" ? "Đã Gỡ Ban" : "User Unbanned" })
          : t("admin.ban.title", {}, { fallback: locale === "vi" ? "Đã Ban User" : "User Banned" }),
        context,
        "ban"
      )
        .setDescription(
          subcommand === "remove"
            ? t("admin.ban.unbanDescription", {
                user: targetUser.username,
                reason
              }, {
                fallback:
                  locale === "vi"
                    ? `Đã gỡ ban cho **${targetUser.username}**.\nGhi chú: ${reason}`
                    : `Removed the bot ban from **${targetUser.username}**.\nNote: ${reason}`
              })
            : t("admin.ban.description", {
                user: targetUser.username,
                reason
              }, {
                fallback:
                  locale === "vi"
                    ? `Đã cấm **${targetUser.username}** dùng bot.\nLý do: ${reason}`
                    : `Banned **${targetUser.username}** from using the bot.\nReason: ${reason}`
              })
        )
        .addFields(
          {
            name: t("admin.ban.fields.status", {}, { fallback: locale === "vi" ? "Trạng Thái" : "Status" }),
            value: record.is_banned
              ? t("admin.ban.statusBanned", {}, { fallback: locale === "vi" ? "Đang Ban" : "Banned" })
              : t("admin.ban.statusClear", {}, { fallback: locale === "vi" ? "Bình Thường" : "Clear" }),
            inline: true
          },
          {
            name: t("admin.ban.fields.moderator", {}, { fallback: locale === "vi" ? "Moderator" : "Moderator" }),
            value: context.message.author.username,
            inline: true
          },
          {
            name: t("admin.ban.fields.updatedAt", {}, { fallback: locale === "vi" ? "Thời Gian" : "Timestamp" }),
            value: formatTimestamp(record.updated_at, locale),
            inline: true
          }
        );

      await context.message.reply({ embeds: [embed] });
    }
  },
  {
    name: "cleardata",
    aliases: ["resetdata", "wipedata"],
    description: "Purge a player's bot progression data and force a fresh scaffold next time.",
    cooldownMs: 5_000,
    async execute(context) {
      const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
      const locale = getLocale(context);
      requireBotAdmin(context, t);

      const targetUser = getTargetUser(context.message);
      assertAllowedTarget(context, targetUser, t);

      const confirmed = context.args.some((arg) => String(arg || "").toLowerCase() === "confirm");
      if (!confirmed) {
        throw new Error(
          t("admin.cleardata.confirmRequired", {
            command: `${context.config.prefix}cleardata @user confirm`
          }, {
            fallback:
              locale === "vi"
                ? `Lệnh này phá dữ liệu. Gõ lại theo dạng \`${context.config.prefix}cleardata @user confirm\`.`
                : `This command is destructive. Re-run it as \`${context.config.prefix}cleardata @user confirm\`.`
          })
        );
      }

      const deletedUser = await context.db.withTransaction(async (tx) =>
        context.repositories.userRepository.deleteByDiscordId(targetUser.id, tx)
      );

      context.services.profileService.invalidateUser(targetUser.id, deletedUser?.id);
      context.languageCache?.delete(targetUser.id);

      const embed = buildAdminEmbed(
        t("admin.cleardata.title", {}, { fallback: locale === "vi" ? "Đã Xóa Dữ Liệu User" : "User Data Cleared" }),
        context,
        "cleardata"
      )
        .setDescription(
          deletedUser
            ? t("admin.cleardata.description", {
                user: targetUser.username
              }, {
                fallback:
                  locale === "vi"
                    ? `Đã xóa toàn bộ progression bot của **${targetUser.username}**. Lần dùng lệnh tiếp theo sẽ scaffold lại từ đầu.`
                    : `Deleted all bot progression data for **${targetUser.username}**. Their next command will scaffold a fresh profile.`
              })
            : t("admin.cleardata.noData", {
                user: targetUser.username
              }, {
                fallback:
                  locale === "vi"
                    ? `Không tìm thấy dữ liệu bot nào của **${targetUser.username}** để xóa.`
                    : `No bot progression data was found for **${targetUser.username}**.`
              })
        )
        .addFields(
          {
            name: t("admin.cleardata.fields.discordId", {}, { fallback: "Discord ID" }),
            value: targetUser.id,
            inline: true
          },
          {
            name: t("admin.cleardata.fields.deleted", {}, { fallback: locale === "vi" ? "Đã Xóa" : "Deleted" }),
            value: deletedUser
              ? locale === "vi"
                ? "Có"
                : "Yes"
              : locale === "vi"
                ? "Không"
                : "No",
            inline: true
          },
          {
            name: t("admin.cleardata.fields.moderator", {}, { fallback: locale === "vi" ? "Moderator" : "Moderator" }),
            value: context.message.author.username,
            inline: true
          }
        );

      await context.message.reply({ embeds: [embed] });
    }
  }
];
