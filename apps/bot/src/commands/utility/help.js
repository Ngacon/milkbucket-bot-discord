const { createGameEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/formatters");

const CATEGORY_DEFINITIONS = [
  { key: "core", commands: ["wallet", "inventory", "fish", "coinflip"] },
  { key: "economy", commands: ["invest", "loan", "repay", "interest", "lottery", "jackpot"] },
  { key: "work", commands: ["mine", "hunt", "farm", "cook", "deliver"] },
  { key: "gambling", commands: ["crash", "mines", "wheel", "plinko", "baccarat"] },
  { key: "fishing", commands: ["deepsea", "net", "aquarium", "release", "mutate"] },
  { key: "island", commands: ["island"] },
  { key: "pets", commands: ["pet"] },
  { key: "socialHousing", commands: ["marry", "divorce", "family", "house", "decorate"] },
  {
    key: "crimeMarket",
    commands: ["bounty", "steal", "arrest", "jail", "escape", "market", "sell", "buy", "auction"]
  },
  { key: "miniGames", commands: ["quiz", "fasttype", "guess", "battle"] },
  { key: "worldRewards", commands: ["travel", "map", "zone", "dungeon", "gift", "redeem", "chest"] },
  { key: "utility", commands: ["config", "settings", "profile", "help"] }
];

const COMMAND_TO_CATEGORY = new Map(
  CATEGORY_DEFINITIONS.flatMap((category) =>
    category.commands.map((commandName) => [commandName, category.key])
  )
);

const COMMAND_DETAILS = {
  wallet: { examples: ["Nwallet", "Nwallet @user"], noteVi: "Xem ví tiền, bank, level, xp và streak." },
  inventory: { examples: ["Ninventory", "Ninv"], noteVi: "Xem rod, bait, loot và tổng cá chưa bán." },
  fish: { examples: ["Nfish", "Nfish reef", "Nfish volcano"], noteVi: "Câu cá theo biome. Dùng rod và bait đang equip." },
  coinflip: { examples: ["Ncoinflip heads 500", "Ncf tails all"], noteVi: "Tung đồng xu. Chọn heads hoặc tails rồi đặt cược." },
  invest: { examples: ["Ninvest 500", "Ninvest all"], noteVi: "Nhét Milk Coins vào quỹ đầu tư để ăn interest." },
  loan: { examples: ["Nloan 1000", "Nloan max"], noteVi: "Vay tiền từ bank. Vui trước, trả nợ sau." },
  repay: { examples: ["Nrepay 500", "Nrepay all"], noteVi: "Trả bớt hoặc trả hết khoản vay." },
  interest: { examples: ["Ninterest"], noteVi: "Nhận interest từ bank/invest và kiểm tra debt creep." },
  lottery: { examples: ["Nlottery", "Nlottery 3"], noteVi: "Mua vé số để ăn jackpot hoặc key." },
  jackpot: { examples: ["Njackpot"], noteVi: "Xem jackpot pool hiện tại và người trúng gần nhất." },
  mine: { examples: ["Nmine"], noteVi: "Đi đào mỏ lấy coin, xp và ore." },
  hunt: { examples: ["Nhunt"], noteVi: "Đi săn lấy coin, xp và pelts." },
  farm: { examples: ["Nfarm"], noteVi: "Trồng trọt lấy coin, xp và crops." },
  cook: { examples: ["Ncook"], noteVi: "Nấu đồ ăn để lấy coin, xp và meals." },
  deliver: { examples: ["Ndeliver"], noteVi: "Ship hàng lấy coin, xp và packages." },
  crash: { examples: ["Ncrash 500", "Ncrash 500 2.5"], noteVi: "Đặt cược và chọn mức cashout trước khi chart nổ." },
  mines: { examples: ["Nmines 500", "Nmines 500 3"], noteVi: "Đặt cược rồi gọi số ô an toàn muốn mở." },
  wheel: { examples: ["Nwheel 500"], noteVi: "Quay vòng quay ăn hên xui." },
  plinko: { examples: ["Nplinko 500"], noteVi: "Thả chip vào bảng plinko để ăn multiplier." },
  baccarat: { examples: ["Nbaccarat banker 500", "Nbaccarat player all"], noteVi: "Chọn banker/player/tie rồi đặt cược." },
  deepsea: { examples: ["Ndeepsea"], noteVi: "Câu biển sâu để kiếm cá hiếm hơn cá thường." },
  net: { examples: ["Nnet"], noteVi: "Thả lưới bắt nhiều cá một lần." },
  aquarium: { examples: ["Naquarium"], noteVi: "Xem cá đang trưng trong bể." },
  release: { examples: ["Nrelease 1"], noteVi: "Thả cá theo slot trong aquarium để lấy thưởng." },
  mutate: { examples: ["Nmutate 1"], noteVi: "Đột biến cá trong bể để tăng rarity/value." },
  island: { examples: ["Nisland", "Nisland buy", "Nisland collect"], noteVi: "Hệ island gồm buy, upgrade, visit, fish, collect, defend." },
  pet: {
    examples: [
      "Npet",
      "Npet list",
      "Npet buy pup",
      "Npet equip 2",
      "Npet train attack",
      "Npet battle",
      "Npet duel @user",
      "Npet ability",
      "Npet idle fish",
      "Npet idle collect",
      "Npet evolve"
    ],
    noteVi: "Hệ pet 2.0 gồm roster, equip, train, battle, duel, ability, idle, play, feed và evolve."
  },
  marry: { examples: ["Nmarry @user"], noteVi: "Kết hôn với người khác trong bot." },
  divorce: { examples: ["Ndivorce"], noteVi: "Ly hôn nếu không còn chung đường grind." },
  family: { examples: ["Nfamily"], noteVi: "Xem partner, blessing và quà cáp gia đình." },
  house: { examples: ["Nhouse", "Nhouse buy loft", "Nhouse upgrade"], noteVi: "Hệ nhà ở gồm buy, upgrade và buff comfort." },
  decorate: { examples: ["Ndecorate neon beanbag"], noteVi: "Trang trí nhà để tăng comfort." },
  bounty: { examples: ["Nbounty @user 1000"], noteVi: "Đặt tiền truy nã lên đầu người khác." },
  steal: { examples: ["Nsteal @user", "Nsteal @user 500"], noteVi: "Cố trộm tiền từ người khác. Có thể fail và vào tù." },
  arrest: { examples: ["Narrest @user"], noteVi: "Bắt người đang có heat/bounty để nhận thưởng." },
  jail: { examples: ["Njail", "Njail @user"], noteVi: "Xem trạng thái tù, heat và bounty." },
  escape: { examples: ["Nescape"], noteVi: "Thử vượt ngục nếu đang bị jail." },
  market: { examples: ["Nmarket"], noteVi: "Xem listing và auction của player market." },
  sell: { examples: ["Nsell player Glitter Rod Skin 2500"], noteVi: "Đăng bán listing trên player market." },
  buy: { examples: ["Nbuy player 3"], noteVi: "Mua listing theo ID trên market." },
  auction: { examples: ["Nauction", "Nauction start House Party Pass 5000", "Nauction bid 2 6500"], noteVi: "Xem, tạo hoặc bid auction." },
  quiz: { examples: ["Nquiz", "Nquiz reef"], noteVi: "Ra câu hỏi hoặc trả lời câu hỏi đang chờ." },
  fasttype: { examples: ["Nfasttype", "Nfasttype milk coins never sleep"], noteVi: "Ra phrase hoặc gõ lại phrase để ăn thưởng." },
  guess: { examples: ["Nguess", "Nguess 7"], noteVi: "Ra số bí mật hoặc đoán số đang chờ." },
  battle: { examples: ["Nbattle", "Nbattle @user"], noteVi: "Đánh PvE hoặc PvP." },
  travel: { examples: ["Ntravel", "Ntravel coral_garden"], noteVi: "Xem route hoặc di chuyển sang zone khác." },
  map: { examples: ["Nmap"], noteVi: "Xem world map và zone đã mở." },
  zone: { examples: ["Nzone"], noteVi: "Xem thông tin zone hiện tại." },
  dungeon: { examples: ["Ndungeon"], noteVi: "Chạy dungeon trong zone hiện tại." },
  gift: { examples: ["Ngift @user 500"], noteVi: "Tặng coin cho người khác." },
  redeem: { examples: ["Nredeem MILKSTART"], noteVi: "Nhập code để nhận quà." },
  chest: { examples: ["Nchest"], noteVi: "Mở chest nếu có key." },
  config: {
    examples: ["Nconfig", "Nconfig language vi", "Nconfig thongbao bat"],
    noteVi: "Mở bảng config, đổi ngôn ngữ, hoặc chỉnh cài đặt cá nhân của bot."
  },
  settings: { examples: ["Nsettings"], noteVi: "Xem cài đặt hiện tại đã được format đẹp hơn, gồm cả ngôn ngữ." },
  profile: { examples: ["Nprofile", "Nprofile view @user"], noteVi: "Xem profile bản thân hoặc người khác." },
  help: { examples: ["Nhelp", "Nhelp fish", "Nhelp Nfish"], noteVi: "Xem toàn bộ lệnh hoặc đọc giải thích một lệnh cụ thể." }
};

function getCategoryKey(commandName) {
  return COMMAND_TO_CATEGORY.get(commandName) || "other";
}

function normalizeHelpQuery(rawQuery, prefix) {
  const query = String(rawQuery || "").trim().toLowerCase();
  const loweredPrefix = String(prefix || "").toLowerCase();
  if (!query) {
    return "";
  }

  return loweredPrefix && query.startsWith(loweredPrefix)
    ? query.slice(loweredPrefix.length)
    : query;
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
    value: formatCommandList(grouped.get(category.key).sort((a, b) => a.localeCompare(b)), prefix),
    inline: false
  }));
}

