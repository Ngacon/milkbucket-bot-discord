const { createGameEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/formatters");
const {
  CATEGORY_DEFINITIONS,
  getCategoryKey,
  getCommandHelp
} = require("../../data/commandHelp");

function isVietnamese(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeHelpQuery(rawQuery, prefix) {
  const query = String(rawQuery || "").trim().toLowerCase();
  const loweredPrefix = String(prefix || "").toLowerCase();
  if (!query) {
    return "";
  }

  return loweredPrefix && query.startsWith(loweredPrefix)
    ? query.slice(loweredPrefix.length).trim()
    : query;
}

function parseHelpRequest(args, prefix) {
  const rawQuery = normalizeHelpQuery((args || []).join(" "), prefix);
  const tokens = rawQuery.split(/\s+/).filter(Boolean);
  return {
    rawQuery,
    commandQuery: tokens[0] || "",
    topicQuery: tokens.slice(1).join(" ")
  };
}

function renderTemplate(value, prefix) {
  return String(value || "").replace(/\{\{p\}\}/g, prefix);
}

function truncateFieldValue(value, maxLength = 1000) {
  const text = String(value || "").trim();
  if (!text) {
    return "-";
  }

  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function getLocalizedText(language, viValue, enValue, fallback = "") {
  return isVietnamese(language)
    ? viValue || enValue || fallback
    : enValue || fallback;
}

function formatCommandList(commandNames, prefix) {
  return commandNames.map((commandName) => `\`${prefix}${commandName}\``).join(", ");
}

function buildSummaryFields(commands, prefix, t) {
  const grouped = new Map();

  for (const command of commands.values()) {
    const categoryKey = getCategoryKey(command.name);
    if (!grouped.has(categoryKey)) {
      grouped.set(categoryKey, []);
    }

    grouped.get(categoryKey).push(command.name);
  }

  return CATEGORY_DEFINITIONS.filter((category) => grouped.has(category.key)).map((category) => ({
    name: t(`categories.${category.key}`),
    value: truncateFieldValue(
      formatCommandList(grouped.get(category.key).sort((a, b) => a.localeCompare(b)), prefix),
      1024
    ),
    inline: false
  }));
}

function findSuggestions(commands, query) {
  const lowered = normalizeKey(query);
  return [...commands.values()]
    .filter(
      (command) =>
        command.name.includes(lowered) ||
        (command.aliases || []).some((alias) => alias.includes(lowered))
    )
    .slice(0, 5)
    .map((command) => command.name);
}

function pickUniqueCommands(commands, count) {
  const pool = [...commands.values()];
  const picked = [];

  while (pool.length && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }

  return picked;
}

function buildDeepHelpField(context) {
  const vi = isVietnamese(context.language);
  const prefix = context.config.prefix;

  return {
    name: vi ? "Đào Sâu Hơn" : "Deep Help",
    value: truncateFieldValue(
      vi
        ? [
            `\`${prefix}help fish info\` -> xem đúng topic info`,
            `\`${prefix}help pet idle\` -> xem nhanh loop idle`,
            `\`${prefix}help auction bid\` -> xem cú pháp bid`,
            `\`${prefix}help config language\` -> xem cách đổi ngôn ngữ`,
            `\`${prefix}help ban remove\` -> xem flow gỡ ban`
          ].join("\n")
        : [
            `\`${prefix}help fish info\` -> inspect a help topic directly`,
            `\`${prefix}help pet idle\` -> jump to the idle loop`,
            `\`${prefix}help auction bid\` -> inspect bid syntax`,
            `\`${prefix}help config language\` -> inspect language setup`,
            `\`${prefix}help ban remove\` -> inspect the unban flow`
          ].join("\n")
    ),
    inline: false
  };
}

function buildLiveOpsField(context) {
  const vi = isVietnamese(context.language);
  const picks = pickUniqueCommands(context.commands, 3)
    .map((command) => `\`${context.config.prefix}${command.name}\``)
    .join(" | ");

  return {
    name: vi ? "Lệnh Ngẫu Nhiên" : "Chaos Picks",
    value: vi
      ? `${picks}\nCụm này dùng để khám phá loop mới khi hết ý tưởng.`
      : `${picks}\nUse these when you want a quick random route.`,
    inline: false
  };
}

function buildHotTipField(context) {
  const vi = isVietnamese(context.language);
  const prefix = context.config.prefix;
  const tips = vi
    ? [
        `Bắt đầu bằng \`${prefix}wallet\`, rồi qua \`${prefix}fish reef\` để làm đầy ví.`,
        `Muốn help chi tiết hơn? Thử \`${prefix}help pet idle\` hoặc \`${prefix}help fish info\`.`,
        `Khi cần coin ổn định, \`${prefix}mine\` và \`${prefix}hunt\` là 2 pin dự phòng rất sạch.`
      ]
    : [
        `Start with \`${prefix}wallet\`, then chain into \`${prefix}fish reef\` for momentum.`,
        `Need deeper docs? Try \`${prefix}help pet idle\` or \`${prefix}help fish info\`.`,
        `If you need stable coin, \`${prefix}mine\` and \`${prefix}hunt\` are clean recovery loops.`
      ];

  return {
    name: vi ? "Mẹo Nhanh" : "Hot Tip",
    value: tips[Math.floor(Math.random() * tips.length)],
    inline: false
  };
}

function resolveTopic(doc, topicQuery) {
  if (!doc?.topics?.length || !topicQuery) {
    return { topic: null, suggestions: [] };
  }

  const normalized = normalizeKey(topicQuery);
  const firstToken = normalized.split(/\s+/)[0] || "";
  const match = doc.topics.find((entry) => {
    const keys = [entry.name, ...(entry.aliases || [])].map(normalizeKey);
    return keys.includes(normalized) || keys.includes(firstToken);
  });

  if (match) {
    return { topic: match, suggestions: [] };
  }

  const suggestions = doc.topics
    .filter((entry) =>
      [entry.name, ...(entry.aliases || [])]
        .map(normalizeKey)
        .some((key) => key.includes(normalized) || normalized.includes(key) || key.includes(firstToken))
    )
    .slice(0, 5)
    .map((entry) => entry.name);

  return { topic: null, suggestions };
}

function renderUsageLines(values, prefix, fallbackValue) {
  const list = (values || []).length ? values : [fallbackValue];
  return truncateFieldValue(list.map((value) => `\`${renderTemplate(value, prefix)}\``).join("\n"));
}

function renderArgumentLines(entries, language) {
  if (!entries?.length) {
    return "";
  }

  const lines = entries
    .map((entry) => {
      const description = getLocalizedText(language, entry.vi, entry.en, "");
      return description ? `- \`${entry.name}\` - ${description}` : `- \`${entry.name}\``;
    })
    .filter(Boolean);

  return lines.length ? truncateFieldValue(lines.join("\n")) : "";
}

function mergeRelatedLinks(primary, secondary) {
  const seen = new Set();
  const result = [];

  for (const link of [...(primary || []), ...(secondary || [])]) {
    if (!link?.usage || seen.has(link.usage)) {
      continue;
    }

    seen.add(link.usage);
    result.push(link);
  }

  return result;
}

function renderRelatedLines(links, prefix, language) {
  if (!links?.length) {
    return "";
  }

  const lines = links
    .map((link) => {
      const description = getLocalizedText(language, link.vi, link.en, "");
      const usage = `\`${renderTemplate(link.usage, prefix)}\``;
      return description ? `- ${usage} - ${description}` : `- ${usage}`;
    })
    .filter(Boolean);

  return lines.length ? truncateFieldValue(lines.join("\n")) : "";
}

function renderTextLines(lines, prefix) {
  if (!lines?.length) {
    return "";
  }

  const rendered = lines
    .map((line) => String(line || "").trim())
    .filter(Boolean)
    .map((line) => `- ${renderTemplate(line, prefix)}`);

  return rendered.length ? truncateFieldValue(rendered.join("\n")) : "";
}

function renderTopicList(topics, language) {
  if (!topics?.length) {
    return "";
  }

  const lines = topics
    .map((entry) => {
      const summary = getLocalizedText(language, entry.summaryVi, entry.summaryEn, "");
      return summary ? `- \`${entry.name}\` - ${summary}` : `- \`${entry.name}\``;
    })
    .filter(Boolean);

  return lines.length ? truncateFieldValue(lines.join("\n")) : "";
}

function buildDetailDescription(command, doc, language, prefix, resolvedTopic) {
  const overview = getLocalizedText(language, doc?.overviewVi, doc?.overviewEn, command.description || "No explanation yet.");
  if (!resolvedTopic) {
    return overview;
  }

  const topicSummary = getLocalizedText(language, resolvedTopic.summaryVi, resolvedTopic.summaryEn, "");
  const topicLead = isVietnamese(language)
    ? `Đang xem topic \`${resolvedTopic.name}\``
    : `Viewing topic \`${resolvedTopic.name}\``;

  return topicSummary ? `${overview}\n\n${topicLead}\n${topicSummary}` : `${overview}\n\n${topicLead}`;
}

function buildTopicNotice(topicQuery, suggestions, doc, prefix, language) {
  if (!topicQuery || !doc?.topics?.length) {
    return "";
  }

  const options = suggestions.length
    ? suggestions.map((name) => `\`${name}\``).join(", ")
    : doc.topics.map((entry) => `\`${entry.name}\``).join(", ");

  return isVietnamese(language)
    ? `Không tìm thấy topic \`${topicQuery}\`. Topic hợp lệ: ${options}.`
    : `No topic found for \`${topicQuery}\`. Available topics: ${options}.`;
}

module.exports = {
  name: "help",
  aliases: ["h", "commands", "cmds"],
  description: "Show command categories or inspect one command in detail.",
  cooldownMs: 2_000,
  async execute(context) {
    const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
    const vi = isVietnamese(context.language);
    const prefix = context.config.prefix;
    const request = parseHelpRequest(context.args, prefix);

    if (request.rawQuery) {
      const command = context.aliasResolver.resolve(request.commandQuery);
      if (!command) {
        const suggestions = findSuggestions(context.commands, request.commandQuery || request.rawQuery);
        const suggestionText = suggestions.length
          ? ` ${t("help.maybeYouMeant", {
              suggestions: suggestions.map((name) => `\`${prefix}${name}\``).join(", ")
            })}`
          : "";
        throw new Error(`${t("help.unknownCommand", { query: request.rawQuery })}${suggestionText}`);
      }

      const doc = getCommandHelp(command.name) || {};
      const topicState = resolveTopic(doc, request.topicQuery);
      const activeTopic = topicState.topic;
      const syntax = activeTopic?.syntax?.length ? activeTopic.syntax : doc.syntax;
      const examples = activeTopic?.examples?.length ? activeTopic.examples : doc.examples;
      const argumentsList = activeTopic?.arguments?.length ? activeTopic.arguments : doc.arguments;
      const tips = vi
        ? [...(activeTopic?.tipsVi || []), ...(doc.tipsVi || [])].slice(0, 6)
        : [...(activeTopic?.tipsEn || []), ...(doc.tipsEn || [])].slice(0, 6);
      const flow = vi
        ? activeTopic?.flowVi?.length
          ? activeTopic.flowVi
          : doc.flowVi
        : activeTopic?.flowEn?.length
          ? activeTopic.flowEn
          : doc.flowEn;
      const related = mergeRelatedLinks(activeTopic?.related, doc.related);
      const topicNotice = !activeTopic
        ? buildTopicNotice(request.topicQuery, topicState.suggestions, doc, prefix, context.language)
        : "";

      const fields = [
        {
          name: t("help.category"),
          value: t(`categories.${getCategoryKey(command.name)}`),
          inline: true
        },
        {
          name: t("help.aliases"),
          value: command.aliases?.length
            ? command.aliases.map((alias) => `\`${prefix}${alias}\``).join(", ")
            : t("help.noAliases"),
          inline: true
        },
        {
          name: t("help.cooldown"),
          value: command.cooldownMs ? formatDuration(command.cooldownMs) : t("help.noCooldown"),
          inline: true
        },
        {
          name: t("help.syntax", {}, { fallback: vi ? "Cú Pháp" : "Syntax" }),
          value: renderUsageLines(syntax, prefix, `${prefix}${command.name}`),
          inline: false
        }
      ];

      if (topicNotice) {
        fields.push({
          name: t("help.topic", {}, { fallback: vi ? "Topic" : "Topic" }),
          value: truncateFieldValue(topicNotice),
          inline: false
        });
      } else if (!activeTopic && doc.topics?.length) {
        fields.push({
          name: t("help.subcommands", {}, { fallback: vi ? "Subcommand / Topic" : "Subcommands / Topics" }),
          value: renderTopicList(doc.topics, context.language),
          inline: false
        });
      }

      const argumentLines = renderArgumentLines(argumentsList, context.language);
      if (argumentLines) {
        fields.push({
          name: t("help.arguments", {}, { fallback: vi ? "Đối Số" : "Arguments" }),
          value: argumentLines,
          inline: false
        });
      }

      fields.push({
        name: t("help.examples"),
        value: renderUsageLines(examples, prefix, `${prefix}${command.name}`),
        inline: false
      });

      const relatedLines = renderRelatedLines(related, prefix, context.language);
      if (relatedLines) {
        fields.push({
          name: t("help.relatedCommands", {}, { fallback: vi ? "Lệnh Liên Kết" : "Related Commands" }),
          value: relatedLines,
          inline: false
        });
      }

      const tipLines = renderTextLines(tips, prefix);
      if (tipLines) {
        fields.push({
          name: t("help.tips", {}, { fallback: vi ? "Lưu Ý" : "Tips" }),
          value: tipLines,
          inline: false
        });
      }

      const flowLines = renderTextLines(flow, prefix);
      if (flowLines) {
        fields.push({
          name: t("help.flow", {}, { fallback: vi ? "Flow Gợi Ý" : "Suggested Flow" }),
          value: flowLines,
          inline: false
        });
      }

      const embed = createGameEmbed(
        t("help.detailTitle", {
          command: `${prefix}${command.name}`
        }),
        context.config.embedColor,
        { commandName: command.name }
      )
        .setDescription(buildDetailDescription(command, doc, context.language, prefix, activeTopic))
        .addFields(fields)
        .setFooter({
          text: vi
            ? `Dùng ${prefix}help để quay lại danh sách. Dùng ${prefix}help <command> <topic> để đào sâu hơn.`
            : `Use ${prefix}help for the full list. Use ${prefix}help <command> <topic> for deeper detail.`
        });

      await context.message.reply({ embeds: [embed] });
      return;
    }

    const embed = createGameEmbed(t("help.title"), context.config.embedColor, {
      commandName: "help"
    })
      .setDescription(
        vi
          ? `Bảng lệnh đã mở.\nDùng \`${prefix}help <command>\` hoặc \`${prefix}help <command> <topic>\` để xem chi tiết.`
          : `Command board unlocked.\nUse \`${prefix}help <command>\` or \`${prefix}help <command> <topic>\` for details.`
      )
      .addFields(
        buildDeepHelpField(context),
        buildLiveOpsField(context),
        buildHotTipField(context),
        ...buildSummaryFields(context.commands, prefix, t)
      )
      .setFooter({
        text: t("help.footerList", {
          count: context.commands.size
        })
      });

    await context.message.reply({ embeds: [embed] });
  }
};
