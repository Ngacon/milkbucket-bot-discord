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
  { key: "utility", commands: ["config", "settings", "profile", "help"] },
  { key: "admin", commands: ["warn", "ban", "cleardata"] }
];

const COMMAND_TO_CATEGORY = new Map(
  CATEGORY_DEFINITIONS.flatMap((category) =>
    category.commands.map((commandName) => [commandName, category.key])
  )
);

function rel(usage, vi, en = vi) {
  return { usage, vi, en };
}

function arg(name, vi, en = vi) {
  return { name, vi, en };
}

function topic(name, config = {}) {
  return {
    name,
    aliases: [],
    ...config
  };
}

function simpleDoc(name, overviewVi, extra = {}) {
  return {
    overviewVi,
    syntax: [`{{p}}${name}`],
    examples: [`{{p}}${name}`],
    ...extra
  };
}

function workDoc(name, jobLabel) {
  return simpleDoc(name, `Chay job ${jobLabel} de an coin on dinh, XP va loot phu tro.`, {
    related: [
      rel("{{p}}wallet", "Kiem tra coin sau moi vong job."),
      rel("{{p}}invest 500", "Chuyen coin du vao kehoach dau tu."),
      rel("{{p}}lottery 1", "Dot mot phan loi nhuan vao van may.")
    ],
    tipsVi: [
      "Lenh nay hop de farm deu tay, it swing hon nhom co bac.",
      "Neu vi dang mong, uu tien work loop truoc roi moi qua gamble."
    ]
  });
}