function findSuggestions(commands, query) {
  const lowered = String(query || "").toLowerCase();
  return [...commands.values()]
    .filter((command) => command.name.includes(lowered) || (command.aliases || []).some((alias) => alias.includes(lowered)))
    .slice(0, 5)
    .map((command) => command.name);
}

function getExamples(commandName, prefix) {
  const details = COMMAND_DETAILS[commandName];
  if (details?.examples?.length) {
    return details.examples.map((example) => `\`${example.replace(/^N/i, prefix)}\``).join("\n");
  }

  return `\`${prefix}${commandName}\``;
}

function getExplanation(command, language) {
  const details = COMMAND_DETAILS[command.name];
  if (language === "vi" && details?.noteVi) {
    return details.noteVi;
  }

  return command.description || details?.noteVi || "No explanation yet.";
}

function isVietnamese(language) {
  return String(language || "").toLowerCase().startsWith("vi");
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

function buildLiveOpsField(context) {
  const vi = isVietnamese(context.language);
  const picks = pickUniqueCommands(context.commands, 3)
    .map((command) => `\`${context.config.prefix}${command.name}\``)
    .join(" | ");

  return {
    name: vi ? "Sự Kiện Hôm Nay" : "Today's Chaos Picks",
    value: vi
      ? `${picks}\nMay mắn thì trúng lớn, xui thì có thêm nội dung để kể.`
      : `${picks}\nBest case: huge gains. Worst case: better lore for the chat.`,
    inline: false
  };
}

function buildHotTipField(context) {
  const vi = isVietnamese(context.language);
  const tips = vi
    ? [
        `Mở ví nhanh bằng \`${context.config.prefix}wallet\`, rồi quay sang \`${context.config.prefix}fish reef\` để kiếm nhiệt.`,
        `Muốn bot nói tiếng Việt? Thử \`${context.config.prefix}config language vi\`.`,
        `Khi sắp vỡ túi, \`${context.config.prefix}mine\` và \`${context.config.prefix}hunt\` là 2 cục pin ngon.`
      ]
    : [
        `Open with \`${context.config.prefix}wallet\`, then chain into \`${context.config.prefix}fish reef\` for momentum.`,
        `Want the bot in Vietnamese? Run \`${context.config.prefix}config language vi\`.`,
        `If your pockets are suffering, \`${context.config.prefix}mine\` and \`${context.config.prefix}hunt\` are strong recovery loops.`
      ];

  return {
    name: vi ? "Mẹo Nóng" : "Hot Tip",
    value: tips[Math.floor(Math.random() * tips.length)],
    inline: false
  };
}

module.exports = {
  name: "help",
  aliases: ["h", "commands", "cmds"],
  description: "Show command categories or inspect one command in detail.",
  cooldownMs: 2_000,
  async execute(context) {
    const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
    const query = normalizeHelpQuery(context.args[0] || "", context.config.prefix);

    if (query) {
      const command = context.aliasResolver.resolve(query);
      if (!command) {
        const suggestions = findSuggestions(context.commands, query);
        const suggestionText = suggestions.length
          ? ` ${t("help.maybeYouMeant", {
              suggestions: suggestions.map((name) => `\`${context.config.prefix}${name}\``).join(", ")
            })}`
          : "";
        throw new Error(`${t("help.unknownCommand", { query })}${suggestionText}`);
      }

      const embed = createGameEmbed(
        t("help.detailTitle", {
          command: `${context.config.prefix}${command.name}`
        }),
        context.config.embedColor,
        { commandName: command.name }
      )
        .setDescription(getExplanation(command, context.language))
        .addFields(
          {
            name: t("help.category"),
            value: t(`categories.${getCategoryKey(command.name)}`),
            inline: true
          },
          {
            name: t("help.aliases"),
            value: command.aliases?.length
              ? command.aliases.map((alias) => `\`${context.config.prefix}${alias}\``).join(", ")
              : t("help.noAliases"),
            inline: true
          },
          {
            name: t("help.cooldown"),
            value: command.cooldownMs ? formatDuration(command.cooldownMs) : t("help.noCooldown"),
            inline: true
          },
          {
            name: t("help.examples"),
            value: getExamples(command.name, context.config.prefix),
            inline: false
          },
          {
            name: t("help.explanation"),
            value: getExplanation(command, context.language),
            inline: false
          }
        )
        .setFooter({
          text: t("help.footerDetail", {
            help: `${context.config.prefix}help`,
            helpCommand: `${context.config.prefix}help <command>`
          })
        });

      await context.message.reply({ embeds: [embed] });
      return;
    }

    const embed = createGameEmbed(t("help.title"), context.config.embedColor, {
      commandName: "help"
    })
      .setDescription(
        t("help.summaryDescription", {
          usage: `${context.config.prefix}help <command>`
        })
      )
      .addFields(
        buildLiveOpsField(context),
        buildHotTipField(context),
        ...buildSummaryFields(context.commands, context.config.prefix, t)
      )
      .setFooter({
        text: t("help.footerList", {
          count: context.commands.size
        })
      });

    await context.message.reply({ embeds: [embed] });
  }
};
