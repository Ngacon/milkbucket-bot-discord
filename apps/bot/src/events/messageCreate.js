const { parsePrefixedCommand } = require("../handlers/prefixParser");
const { formatDuration } = require("../utils/formatters");
const { createTranslator, normalizeLanguage } = require("../i18n");

const LANGUAGE_CACHE_TTL_MS = 15 * 60 * 1000;
const NETWORK_ERROR_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]);

function getCachedLanguage(context, userId) {
  const cached = context.languageCache?.get(userId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    context.languageCache.delete(userId);
    return null;
  }

  return cached.language;
}

function setCachedLanguage(context, userId, language) {
  if (!context.languageCache) {
    return;
  }

  context.languageCache.set(userId, {
    language,
    expiresAt: Date.now() + LANGUAGE_CACHE_TTL_MS
  });
}

function logCommandError(commandName, error) {
  const message = error?.stack || error?.message || String(error);
  console.error(`[command:${commandName}] ${message}`);
}

function formatCommandError(error, t, language) {
  const locale = String(language || "en").toLowerCase();

  if (NETWORK_ERROR_CODES.has(error?.code)) {
    return locale.startsWith("vi")
      ? "Mang hoac database dang chap chon. Thu lai sau mot chut nhe."
      : "The network or database is wobbling right now. Try again in a moment.";
  }

  if (/relation\s+\"users\"\s+does not exist/i.test(error?.message || "")) {
    return locale.startsWith("vi")
      ? "Database chua khoi tao xong. Kiem tra bootstrap schema roi thu lai."
      : "The database is missing core tables. Check bootstrap and schema setup first.";
  }

  return error?.message || t("system.unknownError");
}

async function getBanRecord(context, discordId) {
  if (!context.repositories?.moderationRepository) {
    return null;
  }

  return context.repositories.moderationRepository.getRecord(discordId);
}

module.exports = {
  name: "messageCreate",
  async execute(client, message) {
    if (message.author.bot) {
      return;
    }

    const context = client.botContext;
    const parsed = parsePrefixedCommand(message.content, context.config.prefix);
    if (!parsed) {
      await context.services.randomEventService.tryAmbientTrigger(message);
      return;
    }

    const fallbackLanguage = normalizeLanguage(context.config.defaultLanguage);
    let language = getCachedLanguage(context, message.author.id) || fallbackLanguage;
    let t = createTranslator(language, fallbackLanguage);
    const command = context.aliasResolver.resolve(parsed.commandName);
    if (!command) {
      return;
    }

    const banRecord = await getBanRecord(context, message.author.id);
    if (banRecord?.is_banned) {
      await message.reply(
        `⛔ ${t("admin.bannedMessage", {
          reason: banRecord.ban_reason || t("admin.noReason", {}, { fallback: "No reason provided." })
        })}`
      );
      return;
    }

    const antiSpam = context.antiSpamManager.register(message.author.id);
    if (antiSpam.blocked) {
      await message.reply(
        `⏱️ ${t("system.antiSpam", {
          time: formatDuration(antiSpam.remainingMs)
        })}`
      );
      return;
    }

    const remainingCooldown = context.cooldownManager.getRemainingMs(
      message.author.id,
      command.name
    );

    if (remainingCooldown > 0) {
      await message.reply(
        `🧊 ${t("system.cooldown", {
          command: `${context.config.prefix}${command.name}`,
          time: formatDuration(remainingCooldown)
        })}`
      );
      return;
    }

    if (command.name === "help") {
      try {
        await command.execute({
          ...context,
          message,
          args: parsed.args,
          commandName: command.name,
          language,
          t
        });
        context.cooldownManager.set(message.author.id, command.name, command.cooldownMs || 0);
      } catch (error) {
        logCommandError(command.name, error);
        await message.reply(`💥 ${formatCommandError(error, t, language)}`);
      }
      return;
    }

    try {
      const user = await context.services.profileService.syncFromMessage(message);
      const state = await context.repositories.playerStateRepository.getState(user.id);
      language = normalizeLanguage(state?.settings?.language, fallbackLanguage);
      t = createTranslator(language, fallbackLanguage);

      await command.execute({
        ...context,
        message,
        args: parsed.args,
        commandName: command.name,
        user,
        language,
        t
      });

      if (command.name === "config") {
        const refreshedState = await context.repositories.playerStateRepository.getState(user.id);
        language = normalizeLanguage(refreshedState?.settings?.language, fallbackLanguage);
      }

      setCachedLanguage(context, message.author.id, language);
      await context.repositories.serverRepository.recordCommandUsage(
        message.guild,
        user.id,
        command.name
      );
      context.cooldownManager.set(message.author.id, command.name, command.cooldownMs || 0);
      await context.services.randomEventService.tryPostCommandTrigger(message);
    } catch (error) {
      logCommandError(command.name, error);
      await message.reply(`💥 ${formatCommandError(error, t, language)}`);
    }
  }
};