const COMMAND_HELP = {
  wallet: simpleDoc("wallet", "Xem wallet, bank, level, XP, prestige va streak cua ban hoac nguoi duoc mention.", {
    syntax: ["{{p}}wallet", "{{p}}wallet @user"],
    examples: ["{{p}}wallet", "{{p}}wallet @user"],
    arguments: [arg("@user", "Mention mot nguoi neu muon xem snapshot kinh te cua ho.")],
    related: [
      rel("{{p}}inventory", "Xem rod, bait, loot va kho ca chua xu ly."),
      rel("{{p}}fish", "Farm coin nhanh neu wallet dang xuong."),
      rel("{{p}}invest 500", "Day coin du vao vung dau tu.")
    ],
    tipsVi: [
      "Neu khong mention ai, bot se tra thong tin cua chinh ban.",
      "Wallet la lenh check nhanh tot nhat truoc va sau khi gamble."
    ]
  }),
  inventory: simpleDoc("inventory", "Xem gear dang co, item overview va tong gia tri ca chua ban.", {
    syntax: ["{{p}}inventory", "{{p}}inv"],
    examples: ["{{p}}inventory", "{{p}}inv"],
    related: [
      rel("{{p}}fish", "Tiep tuc farm ca khi da check rod va bait."),
      rel("{{p}}market", "Xem mat bang giao dich va hang hoa player."),
      rel("{{p}}chest", "Mo ruong neu can them do de nhan vao kho.")
    ],
    tipsVi: [
      "Inventory hien item equip va do ben de ban biet luc nao can doi loop.",
      "Kho ca chua ban trong inventory la dau hieu de tiep tuc fish hoac qua market."
    ]
  }),
  fish: simpleDoc("fish", "Lệnh câu cá chính. Có thể thả cần, xem thông tin map, xem collection và leaderboard.", {
    overviewEn: "Main fishing command. Cast a line, inspect map info, check your collection, or open the leaderboard.",
    syntax: [
      "{{p}}fish [mapKey]",
      "{{p}}fish info [mapKey]",
      "{{p}}fish collection [mapKey]",
      "{{p}}fish leaderboard [mapKey]"
    ],
    examples: [
      "{{p}}fish",
      "{{p}}fish reef",
      "{{p}}fish info volcano",
      "{{p}}fish collection reef",
      "{{p}}fish leaderboard"
    ],
    arguments: [
      arg("mapKey", "Tên map/biome muốn thả cần hoặc muốn xem thông tin. Bỏ trống để dùng map hiện tại.", "The map or biome you want to cast in or inspect. Leave it empty to use the current map.")
    ],
    topics: [
      topic("cast", {
        aliases: ["fish", "default"],
        summaryVi: "Thả cần ở map hiện tại hoặc map được ghi ở đối số đầu tiên.",
        summaryEn: "Cast in the current map or the map specified in the first argument.",
        syntax: ["{{p}}fish [mapKey]"],
        examples: ["{{p}}fish", "{{p}}fish reef", "{{p}}fish volcano"],
        related: [
          rel("{{p}}inventory", "Check rod, bait và loot trước khi spam cast.", "Check your rod, bait, and loot before you start spamming casts."),
          rel("{{p}}travel coral_garden", "Đổi zone nếu muốn mở route khác.", "Travel to another zone if you want a different route."),
          rel("{{p}}aquarium", "Xem cá trưng bày sau khi farm.", "Review your display fish after a farming session.")
        ]
      }),
      topic("info", {
        aliases: ["map", "intel"],
        summaryVi: "Xem fish pool, tiến độ map và loadout ở một map cụ thể.",
        summaryEn: "Inspect the fish pool, map progress, and loadout for a specific map.",
        syntax: ["{{p}}fish info [mapKey]"],
        examples: ["{{p}}fish info", "{{p}}fish info reef"],
        related: [rel("{{p}}travel coral_garden", "Qua zone phù hợp trước khi farm map đó.", "Move to the right zone before grinding that map.")]
      }),
      topic("collection", {
        aliases: ["album"],
        summaryVi: "Xem album đã mở, tổng catch và shiny theo map.",
        summaryEn: "View unlocked album progress, total catches, and shiny progress per map.",
        syntax: ["{{p}}fish collection [mapKey]"],
        examples: ["{{p}}fish collection", "{{p}}fish album reef"],
        related: [rel("{{p}}fish leaderboard", "Soi collection xong thì qua xem rank.", "After checking your collection, jump over to the leaderboard.")]
      }),
      topic("leaderboard", {
        aliases: ["lb", "top"],
        summaryVi: "Xem bảng xếp hạng fish toàn cục hoặc theo map.",
        summaryEn: "Open the global or per-map fishing leaderboard.",
        syntax: ["{{p}}fish leaderboard [mapKey]"],
        examples: ["{{p}}fish leaderboard", "{{p}}fish lb reef"],
        related: [rel("{{p}}fish collection", "Kiểm tra album trước khi leo rank.", "Check your album progress before trying to climb the board.")]
      })
    ],
    related: [
      rel("{{p}}inventory", "Kiểm tra rod, bait và tổng loot để câu tiếp.", "Inspect your rod, bait, and total loot before the next fishing loop."),
      rel("{{p}}travel coral_garden", "Đổi zone để mở route và phần thưởng khác.", "Travel to another zone for a different route and reward profile."),
      rel("{{p}}deepsea", "Chạy loop biển sâu nếu muốn fish hiếm hơn.", "Run the deep-sea loop if you want rarer catches."),
      rel("{{p}}net", "Bắt nhiều cá một lần nếu muốn đổi nhịp farm.", "Catch multiple fish at once if you want a different farming rhythm."),
      rel("{{p}}aquarium", "Xem fish đang trưng bày để release/mutate.", "Inspect your display fish before releasing or mutating them.")
    ],
    tipsVi: [
      "Nếu không gõ subcommand, fish sẽ vào chế độ thả cần ngay.",
      "MapKey trong `fish info`, `collection`, `leaderboard` là tùy chọn."
    ],
    tipsEn: [
      "If you do not pass a subcommand, `fish` immediately drops into cast mode.",
      "The map key in `fish info`, `collection`, and `leaderboard` is optional."
    ],
    flowVi: [
      "{{p}}inventory -> check loadout",
      "{{p}}travel <zone> -> đổi khu",
      "{{p}}fish -> thả cần",
      "{{p}}fish collection -> xem tiến độ map"
    ],
    flowEn: [
      "{{p}}inventory -> check loadout",
      "{{p}}travel <zone> -> move zones",
      "{{p}}fish -> cast",
      "{{p}}fish collection -> review map progress"
    ]
  }),
  coinflip: simpleDoc("coinflip", "Tung dong xu, chon heads hoac tails roi dat cuoc.", {
    syntax: ["{{p}}coinflip <heads|tails> <amount>", "{{p}}cf <heads|tails> <amount>"],
    examples: ["{{p}}coinflip heads 500", "{{p}}cf tails all"],
    arguments: [
      arg("heads|tails", "Mat dong xu ban doan."),
      arg("amount", "So coin cuoc. Thuong dung so cu the, `all` hoac `max`.")
    ],
    related: [
      rel("{{p}}wallet", "Kiem tra loi/lo sau keo flip."),
      rel("{{p}}crash 500 2", "Qua bet dang khac neu muon risk hon."),
      rel("{{p}}wheel 500", "Doi sang game quay neu muon variance hon.")
    ],
    tipsVi: [
      "Khong co lua chon thu ba. Chi heads hoac tails.",
      "Neu vua vua thua, doi qua work/fish mot luc cho nhip on dinh lai."
    ]
  }),

  invest: simpleDoc("invest", "Bo coin vao quy dau tu de an yield khi dung `interest`.", {
    syntax: ["{{p}}invest <amount>"],
    examples: ["{{p}}invest 500", "{{p}}invest all"],
    arguments: [arg("amount", "So coin muon dua vao khoan invested.")],
    related: [
      rel("{{p}}interest", "Rut bank interest va investment yield."),
      rel("{{p}}wallet", "Check coin con lai sau khi bo von."),
      rel("{{p}}house upgrade", "Housing tier cao giup invest ngon hon.")
    ],
    tipsVi: [
      "Invest dung coin trong wallet, khong rut tu bank.",
      "Thu gom coin tu work/fish truoc roi nho tien du vao invest."
    ]
  }),
  loan: simpleDoc("loan", "Vay coin tu bank loop. Nhan coin ngay nhung phai gan debt co lai.", {
    syntax: ["{{p}}loan <amount>"],
    examples: ["{{p}}loan 1000", "{{p}}loan max"],
    arguments: [arg("amount", "So coin muon vay, co the dung `max`.")],
    related: [
      rel("{{p}}repay all", "Tra no ngay khi da co loi nhuan."),
      rel("{{p}}wallet", "Check wallet va debt sau khi vay."),
      rel("{{p}}interest", "Xem debt creep va toc do lai.")
    ],
    tipsVi: [
      "Loan cap tang theo level, housing tier va pet stage.",
      "Vay de xoay von nhanh duoc, nhung de lau se bi lai an nguoc."
    ]
  }),
  repay: simpleDoc("repay", "Tra mot phan hoac tat ca khoan vay dang ton.", {
    syntax: ["{{p}}repay <amount>"],
    examples: ["{{p}}repay 500", "{{p}}repay all"],
    arguments: [arg("amount", "So coin muon tra, co the dung `all`.")],
    related: [
      rel("{{p}}loan", "Muon check no hien tai thi mo loan truoc."),
      rel("{{p}}interest", "Claim lai va xem debt con creep bao nhieu."),
      rel("{{p}}mine", "Can tien de tra no thi quay lai work loop.")
    ],
    tipsVi: [
      "Khong co loan thi repay se bi tu choi.",
      "Neu wallet khong du, bot chi cho phep tra trong gioi han coin dang co."
    ]
  }),
  interest: simpleDoc("interest", "Claim bank interest, investment yield va cap nhat debt creep hien tai.", {
    syntax: ["{{p}}interest"],
    examples: ["{{p}}interest"],
    related: [
      rel("{{p}}invest 1000", "Day them von vao invested."),
      rel("{{p}}repay all", "Tra debt neu loan creep dang len."),
      rel("{{p}}wallet", "So wallet xong thi check tong tai san.")
    ],
    tipsVi: [
      "Interest tinh theo thoi gian troi qua tu lan claim truoc.",
      "Neu dang co debt, `interest` co the lam khoan no tiep tuc phinh ra."
    ]
  }),
  lottery: simpleDoc("lottery", "Mua 1-5 ve so de san coin, jackpot va chest key.", {
    syntax: ["{{p}}lottery [ticketCount]"],
    examples: ["{{p}}lottery", "{{p}}lottery 3"],
    arguments: [arg("ticketCount", "So ve muon mua, toi da 5. Bo trong mac dinh la 1.")],
    related: [
      rel("{{p}}jackpot", "Xem pool hien tai va nguoi trung gan nhat."),
      rel("{{p}}chest", "Dung key nhan duoc de mo ruong."),
      rel("{{p}}wallet", "Check loi/lo sau khi mua ve.")
    ],
    tipsVi: [
      "Moi ve tang jackpot pool va co ti le ra key.",
      "Day la lenh burn coin co variance cao, dung khi wallet du day."
    ]
  }),
  jackpot: simpleDoc("jackpot", "Xem jackpot pool global va thong tin winner gan nhat.", {
    syntax: ["{{p}}jackpot"],
    examples: ["{{p}}jackpot"],
    related: [
      rel("{{p}}lottery 1", "Mua ve ngay neu pool dang thom."),
      rel("{{p}}wallet", "Check xem co du coin de nhay vao khong.")
    ],
    tipsVi: ["Jackpot khong dat cuoc. Day la bang thong tin de canh luc vao lottery."]
  }),

  mine: workDoc("mine", "dao mo"),
  hunt: workDoc("hunt", "san ban"),
  farm: workDoc("farm", "trong trot"),
  cook: workDoc("cook", "nau an"),
  deliver: workDoc("deliver", "giao hang"),
  crash: simpleDoc("crash", "Dat cuoc va chon moc cashout truoc khi do thi no.", {
    syntax: ["{{p}}crash <amount> [cashoutMultiplier]"],
    examples: ["{{p}}crash 500", "{{p}}crash 500 2.5"],
    arguments: [
      arg("amount", "So coin dat cuoc."),
      arg("cashoutMultiplier", "Moc x ma ban muon an toan roi rut. Mac dinh khoang 1.8.")
    ],
    related: [
      rel("{{p}}wallet", "Xem profit/loss sau chart."),
      rel("{{p}}coinflip heads 500", "Doi sang game 50/50 neu muon don gian hon."),
      rel("{{p}}wheel 500", "Thu mot game random khac.")
    ],
    tipsVi: [
      "Multiplier dat cang cao thi kha nang no chart truoc cashout cang dau tim.",
      "Khong co lenh cashout giua tran. Ban chot target ngay tu dau."
    ]
  }),
  mines: simpleDoc("mines", "Goi so o an toan muon mo. Cang goi nhieu thi x payout cang lon, cung cang de no.", {
    syntax: ["{{p}}mines <amount> [safePicks]"],
    examples: ["{{p}}mines 500", "{{p}}mines 500 3"],
    arguments: [
      arg("amount", "So coin dat cuoc."),
      arg("safePicks", "So o an toan ban muon goi. Tu 1 den 4.")
    ],
    related: [
      rel("{{p}}plinko 500", "Doi sang game bucket neu muon variance mem hon."),
      rel("{{p}}wallet", "Check wallet sau bang minefield.")
    ],
    tipsVi: [
      "Neu goi 3-4 safe picks thi board co nhieu bomb hon.",
      "Lenh nay mo phong ket qua tron goi, khong click tung o."
    ]
  }),
  wheel: simpleDoc("wheel", "Quay vong quay multiplier. Co the ve am, hoa von hoac no lon.", {
    syntax: ["{{p}}wheel <amount>"],
    examples: ["{{p}}wheel 500"],
    arguments: [arg("amount", "So coin dat cuoc.")],
    related: [
      rel("{{p}}plinko 500", "Muon thay chip roi bucket thi qua plinko."),
      rel("{{p}}coinflip heads 500", "Muon variance de doan hon thi qua coinflip.")
    ],
    tipsVi: ["Wheel la lenh click-phat-an-ngay. Khong co subcommand phu."]
  }),
  plinko: simpleDoc("plinko", "Tha chip vao bang plinko de an theo multiplier bucket.", {
    syntax: ["{{p}}plinko <amount>"],
    examples: ["{{p}}plinko 500"],
    arguments: [arg("amount", "So coin dat cuoc.")],
    related: [
      rel("{{p}}wheel 500", "Muon board random don gian hon thi qua wheel."),
      rel("{{p}}wallet", "Check xem chip vua nuot hay day vi.")
    ],
    tipsVi: ["Bucket lon co ty le ra thap hon rat nhieu so voi bucket nho."]
  }),
  baccarat: simpleDoc("baccarat", "Chon side player/banker/tie roi dat cuoc.", {
    syntax: ["{{p}}baccarat [player|banker|tie] <amount>"],
    examples: ["{{p}}baccarat banker 500", "{{p}}baccarat player all", "{{p}}baccarat 500"],
    arguments: [
      arg("player|banker|tie", "Side ban chon. Neu bo trong ma go amount truoc, banker se la mac dinh."),
      arg("amount", "So coin dat cuoc.")
    ],
    related: [
      rel("{{p}}coinflip heads 500", "Muon 50/50 nhanh hon thi qua coinflip."),
      rel("{{p}}crash 500 2", "Muon tu chon x risk/reward thi qua crash.")
    ],
    tipsVi: [
      "Tie tra thuong cao hon nhung xac suat ra tie khong deu.",
      "Neu cu phap la `baccarat 500`, bot hieu la dat vao banker."
    ]
  }),

  deepsea: simpleDoc("deepsea", "Chay loop cau bien sau de san fish hiem hon fish thuong.", {
    syntax: ["{{p}}deepsea"],
    examples: ["{{p}}deepsea"],
    related: [
      rel("{{p}}fish info reef", "Soi map fish thuong truoc khi qua bien sau."),
      rel("{{p}}aquarium", "Xem fish vua mang ve co gi dang giu."),
      rel("{{p}}net", "Muon farm nhieu fish mot lan thi qua net.")
    ],
    tipsVi: ["Deepsea la fast loop rieng, khong co subcommand phu."]
  }),
  net: simpleDoc("net", "Tha luoi de bat nhieu fish trong mot lan.", {
    syntax: ["{{p}}net"],
    examples: ["{{p}}net"],
    related: [
      rel("{{p}}fish", "Quay lai cast thuong neu muon map control ro hon."),
      rel("{{p}}inventory", "Check tong fish chua ban sau khi tha luoi.")
    ],
    tipsVi: ["Net hop de farm so luong. Neu muon thong tin map thi dung fish info."]
  }),
  aquarium: simpleDoc("aquarium", "Xem ca dang duoc trung bay trong be.", {
    syntax: ["{{p}}aquarium"],
    examples: ["{{p}}aquarium"],
    related: [
      rel("{{p}}release 1", "Tha mot fish theo slot de doi reward."),
      rel("{{p}}mutate 1", "Dot bien fish trong be de tang gia tri."),
      rel("{{p}}fish", "Farm them fish de day aquarium.")
    ],
    tipsVi: ["Slot trong aquarium la chi so de dung cho `release` va `mutate`."]
  }),
  release: simpleDoc("release", "Tha fish ra khoi aquarium theo slot.", {
    syntax: ["{{p}}release <slot>"],
    examples: ["{{p}}release 1"],
    arguments: [arg("slot", "Vi tri fish trong aquarium.")],
    related: [
      rel("{{p}}aquarium", "Xem slot truoc khi tha."),
      rel("{{p}}mutate 1", "Neu chua muon tha thi co the mutate truoc.")
    ],
    tipsVi: ["Neu khong chac slot nao la slot nao, mo aquarium truoc roi moi release."]
  }),
  mutate: simpleDoc("mutate", "Dot bien fish trong aquarium de tang rarity/value.", {
    syntax: ["{{p}}mutate <slot>"],
    examples: ["{{p}}mutate 1"],
    arguments: [arg("slot", "Vi tri fish trong aquarium.")],
    related: [
      rel("{{p}}aquarium", "Xem danh sach fish dang giu."),
      rel("{{p}}release 1", "Tha fish sau khi mutate xong neu muon doi reward.")
    ],
    tipsVi: ["Mutate lam viec tren fish trong aquarium, khong phai fish ngoai inventory."]
  }),

  island: simpleDoc("island", "Quản lý đảo riêng: mua, nâng cấp, đi thăm, fish, collect và phòng thủ.", {
    overviewEn: "Manage your private island loop: buy it, upgrade it, visit it, fish there, collect, and defend it.",
    syntax: [
      "{{p}}island",
      "{{p}}island buy",
      "{{p}}island upgrade",
      "{{p}}island visit",
      "{{p}}island fish",
      "{{p}}island collect",
      "{{p}}island defend"
    ],
    examples: [
      "{{p}}island",
      "{{p}}island buy",
      "{{p}}island upgrade",
      "{{p}}island collect"
    ],
    topics: [
      topic("view", {
        aliases: ["show", "panel"],
        summaryVi: "Xem tier, stock, defense, shells và visitor của đảo.",
        summaryEn: "Inspect the island's tier, stock, defense, shells, and visitor count."
      }),
      topic("buy", {
        summaryVi: "Mua đảo đầu tiên. Cần wallet đủ coin và chỉ mua một lần.",
        summaryEn: "Buy your first island. You need enough wallet coin and you only do this once.",
        syntax: ["{{p}}island buy"],
        examples: ["{{p}}island buy"]
      }),
      topic("upgrade", {
        summaryVi: "Tăng tier đảo để thêm fish stock, shells và defense.",
        summaryEn: "Raise the island tier to gain more fish stock, shells, and defense.",
        syntax: ["{{p}}island upgrade"],
        examples: ["{{p}}island upgrade"]
      }),
      topic("visit", {
        summaryVi: "Ghé thăm đảo để nhặt thêm shells và tăng lượt visitor.",
        summaryEn: "Visit the island to pick up extra shells and increase visitor count.",
        syntax: ["{{p}}island visit"],
        examples: ["{{p}}island visit"]
      }),
      topic("fish", {
        summaryVi: "Fish tại đầm riêng trên đảo, thêm loot và stock.",
        summaryEn: "Fish in your private island lagoon to build loot and stock.",
        syntax: ["{{p}}island fish"],
        examples: ["{{p}}island fish"]
      }),
      topic("collect", {
        summaryVi: "Rút toàn bộ tài nguyên đảo thành coin.",
        summaryEn: "Cash out the island's stored resources into coin.",
        syntax: ["{{p}}island collect"],
        examples: ["{{p}}island collect"]
      }),
      topic("defend", {
        summaryVi: "Tập phòng thủ để tăng defense và ăn thêm payout.",
        summaryEn: "Run defense drills to raise defense and earn extra payout.",
        syntax: ["{{p}}island defend"],
        examples: ["{{p}}island defend"]
      })
    ],
    related: [
      rel("{{p}}fish", "Farm thêm fish ngoài đảo.", "Farm extra fish outside the island loop."),
      rel("{{p}}wallet", "Check xem đã đủ tiền để buy/upgrade chưa.", "Check whether you have enough coin to buy or upgrade."),
      rel("{{p}}arrest @user", "Defense đảo có thể giúp combat/arrest loop.", "Island defense can indirectly help your combat and arrest loop.")
    ],
    tipsVi: [
      "Nếu chưa mua đảo, chỉ `island buy` mới mở được loop này.",
      "Collect sẽ rút sạch stock và shells về 0, nên cần tiếp tục fish hoặc visit lại."
    ],
    tipsEn: [
      "If you do not own an island yet, `island buy` is the only action that unlocks the loop.",
      "Collecting drains stock and shells back to zero, so you need to rebuild afterward."
    ],
    flowVi: [
      "{{p}}island buy -> mở hệ thống đảo",
      "{{p}}island upgrade -> tăng tier",
      "{{p}}island fish / visit / defend -> build stock",
      "{{p}}island collect -> quy đổi thành coin"
    ],
    flowEn: [
      "{{p}}island buy -> unlock the system",
      "{{p}}island upgrade -> raise the tier",
      "{{p}}island fish / visit / defend -> build stock",
      "{{p}}island collect -> cash out"
    ]
  }),
  pet: simpleDoc("pet", "Hệ pet đầy đủ: roster, equip, buy, feed, play, train, battle, duel, ability, idle và evolve.", {
    overviewEn: "Full pet system: roster management, equip, buy, feed, play, train, battle, duel, ability, idle, and evolve.",
    syntax: [
      "{{p}}pet",
      "{{p}}pet list",
      "{{p}}pet equip <slot>",
      "{{p}}pet buy <species>",
      "{{p}}pet train <balanced|attack|defense|luck>",
      "{{p}}pet idle <fish|work|scavenge|rest|collect>"
    ],
    examples: [
      "{{p}}pet",
      "{{p}}pet list",
      "{{p}}pet buy pup",
      "{{p}}pet equip 2",
      "{{p}}pet train attack",
      "{{p}}pet duel @user",
      "{{p}}pet idle fish",
      "{{p}}pet idle collect",
      "{{p}}pet ability"
    ],
    arguments: [
      arg("slot", "Vị trí pet trong roster, dùng cho equip.", "Pet slot inside your roster, used for equip."),
      arg("species", "Loại pet muốn mua: pup, slime, dragon, fox, axolotl, crow.", "Pet species to buy: pup, slime, dragon, fox, axolotl, or crow."),
      arg("focus", "Hướng train: balanced, attack/atk, defense/def, luck.", "Training focus: balanced, attack/atk, defense/def, or luck."),
      arg("task", "Nhiệm vụ idle: fish, work, scavenge, rest, collect.", "Idle task: fish, work, scavenge, rest, or collect."),
      arg("@user", "Mention đối thủ nếu muốn duel pet.", "Mention the opponent if you want a pet duel.")
    ],
    topics: [
      topic("view", {
        aliases: ["show", "panel"],
        summaryVi: "Xem overview pet active, hunger, joy, XP và passive bonus.",
        summaryEn: "Inspect the active pet overview, hunger, joy, XP, and passive bonus."
      }),
      topic("list", {
        aliases: ["roster"],
        summaryVi: "Xem toàn bộ pet đang có và pet nào đang active.",
        summaryEn: "View your full pet roster and see which one is active.",
        syntax: ["{{p}}pet list"],
        examples: ["{{p}}pet list"]
      }),
      topic("equip", {
        aliases: ["active"],
        summaryVi: "Chọn pet active theo slot hoặc tên.",
        summaryEn: "Set the active pet by slot or name.",
        syntax: ["{{p}}pet equip <slot>"],
        examples: ["{{p}}pet equip 2"]
      }),
      topic("buy", {
        aliases: ["adopt"],
        summaryVi: "Nhận nuôi pet mới nếu stable còn slot và wallet đủ coin.",
        summaryEn: "Adopt a new pet if the stable still has room and your wallet has enough coin.",
        syntax: ["{{p}}pet buy <species>"],
        examples: ["{{p}}pet buy pup", "{{p}}pet buy dragon"]
      }),
      topic("feed", {
        summaryVi: "Cho pet ăn để hồi hunger, energy và ăn thêm pet XP.",
        summaryEn: "Feed your pet to recover hunger, energy, and gain extra pet XP.",
        syntax: ["{{p}}pet feed"],
        examples: ["{{p}}pet feed"]
      }),
      topic("play", {
        summaryVi: "Chơi với pet để ăn mood, coin và XP. Tiêu tốn energy.",
        summaryEn: "Play with your pet to gain mood, coin, and XP while spending energy.",
        syntax: ["{{p}}pet play"],
        examples: ["{{p}}pet play"]
      }),
      topic("train", {
        summaryVi: "Train chỉ số cho pet theo focus mong muốn.",
        summaryEn: "Train your pet stats toward the focus you want.",
        syntax: ["{{p}}pet train <balanced|attack|defense|luck>"],
        examples: ["{{p}}pet train balanced", "{{p}}pet train attack"]
      }),
      topic("battle", {
        aliases: ["fight"],
        summaryVi: "Đánh với NPC để ăn coin, XP và có thể rơi key.",
        summaryEn: "Fight NPCs for coin, XP, and possible key drops.",
        syntax: ["{{p}}pet battle"],
        examples: ["{{p}}pet battle"]
      }),
      topic("duel", {
        summaryVi: "Đấu pet với người khác. Cả hai bên phải có pet active.",
        summaryEn: "Duel another player's pet. Both sides need an active pet.",
        syntax: ["{{p}}pet duel @user"],
        examples: ["{{p}}pet duel @user"]
      }),
      topic("ability", {
        aliases: ["skill"],
        summaryVi: "Xem ability đã mở khóa và equip ability cho pet active.",
        summaryEn: "View unlocked abilities and equip one on your active pet.",
        syntax: ["{{p}}pet ability [abilityName]"],
        examples: ["{{p}}pet ability", "{{p}}pet ability lucky splash"]
      }),
      topic("idle", {
        summaryVi: "Giao pet đi làm việc nền và quay lại collect loot sau.",
        summaryEn: "Assign an idle task to your pet and come back later to collect the haul.",
        syntax: ["{{p}}pet idle <fish|work|scavenge|rest|collect>"],
        examples: ["{{p}}pet idle fish", "{{p}}pet idle rest", "{{p}}pet idle collect"],
        tipsVi: [
          "Dùng `collect` để rút loot đã tích lũy.",
          "Nếu không gõ task, pet idle sẽ hiện preview reward hiện tại."
        ],
        tipsEn: [
          "Use `collect` to claim the loot that has already built up.",
          "If you do not pass a task, `pet idle` shows the current reward preview."
        ]
      }),
      topic("evolve", {
        aliases: ["evo"],
        summaryVi: "Tiến hóa pet khi đủ level, wallet và key.",
        summaryEn: "Evolve your pet once it meets the level, wallet, and key requirements.",
        syntax: ["{{p}}pet evolve"],
        examples: ["{{p}}pet evolve"]
      })
    ],
    related: [
      rel("{{p}}profile", "Xem snapshot tổng quan cả pet, zone, house.", "Inspect the combined snapshot for pet, zone, and house."),
      rel("{{p}}dungeon", "Pet passive hỗ trợ combat loop.", "Pet passives can support your combat loop."),
      rel("{{p}}chest", "Keys có thể dùng cho pet evolve hoặc chest loop.", "Keys can feed directly into evolution or the chest loop."),
      rel("{{p}}wallet", "Cần wallet khỏe để nuôi train pet lâu dài.", "You need a healthy wallet to sustain long-term pet training.")
    ],
    tipsVi: [
      "Rất nhiều action của pet cần pet active, energy và hunger ổn.",
      "Nếu pet quá mệt hoặc quá đói, ưu tiên `feed`, `play` hoặc `idle rest` trước."
    ],
    tipsEn: [
      "Many pet actions require an active pet with usable energy and hunger levels.",
      "If your pet is too tired or too hungry, prioritize `feed`, `play`, or `idle rest` first."
    ],
    flowVi: [
      "{{p}}pet buy <species> -> mở pet đầu tiên",
      "{{p}}pet feed / play -> giữ trạng thái",
      "{{p}}pet train / battle -> tăng sức mạnh",
      "{{p}}pet idle collect -> rút loot nền",
      "{{p}}pet evolve -> nâng cấp form"
    ],
    flowEn: [
      "{{p}}pet buy <species> -> unlock the first pet",
      "{{p}}pet feed / play -> maintain condition",
      "{{p}}pet train / battle -> grow power",
      "{{p}}pet idle collect -> claim passive loot",
      "{{p}}pet evolve -> upgrade the form"
    ]
  }),

  marry: simpleDoc("marry", "Ket hon voi nguoi khac trong bot bang cach mention ho.", {
    syntax: ["{{p}}marry @user"],
    examples: ["{{p}}marry @user"],
    arguments: [arg("@user", "Nguoi ban muon cuoi.")],
    related: [
      rel("{{p}}family", "Xem thong tin cap doi sau khi cuoi."),
      rel("{{p}}gift @user 500", "Tang coin de chat tinh cam.")
    ],
    tipsVi: ["Phai mention nguoi khac, khong tu cuoi chinh minh."]
  }),
  divorce: simpleDoc("divorce", "Cham dut quan he hien tai trong he thong social.", {
    syntax: ["{{p}}divorce"],
    examples: ["{{p}}divorce"],
    related: [rel("{{p}}family", "Xem trang thai social truoc khi quyet."), rel("{{p}}marry @user", "Mo quan he moi sau nay neu can.")]
  }),
  family: simpleDoc("family", "Xem thong tin partner va thong so gia dinh hien tai.", {
    syntax: ["{{p}}family"],
    examples: ["{{p}}family"],
    related: [
      rel("{{p}}marry @user", "Neu chua co partner thi bat dau tu day."),
      rel("{{p}}gift @user 500", "Tang coin cho partner hoac ban be.")
    ]
  }),
  house: simpleDoc("house", "Mua va nang cap nha. Housing comfort anh huong nhieu loop khac.", {
    syntax: ["{{p}}house", "{{p}}house buy <shack|loft|manor>", "{{p}}house upgrade"],
    examples: ["{{p}}house", "{{p}}house buy loft", "{{p}}house upgrade"],
    arguments: [arg("shack|loft|manor", "Kieu nha khi mua lan dau.")],
    topics: [
      topic("view", {
        aliases: ["show", "panel"],
        summaryVi: "Xem style, tier, comfort va decoration hien tai."
      }),
      topic("buy", {
        summaryVi: "Mua nha lan dau. Chon `shack`, `loft` hoac `manor`.",
        syntax: ["{{p}}house buy <shack|loft|manor>"],
        examples: ["{{p}}house buy shack", "{{p}}house buy loft"]
      }),
      topic("upgrade", {
        summaryVi: "Tang tier nha, tang comfort va mo buff tot hon cho cac loop khac.",
        syntax: ["{{p}}house upgrade"],
        examples: ["{{p}}house upgrade"]
      })
    ],
    related: [
      rel("{{p}}decorate neon beanbag", "Them do trang tri de tang comfort."),
      rel("{{p}}profile", "Xem nha dang hien ra sao trong snapshot."),
      rel("{{p}}invest 1000", "Housing tier anh huong den mot so loop kinh te.")
    ],
    tipsVi: [
      "Chi mua nha mot lan. Sau do dung `upgrade` de day tier.",
      "Comfort khong chi de ngau, no di vao nhieu cong thuc khac trong expansion."
    ]
  }),
  decorate: simpleDoc("decorate", "Them mon do trang tri vao nha de tang comfort.", {
    syntax: ["{{p}}decorate <item name>"],
    examples: ["{{p}}decorate neon beanbag", "{{p}}decorate milk lamp"],
    arguments: [arg("item name", "Ten mon trang tri muon them vao nha.")],
    related: [
      rel("{{p}}house", "Xem nha hien tai truoc khi them do."),
      rel("{{p}}house upgrade", "Nang tier nha truoc khi build giao dien song ao.")
    ],
    tipsVi: ["Can phai co nha truoc moi decorate duoc."]
  }),

  bounty: simpleDoc("bounty", "Dat tien truy na len dau nguoi khac, tang bounty va heat cua ho.", {
    syntax: ["{{p}}bounty @user <amount>"],
    examples: ["{{p}}bounty @user 1000"],
    arguments: [
      arg("@user", "Muc tieu bi treo thuong."),
      arg("amount", "So coin dat bounty.")
    ],
    related: [
      rel("{{p}}jail @user", "Check heat va bounty cua muc tieu."),
      rel("{{p}}arrest @user", "San tien truy na neu muc tieu da du nong."),
      rel("{{p}}wallet", "Dam bao wallet con du coin sau khi dat bounty.")
    ],
    tipsVi: ["Khong the dat bounty len chinh minh."]
  }),
  steal: simpleDoc("steal", "Co trom coin tu nguoi khac. Co the fail, tang heat va thang vao jail.", {
    syntax: ["{{p}}steal @user [amount]"],
    examples: ["{{p}}steal @user", "{{p}}steal @user 500"],
    arguments: [
      arg("@user", "Muc tieu ban muon trom."),
      arg("amount", "So coin muon nham den. Bo trong de bot tu chon muc hop ly.")
    ],
    related: [
      rel("{{p}}jail", "Xem ban co dang bi giam hay khong."),
      rel("{{p}}escape", "Neu vao tu roi thi can lenh nay."),
      rel("{{p}}bounty @user 1000", "Dat bounty len nguoi dang gay chuyen.")
    ],
    tipsVi: [
      "Success chance bi anh huong boi level cua ban va comfort nha cua muc tieu.",
      "Fail co the chi tang nghi ngo, nhung cung co the vao jail ngay."
    ]
  }),
  arrest: simpleDoc("arrest", "Bat nguoi dang co heat/bounty de an payout va day ho vao jail.", {
    syntax: ["{{p}}arrest @user"],
    examples: ["{{p}}arrest @user"],
    arguments: [arg("@user", "Muc tieu dang bi truy duoi.")],
    related: [
      rel("{{p}}jail @user", "Kiem tra bounty va heat truoc khi bat."),
      rel("{{p}}bounty @user 1000", "Tang gia tri muc tieu neu can."),
      rel("{{p}}island defend", "Defense dao co the ho tro mot phan combat/arrest.")
    ],
    tipsVi: [
      "Target phai co bounty > 0 hoac heat du cao moi an duoc.",
      "Fail se lam heat cua ban tang them."
    ]
  }),
  jail: simpleDoc("jail", "Xem trang thai jail, heat va bounty cua ban hoac nguoi duoc mention.", {
    syntax: ["{{p}}jail", "{{p}}jail @user"],
    examples: ["{{p}}jail", "{{p}}jail @user"],
    arguments: [arg("@user", "Mention mot nguoi de check trang thai cua ho.")],
    related: [
      rel("{{p}}escape", "Thu vuot nguc neu ban dang bi giam."),
      rel("{{p}}arrest @user", "San nguoi khac neu ho dang co bounty.")
    ]
  }),
  escape: simpleDoc("escape", "Thu vuot nguc neu ban dang bi jail.", {
    syntax: ["{{p}}escape"],
    examples: ["{{p}}escape"],
    related: [
      rel("{{p}}jail", "Xem con bao lau nua moi het han jail."),
      rel("{{p}}house", "Comfort nha cao ho tro ty le thoat."),
      rel("{{p}}pet", "Pet stage cao cung co the giup escape.")
    ],
    tipsVi: ["Khong dang o tu thi lenh nay se bao loi ngay."]
  }),
  market: simpleDoc("market", "Xem active listing va active auction tren player market.", {
    syntax: ["{{p}}market"],
    examples: ["{{p}}market"],
    related: [
      rel("{{p}}sell player <item title> <price>", "Tao listing moi."),
      rel("{{p}}buy player <listingId>", "Mua listing theo ID."),
      rel("{{p}}auction start <item title> <startingBid>", "Mo board dau gia.")
    ],
    tipsVi: ["Market tu dong settle mot phan auction het han moi khi mo bang."]
  }),
  sell: simpleDoc("sell", "Dang ban item/player good len market. Hien tai lenh nay dung category `player`.", {
    syntax: ["{{p}}sell player <item title> <price>"],
    examples: ["{{p}}sell player Glitter Rod Skin 2500", "{{p}}sell player Milk Lamp 900"],
    arguments: [
      arg("player", "Category bat buoc hien tai."),
      arg("item title", "Ten hang hoa se hien tren listing."),
      arg("price", "Gia ban listing.")
    ],
    topics: [
      topic("player", {
        summaryVi: "Category listing duy nhat hien tai. Bot tao mot active listing stock 1.",
        syntax: ["{{p}}sell player <item title> <price>"],
        examples: ["{{p}}sell player Glitter Rod Skin 2500"]
      })
    ],
    related: [
      rel("{{p}}market", "Xem listing cua moi nguoi."),
      rel("{{p}}buy player 3", "Thu vai giao dich chieu nguoc de test market loop."),
      rel("{{p}}auction start House Party Pass 5000", "Neu muon ban theo kieu dau gia.")
    ],
    tipsVi: [
      "Gia phai la so duong.",
      "Ten item la phan o giua `player` va `price`."
    ]
  }),
  buy: simpleDoc("buy", "Mua mot listing tren player market theo ID. Hien tai cung dung category `player`.", {
    syntax: ["{{p}}buy player <listingId>"],
    examples: ["{{p}}buy player 3"],
    arguments: [
      arg("player", "Category bat buoc hien tai."),
      arg("listingId", "So ID cua listing tren market.")
    ],
    topics: [
      topic("player", {
        summaryVi: "Mua listing player theo ID. Khong duoc tu mua listing cua chinh minh.",
        syntax: ["{{p}}buy player <listingId>"],
        examples: ["{{p}}buy player 3"]
      })
    ],
    related: [
      rel("{{p}}market", "Xem danh sach listing va auction dang mo."),
      rel("{{p}}sell player Milk Lamp 900", "Dang nguoc lai de thanh seller."),
      rel("{{p}}wallet", "Check so du truoc khi bam mua.")
    ],
    tipsVi: ["Listing khong con active hoac la listing cua chinh ban thi se mua that bai."]
  }),
  auction: simpleDoc("auction", "Bang dau gia player. Co the xem board, tao auction hoac bid vao auction khac.", {
    syntax: ["{{p}}auction", "{{p}}auction start <item title> <startingBid>", "{{p}}auction bid <auctionId> <amount>"],
    examples: ["{{p}}auction", "{{p}}auction start House Party Pass 5000", "{{p}}auction bid 2 6500"],
    arguments: [
      arg("auctionId", "ID auction dang mo, dung cho `bid`."),
      arg("startingBid", "Gia mo dau khi `start`."),
      arg("amount", "Gia bid moi.")
    ],
    topics: [
      topic("view", {
        aliases: ["show", "board"],
        summaryVi: "Xem active auction va cac auction vua duoc settle."
      }),
      topic("start", {
        aliases: ["create"],
        summaryVi: "Tao mot auction moi, mac dinh keo dai 6 tieng.",
        syntax: ["{{p}}auction start <item title> <startingBid>"],
        examples: ["{{p}}auction start House Party Pass 5000"]
      }),
      topic("bid", {
        summaryVi: "Dat gia vao auction dang mo. Bid moi phai cao hon muc toi thieu.",
        syntax: ["{{p}}auction bid <auctionId> <amount>"],
        examples: ["{{p}}auction bid 2 6500"]
      })
    ],
    related: [
      rel("{{p}}market", "Market overview cung hien auction dang mo."),
      rel("{{p}}sell player Rare Poster 3000", "Neu khong muon dau gia thi dang listing thuong."),
      rel("{{p}}wallet", "Canh wallet truoc khi hold bid.")
    ],
    tipsVi: [
      "Bid moi se giu coin cua ban va hoan coin cho top bidder cu.",
      "Ban khong the bid vao auction cua chinh minh."
    ]
  }),

  quiz: simpleDoc("quiz", "Mini game 2 buoc: go `quiz` de nhan cau hoi, go lai `quiz <answer>` de tra loi.", {
    syntax: ["{{p}}quiz", "{{p}}quiz <answer>"],
    examples: ["{{p}}quiz", "{{p}}quiz reef"],
    arguments: [arg("answer", "Cau tra loi cho quiz dang pending.")],
    related: [
      rel("{{p}}fasttype", "Doi qua mini game go nhanh."),
      rel("{{p}}guess", "Mini game ngau nhien khac cung la 2 buoc.")
    ],
    tipsVi: [
      "Neu chua co quiz pending hoac khong nhap answer, bot se tao quiz moi.",
      "Quiz co han, qua han thi phai mo man moi."
    ]
  }),
  fasttype: simpleDoc("fasttype", "Mini game 2 buoc: nhan phrase roi go lai chinh xac.", {
    syntax: ["{{p}}fasttype", "{{p}}fasttype <phrase>"],
    examples: ["{{p}}fasttype", "{{p}}fasttype milk coins never sleep"],
    arguments: [arg("phrase", "Nhap lai dung nguyen van phrase bot dua.")],
    related: [
      rel("{{p}}quiz", "Mini game kien thuc thay vi go lai."),
      rel("{{p}}guess", "Muon game doan so nhanh gon.")
    ],
    tipsVi: [
      "Neu phrase sai ki tu hoac sai khoang trang, man se tinh la truot.",
      "Fasttype cung co han, de qua lau se het hieu luc."
    ]
  }),
  guess: simpleDoc("guess", "Mini game 2 buoc: mo man doan so, roi doan lai bang `guess <number>`.", {
    syntax: ["{{p}}guess", "{{p}}guess <number>"],
    examples: ["{{p}}guess", "{{p}}guess 7"],
    arguments: [arg("number", "Con so ban doan sau khi mo challenge.")],
    related: [
      rel("{{p}}quiz", "Muon challenge tri nao thay vi so."),
      rel("{{p}}fasttype", "Muon challenge typing.")
    ],
    tipsVi: [
      "Neu chua co challenge pending, `guess` se tao mot so can doan moi.",
      "Pham vi so tang dan theo so lan di travel cua ban."
    ]
  }),
  battle: simpleDoc("battle", "Danh PvE neu khong mention ai. Mention nguoi khac de danh PvP.", {
    syntax: ["{{p}}battle", "{{p}}battle @user"],
    examples: ["{{p}}battle", "{{p}}battle @user"],
    arguments: [arg("@user", "Mention nguoi muon dau PvP. Bo trong de vao PvE.")],
    related: [
      rel("{{p}}pet battle", "Muon battle rieng cho pet."),
      rel("{{p}}travel", "Zone hien tai anh huong mot phan battle/dungeon loop."),
      rel("{{p}}profile view @user", "Soi doi thu truoc khi lao vao PvP.")
    ],
    tipsVi: [
      "PvP dung power tong hop tu level, pet va housing comfort.",
      "Khong mention ai thi lenh se di theo huong PvE."
    ]
  }),

  travel: simpleDoc("travel", "Di chuyen sang zone khac. Khong nhap zone se hien tat ca route va level unlock.", {
    syntax: ["{{p}}travel", "{{p}}travel <zoneKey>"],
    examples: ["{{p}}travel", "{{p}}travel coral_garden"],
    arguments: [arg("zoneKey", "Ma khu vuc muon den, vi du coral_garden.")],
    related: [
      rel("{{p}}map", "Xem zone nao da mo va ban dang dung dau."),
      rel("{{p}}zone", "Xem thong tin zone hien tai."),
      rel("{{p}}dungeon", "Chay dungeon tai zone vua den.")
    ],
    tipsVi: [
      "Moi zone co level unlock va travel fare rieng.",
      "Travel thanh cong cung se cap nhat favorite zone."
    ]
  }),
  map: simpleDoc("map", "Xem world map, current zone va zone nao da mo.", {
    syntax: ["{{p}}map"],
    examples: ["{{p}}map"],
    related: [
      rel("{{p}}travel", "Tu map nhay qua route travel."),
      rel("{{p}}zone", "Xem chi tiet zone hien tai.")
    ]
  }),
  zone: simpleDoc("zone", "Xem danger, reward range va chest chance cua zone hien tai.", {
    syntax: ["{{p}}zone"],
    examples: ["{{p}}zone"],
    related: [
      rel("{{p}}map", "Xem toan bo world route."),
      rel("{{p}}dungeon", "Dung thong so zone de quyet dinh co nen chay dungeon hay khong."),
      rel("{{p}}travel", "Neu zone nay kho qua thi doi khu khac.")
    ]
  }),
  dungeon: simpleDoc("dungeon", "Chay dungeon tai zone hien tai de an coin, XP va co the roi key.", {
    syntax: ["{{p}}dungeon"],
    examples: ["{{p}}dungeon"],
    related: [
      rel("{{p}}zone", "Xem danger va reward range truoc khi vao."),
      rel("{{p}}chest", "Dung key roi duoc tu dungeon de mo ruong."),
      rel("{{p}}pet", "Pet passive co the ho tro combat loop.")
    ],
    tipsVi: [
      "Success chance phu thuoc vao zone danger, level va pet combat bonus.",
      "Fail co the lam mat coin trong wallet."
    ]
  }),
  gift: simpleDoc("gift", "Tang coin cho nguoi khac bang mention va amount.", {
    syntax: ["{{p}}gift @user <amount>"],
    examples: ["{{p}}gift @user 500"],
    arguments: [
      arg("@user", "Nguoi nhan coin."),
      arg("amount", "So coin muon tang.")
    ],
    related: [
      rel("{{p}}wallet", "Check vi truoc khi gui qua."),
      rel("{{p}}family", "Xem thong tin social sau khi tang qua."),
      rel("{{p}}profile view @user", "Soi nguoi nhan truoc khi gui.")
    ],
    tipsVi: ["Khong the tang coin cho chinh minh."]
  }),
  redeem: simpleDoc("redeem", "Nhap promo code de nhan coins, XP hoac keys.", {
    syntax: ["{{p}}redeem <code>"],
    examples: ["{{p}}redeem MILKSTART"],
    arguments: [arg("code", "Ma code can doi qua.")],
    related: [
      rel("{{p}}chest", "Neu code tra key thi qua mo ruong ngay."),
      rel("{{p}}wallet", "Check coin sau khi redeem.")
    ],
    tipsVi: ["Moi code chi redeem duoc mot lan tren moi tai khoan."]
  }),
  chest: simpleDoc("chest", "Mo mot chest key thanh coin, XP va loot box.", {
    syntax: ["{{p}}chest"],
    examples: ["{{p}}chest"],
    related: [
      rel("{{p}}lottery 3", "Lottery co the roi them key."),
      rel("{{p}}dungeon", "Dungeon la mot nguon key khac."),
      rel("{{p}}pet battle", "Pet battle cung co the roi key.")
    ],
    tipsVi: ["Khong co key thi chest se khong mo duoc."]
  }),

  config: simpleDoc("config", "Cài đặt cá nhân của bot: language, notifications, compact profile, theme và chaos mode.", {
    overviewEn: "Manage your personal bot settings: language, notifications, compact profile, theme, and chaos mode.",
    syntax: [
      "{{p}}config",
      "{{p}}config language <en|vi>",
      "{{p}}config notifications <on|off>",
      "{{p}}config compact <on|off>",
      "{{p}}config theme <name>",
      "{{p}}config chaos <mode>"
    ],
    examples: [
      "{{p}}config",
      "{{p}}config language vi",
      "{{p}}config notifications on",
      "{{p}}config compact off",
      "{{p}}config theme neon",
      "{{p}}config chaos turbo"
    ],
    topics: [
      topic("view", {
        aliases: ["help", "show", "xem"],
        summaryVi: "Mở bảng config hiện tại và guide sử dụng.",
        summaryEn: "Open the current config panel and usage guide."
      }),
      topic("language", {
        aliases: ["lang"],
        summaryVi: "Đổi ngôn ngữ bot giữa `en` và `vi`.",
        summaryEn: "Switch the bot language between `en` and `vi`.",
        syntax: ["{{p}}config language <en|vi>"],
        examples: ["{{p}}config language vi"]
      }),
      topic("notifications", {
        aliases: ["noti"],
        summaryVi: "Bật/tắt thông báo cá nhân.",
        summaryEn: "Toggle your personal notifications on or off.",
        syntax: ["{{p}}config notifications <on|off>"],
        examples: ["{{p}}config notifications off"]
      }),
      topic("compact", {
        aliases: ["compactprofile", "compact profile"],
        summaryVi: "Bật/tắt chế độ profile gọn hơn.",
        summaryEn: "Toggle a more compact profile layout.",
        syntax: ["{{p}}config compact <on|off>"],
        examples: ["{{p}}config compact on"]
      }),
      topic("theme", {
        summaryVi: "Đặt theme cho profile theo tên bạn muốn.",
        summaryEn: "Set the profile theme by name.",
        syntax: ["{{p}}config theme <name>"],
        examples: ["{{p}}config theme neon"]
      }),
      topic("chaos", {
        aliases: ["chaosmode", "chaos mode"],
        summaryVi: "Đặt chaos mode cho phong cách profile/UX.",
        summaryEn: "Set the chaos mode used by your profile and UX.",
        syntax: ["{{p}}config chaos <mode>"],
        examples: ["{{p}}config chaos turbo"]
      })
    ],
    related: [
      rel("{{p}}settings", "Xem bản hiển thị đẹp của config hiện tại.", "View the nicely formatted snapshot of your current config."),
      rel("{{p}}profile", "Kiểm tra kết quả config trên profile.", "Check how your settings affect the profile panel."),
      rel("{{p}}help config language", "Đào sâu vào từng nhóm config.", "Jump directly into a specific config topic.")
    ],
    tipsVi: [
      "Gõ `config` không tham số để xem bảng hướng dẫn đầy đủ.",
      "Sau khi đổi language, phản hồi tiếp theo sẽ theo language mới."
    ],
    tipsEn: [
      "Run `config` with no extra args to open the full guide panel.",
      "After changing language, the next reply will use the new locale."
    ]
  }),
  settings: simpleDoc("settings", "Xem bản tóm tắt cài đặt hiện tại của bạn.", {
    overviewEn: "View a summary panel of your current personal settings.",
    syntax: ["{{p}}settings"],
    examples: ["{{p}}settings"],
    related: [
      rel("{{p}}config", "Chỉnh sửa setting chi tiết.", "Edit your settings in detail."),
      rel("{{p}}profile", "Xem một số setting ảnh hưởng profile ra sao.", "Check how some settings affect the profile card.")
    ],
    tipsVi: ["Settings là view-only. Muốn sửa thì dùng `config`."],
    tipsEn: ["`settings` is view-only. Use `config` when you want to change something."]
  }),
  profile: simpleDoc("profile", "Xem snapshot tổng hợp của bạn hoặc người khác: wallet, level, zone, pet, house và social.", {
    overviewEn: "View a full snapshot of yourself or another player: wallet, level, zone, pet, house, and social state.",
    syntax: ["{{p}}profile", "{{p}}profile view @user"],
    examples: ["{{p}}profile", "{{p}}profile view @user"],
    arguments: [arg("@user", "Mention người muốn soi profile.", "Mention the user whose profile you want to inspect.")],
    topics: [
      topic("view", {
        aliases: ["show"],
        summaryVi: "Xem profile của bạn nếu không mention, hoặc của người được mention.",
        summaryEn: "View your own profile by default, or the mentioned user's profile.",
        syntax: ["{{p}}profile", "{{p}}profile view @user"],
        examples: ["{{p}}profile", "{{p}}profile view @user"]
      })
    ],
    related: [
      rel("{{p}}settings", "Check setting cá nhân hiện tại.", "Review your current personal settings."),
      rel("{{p}}wallet", "Đào riêng vào thông số kinh tế.", "Inspect the economy snapshot in more detail."),
      rel("{{p}}pet", "Quản lý chi tiết pet trong profile.", "Manage your pet system in detail.")
    ],
    tipsVi: ["Nếu gõ thêm subcommand khác ngoài `view`, profile sẽ báo cú pháp đúng."],
    tipsEn: ["If you pass a subcommand other than `view`, the bot will return the correct syntax."]
  }),
  warn: simpleDoc("warn", "Ghi warning cho user hoặc xem lịch sử warning hiện tại của họ.", {
    overviewEn: "Log a moderation warning for a user or inspect their existing warning history.",
    syntax: ["{{p}}warn @user", "{{p}}warn @user <reason>"],
    examples: ["{{p}}warn @user", "{{p}}warn @user spam link nhiều lần"],
    arguments: [
      arg("@user", "Mention user cần xem hoặc ghi warning.", "Mention the user you want to inspect or warn."),
      arg("reason", "Lý do warning. Nếu bỏ trống, bot sẽ hiện hồ sơ warning.", "Warning reason. If omitted, the bot shows the warning summary instead.")
    ],
    related: [
      rel("{{p}}ban view @user", "Xem trạng thái ban hiện tại của user.", "Inspect the user's current ban status."),
      rel("{{p}}cleardata @user confirm", "Xóa progression nếu cần reset toàn bộ.", "Clear the user's progression if you need a full reset.")
    ],
    tipsVi: [
      "Lệnh này chỉ dành cho bot admin đã cấu hình trong `BOT_ADMIN_IDS`.",
      "Không nhập reason thì `warn` sẽ hoạt động như lệnh xem hồ sơ warning."
    ],
    tipsEn: [
      "This command only works for bot admins configured in `BOT_ADMIN_IDS`.",
      "If you skip the reason, `warn` acts like a warning-record viewer."
    ]
  }),
  ban: simpleDoc("ban", "Cấm, gỡ cấm hoặc xem trạng thái cấm sử dụng bot của một user.", {
    overviewEn: "Ban, unban, or inspect a player's bot access status.",
    syntax: ["{{p}}ban @user [reason]", "{{p}}ban view @user", "{{p}}ban remove @user [reason]"],
    examples: ["{{p}}ban @user spam bot", "{{p}}ban view @user", "{{p}}ban remove @user đã xử lý xong"],
    arguments: [
      arg("@user", "Mention user cần ban hoặc kiểm tra.", "Mention the user you want to ban or inspect."),
      arg("reason", "Lý do ban hoặc ghi chú khi gỡ ban.", "Ban reason or note attached to the unban action.")
    ],
    topics: [
      topic("view", {
        aliases: ["show", "status"],
        summaryVi: "Xem trạng thái ban, warning count và log ban gần nhất.",
        summaryEn: "Inspect the current ban flag, warning count, and recent ban log entries.",
        syntax: ["{{p}}ban view @user"],
        examples: ["{{p}}ban view @user"]
      }),
      topic("remove", {
        aliases: ["unban", "off"],
        summaryVi: "Gỡ cấm sử dụng bot cho user đã bị ban.",
        summaryEn: "Remove the bot ban from a previously banned user.",
        syntax: ["{{p}}ban remove @user [reason]"],
        examples: ["{{p}}ban remove @user đã xử lý xong"]
      })
    ],
    related: [
      rel("{{p}}warn @user spam", "Ghi warning trước khi escalated lên ban.", "Log a warning before escalating to a ban."),
      rel("{{p}}ban view @user", "Xem log trạng thái trước khi ban hoặc gỡ ban.", "Inspect the current status before banning or unbanning."),
      rel("{{p}}help ban remove", "Xem riêng topic gỡ ban.", "Open the unban topic directly.")
    ],
    tipsVi: [
      "User bị ban sẽ bị chặn ngay tại `messageCreate` trước khi chạy command thường.",
      "Bạn không thể ban chính mình hoặc một bot admin khác."
    ],
    tipsEn: [
      "Banned users are blocked directly in `messageCreate` before normal command execution.",
      "You cannot ban yourself or another configured bot admin."
    ]
  }),
  cleardata: simpleDoc("cleardata", "Xóa toàn bộ progression bot của một user và buộc profile scaffold lại từ đầu.", {
    overviewEn: "Delete all stored bot progression for a user and force a fresh scaffold on their next command.",
    syntax: ["{{p}}cleardata @user confirm"],
    examples: ["{{p}}cleardata @user confirm"],
    arguments: [
      arg("@user", "Mention user cần reset dữ liệu.", "Mention the user whose stored progression should be reset."),
      arg("confirm", "Từ xác nhận bắt buộc để tránh xóa nhầm.", "Required confirmation token to prevent accidental wipes.")
    ],
    related: [
      rel("{{p}}warn @user", "Kiểm tra hồ sơ moderation trước khi xóa data.", "Inspect the moderation record before wiping data."),
      rel("{{p}}ban view @user", "Xem trạng thái ban hiện tại.", "Check the current ban status before clearing data.")
    ],
    tipsVi: [
      "Đây là lệnh phá dữ liệu thật, nên bot yêu cầu thêm từ `confirm`.",
      "Clear data không tự gỡ ban; moderation state được lưu riêng."
    ],
    tipsEn: [
      "This command is destructive, so the bot requires the extra `confirm` token.",
      "Clearing data does not automatically unban the user; moderation state is stored separately."
    ]
  }),
  help: simpleDoc("help", "Mở bảng trợ giúp tổng. Có thể xem theo command hoặc đào sâu vào subcommand/topic.", {
    overviewEn: "Open the global help board. You can inspect a command directly or dive into a specific topic.",
    syntax: ["{{p}}help", "{{p}}help <command>", "{{p}}help <command> <topic>"],
    examples: ["{{p}}help", "{{p}}help fish", "{{p}}help fish info", "{{p}}help pet idle", "{{p}}help config language"],
    arguments: [
      arg("command", "Tên lệnh chính hoặc alias của lệnh đó.", "The canonical command name or one of its aliases."),
      arg("topic", "Subcommand/topic muốn đào sâu hơn, nếu lệnh đó có.", "A deeper subcommand or topic name when the command supports it.")
    ],
    related: [
      rel("{{p}}settings", "Xem setting hiện tại.", "Check your current settings snapshot."),
      rel("{{p}}profile", "Kiểm tra snapshot tổng quan.", "Inspect a broader profile snapshot."),
      rel("{{p}}config language vi", "Đổi ngôn ngữ nếu muốn help dễ đọc hơn.", "Switch language if you want the help output in a different locale.")
    ],
    tipsVi: [
      "Có thể tra bằng alias, ví dụ `help cf` hay `help inv`.",
      "Với lệnh có nhiều nhánh như `pet`, `island`, `auction`, `config`, nên dùng thêm topic."
    ],
    tipsEn: [
      "You can search by alias too, such as `help cf` or `help inv`.",
      "For multi-branch commands like `pet`, `island`, `auction`, or `config`, add a topic for deeper help."
    ]
  })
};

function getCategoryKey(commandName) {
  return COMMAND_TO_CATEGORY.get(commandName) || "other";
}

function getCommandHelp(commandName) {
  return COMMAND_HELP[commandName] || null;
}

module.exports = {
  CATEGORY_DEFINITIONS,
  COMMAND_HELP,
  getCategoryKey,
  getCommandHelp
};
