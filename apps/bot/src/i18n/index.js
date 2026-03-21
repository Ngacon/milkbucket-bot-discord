const SUPPORTED_LANGUAGES = new Set(["en", "vi"]);

const translations = {
  en: {
    languageName: "English",
    system: {
      antiSpam: "Slow down, gremlin. Command access unlocks again in **{{time}}**.",
      cooldown: "**{{command}}** is cooling down for **{{time}}**.",
      unknownError: "A chaotic exception escaped the void."
    },
    help: {
      title: "Milk Bucket Help",
      detailTitle: "Help: {{command}}",
      summaryDescription: "Chaotic command board unlocked.\nUse `{{usage}}` to inspect one command in detail.",
      unknownCommand: "No command found for `{{query}}`.",
      maybeYouMeant: "Maybe you meant {{suggestions}}.",
      category: "Category",
      aliases: "Aliases",
      cooldown: "Cooldown",
      examples: "Examples",
      explanation: "Explanation",
      noAliases: "None",
      noCooldown: "No cooldown",
      footerList: "{{count}} commands loaded. Endless grind mode enabled.",
      footerDetail: "Use {{help}} for the full list or {{helpCommand}} for details."
    },
    categories: {
      core: "Core Commands",
      economy: "Economy",
      work: "Work",
      gambling: "Gambling",
      fishing: "Fishing",
      island: "Island",
      pets: "Pets",
      socialHousing: "Social And Housing",
      crimeMarket: "Crime And Market",
      miniGames: "Mini Games",
      worldRewards: "World And Rewards",
      utility: "Utility",
      other: "Other"
    },
    wallet: {
      title: "{{user}}'s Wallet",
      description: "Chaotic finances, beautifully tracked.",
      cash: "Cash Goblin Pouch",
      bank: "Bank Vault",
      netWorth: "Net Worth",
      level: "Level / Prestige",
      xp: "XP Stored",
      streak: "Streak",
      streakDays: "{{count}} day(s)",
      footer: "Try Ncf heads 250 or Nfish reef for more chaos."
    },
    inventory: {
      title: "Inventory Chaos",
      empty: "Nothing here yet. The backpack is spiritually empty.",
      durability: "Durability",
      equipped: "[equipped]",
      unsoldFish: "Unsold Fish Vault",
      unsoldFishValue: "{{catches}} catches | {{shiny}} shiny-tier | Estimated {{value}}"
    },
    coinflip: {
      invalidChoice: "Pick `heads` or `tails`. The coin refuses third options.",
      title: "Coinflip Mayhem",
      description: "You called **{{choice}}**. The coin landed on **{{outcome}}**.\n{{flavor}}",
      resultWin: "Result",
      resultLose: "Casino Damage",
      winValue: "You won **{{payout}}** total and profited **{{profit}}**.",
      loseValue: "You lost **{{loss}}**. The coin laughed a little.",
      wallet: "Wallet Now",
      bet: "Bet"
    },
    fish: {
      title: "Splash! Something bit.",
      description: "{{rarityEmoji}} **{{species}}** emerged from the **{{biome}}**.\n{{flavor}}",
      catchStats: "Catch Stats",
      chaosExtras: "Chaos Extras",
      loadout: "Loadout Status",
      rarity: "Rarity",
      weight: "Weight",
      length: "Length",
      estimatedValue: "Est. Sell Value",
      xp: "XP",
      coinBonus: "Coin Bonus",
      chest: "Treasure Chest",
      trash: "Trash Incident",
      yes: "Yes",
      no: "No",
      yep: "Yep",
      nope: "Nope",
      rod: "Rod",
      durabilityLeft: "Durability Left",
      unsoldFish: "Unsold Fish",
      fishVaultValue: "Fish Vault Value",
      bossFooter: "Boss fish awakened. Ping the server. Cause drama.",
      jackpotFooter: "Jackpot fish energy detected. The ocean is feeling theatrical.",
      chestFooter: "Bonus salty loot box added to your inventory."
    },
    settings: {
      title: "Settings",
      description: "Your personal live-service toggles.",
      updatedTitle: "Config Updated",
      updatedDescription: "Your personal bot settings have been updated.",
      notifications: "Notifications",
      compactProfile: "Compact Profile",
      theme: "Theme",
      chaosMode: "Chaos Mode",
      language: "Language",
      languageSaved: "Language saved as **{{language}}**.",
      invalidConfig:
        "Config keys: `language vi/en`, `notifications on/off`, `compact on/off`, `theme <name>`, `chaos <mode>`.",
      invalidLanguage: "Supported languages: `en`, `vi`."
    },
    expansion: {
      invalidNumber: "`{{value}}` is not a valid number. The cashier is judging you.",
      invalidCount: "`{{value}}` is not a valid count.",
      inJail: "You are in goblin jail for another **{{time}}**. Try `Njail` or gamble on `Nescape`.",
      wager: {
        bet: "Bet",
        profit: "Profit",
        walletNow: "Wallet Now",
        betAboveZero: "Bet above 0, you beautiful gambler.",
        walletOnlyHave: "You only have {{wallet}} in your wallet."
      },
      work: {
        fields: {
          payout: "Payout",
          xp: "XP",
          loot: "Loot",
          skillLevel: "Skill Level",
          levelProgress: "Level Progress",
          walletNow: "Wallet Now"
        },
        levelValue: "Lv.{{level}}",
        resources: {
          ore: "ore",
          pelts: "pelts",
          crops: "crops",
          meals: "meals",
          packages: "packages"
        },
        footer: {
          bonusKey: "Bonus chest key dropped out of the ceiling.",
          default: "The grind loop remains delicious."
        },
        activities: {
          mine: {
            label: "Mine Rush",
            flavor1: "You bullied a crystal wall until it apologized with shiny ore.",
            flavor2: "A gremlin foreman screamed 'faster' and the cave dropped extra coins.",
            flavor3: "You found a suspiciously glowing rock and absolutely kept it."
          },
          hunt: {
            label: "Hunt Sprint",
            flavor1: "You returned with pelts, stories, and at least one heroic leaf in your hair.",
            flavor2: "A forest critter tried to unionize against you. You still got paid.",
            flavor3: "You tracked footprints through chaos and came back richer."
          },
          farm: {
            label: "Farm Frenzy",
            flavor1: "You watered crops with determination and a tiny bit of panic.",
            flavor2: "The harvest looked illegal. The market loved it anyway.",
            flavor3: "You planted chaos and reaped profit."
          },
          cook: {
            label: "Kitchen Combo",
            flavor1: "Your pan made battle noises, but the food sold out instantly.",
            flavor2: "A flaming saute moment became a premium menu item.",
            flavor3: "You served suspiciously addictive comfort food and got tipped."
          },
          deliver: {
            label: "Delivery Dash",
            flavor1: "You yeeted parcels across the city with elite goblin efficiency.",
            flavor2: "Every box arrived mostly upright, which counts as excellence.",
            flavor3: "Traffic lost. You won. The customers screamed five stars."
          }
        }
      },
      crash: {
        title: "Crash Chart Meltdown",
        descriptionWin: "You hopped out at **{{target}}x** before the graph exploded at **{{crash}}x**.",
        descriptionLose: "You chased **{{target}}x**, but the chart imploded at **{{crash}}x** and stole your lunch money.",
        fields: {
          crashPoint: "Crash Point",
          cashoutTarget: "Cashout Target"
        }
      },
      mines: {
        title: "Mines Board",
        descriptionWin: "You cleared **{{cleared}}** safe tile(s) and moonwalked away before the board could disrespect you.",
        descriptionLose: "Tile **{{tile}}** was a bomb. The board has no empathy.",
        fields: {
          safePicks: "Safe Picks Called",
          outcome: "Outcome"
        },
        outcomePayout: "{{multiplier}}x payout",
        outcomeBoom: "Boom"
      },
      wheel: {
        title: "Fortune Wheel",
        description: "The wheel screamed, sparked, and landed on **{{segment}}**.",
        fields: {
          segment: "Segment",
          multiplier: "Multiplier"
        },
        segments: {
          void: "Void",
          crumbs: "Crumbs",
          even: "Even",
          nice: "Nice",
          juicy: "Juicy",
          absurd: "Absurd"
        }
      },
      plinko: {
        title: "Plinko Chaos",
        description: "The chip pinballed through destiny and face-planted into the **{{multiplier}}x** bucket.",
        fields: {
          bucket: "Bucket"
        }
      },
      baccarat: {
        invalidSide: "Choose `player`, `banker`, or `tie`.",
        title: "Baccarat Table",
        description: "Player rolled **{{playerScore}}**, banker rolled **{{bankerScore}}**. Outcome: **{{outcome}}**.",
        fields: {
          yourPick: "Your Pick",
          payoutRule: "Payout Rule"
        },
        houseAteIt: "House ate it",
        sides: {
          player: "Player",
          banker: "Banker",
          tie: "Tie"
        }
      }
    }
  },
  vi: {
    languageName: "Tiếng Việt",
    system: {
      antiSpam: "Chậm lại nào. Bạn sẽ dùng lệnh lại được sau **{{time}}**.",
      cooldown: "**{{command}}** đang hồi chiêu thêm **{{time}}**.",
      unknownError: "Có một lỗi hỗn loạn vừa thoát ra khỏi hư không."
    },
    help: {
      title: "Bảng Trợ Giúp Milk Bucket",
      detailTitle: "Trợ Giúp: {{command}}",
      summaryDescription: "Bảng lệnh hỗn loạn đã mở.\nDùng `{{usage}}` để xem chi tiết một lệnh.",
      unknownCommand: "Không tìm thấy lệnh `{{query}}`.",
      maybeYouMeant: "Có phải bạn muốn dùng {{suggestions}} không?",
      category: "Nhóm",
      aliases: "Alias",
      cooldown: "Hồi chiêu",
      examples: "Ví Dụ",
      explanation: "Giải Thích",
      noAliases: "Không có",
      noCooldown: "Không có",
      footerList: "Đã nạp {{count}} lệnh. Chế độ cày vô tận đang bật.",
      footerDetail: "Dùng {{help}} để xem toàn bộ hoặc {{helpCommand}} để xem một lệnh cụ thể."
    },
    categories: {
      core: "Lệnh Cơ Bản",
      economy: "Kinh Tế",
      work: "Công Việc",
      gambling: "Cờ Bạc",
      fishing: "Câu Cá",
      island: "Đảo",
      pets: "Thú Cưng",
      socialHousing: "Xã Hội Và Nhà Ở",
      crimeMarket: "Tội Phạm Và Chợ",
      miniGames: "Mini Game",
      worldRewards: "Thế Giới Và Thưởng",
      utility: "Tiện Ích",
      other: "Khác"
    },
    wallet: {
      title: "Ví Của {{user}}",
      description: "Tài chính hỗn loạn nhưng được theo dõi rất gọn.",
      cash: "Tiền Mặt",
      bank: "Ngân Hàng",
      netWorth: "Tổng Tài Sản",
      level: "Cấp / Uy Danh",
      xp: "XP Đang Có",
      streak: "Chuỗi",
      streakDays: "{{count}} ngày",
      footer: "Thử Ncf heads 250 hoặc Nfish reef để kiếm thêm drama."
    },
    inventory: {
      title: "Kho Đồ Hỗn Loạn",
      empty: "Chưa có gì cả. Cái ba lô đang trống rỗng về mặt tâm hồn.",
      durability: "Độ bền",
      equipped: "[đang trang bị]",
      unsoldFish: "Kho Cá Chưa Bán",
      unsoldFishValue: "{{catches}} con | {{shiny}} con hiếm | Ước tính {{value}}"
    },
    coinflip: {
      invalidChoice: "Chọn `heads` hoặc `tails`. Đồng xu không chấp nhận lựa chọn thứ ba.",
      title: "Tung Xu Hỗn Loạn",
      description: "Bạn chọn **{{choice}}**. Đồng xu rơi vào **{{outcome}}**.\n{{flavor}}",
      resultWin: "Kết Quả",
      resultLose: "Thiệt Hại Sòng Bạc",
      winValue: "Bạn thắng tổng cộng **{{payout}}** và lời **{{profit}}**.",
      loseValue: "Bạn thua **{{loss}}**. Đồng xu vừa cười đểu một cái.",
      wallet: "Ví Hiện Tại",
      bet: "Tiền Cược"
    },
    fish: {
      title: "Cắn Câu Rồi!",
      description: "{{rarityEmoji}} **{{species}}** trồi lên từ **{{biome}}**.\n{{flavor}}",
      catchStats: "Thông Tin Cá",
      chaosExtras: "Phần Thưởng Kèm Theo",
      loadout: "Tình Trạng Trang Bị",
      rarity: "Độ hiếm",
      weight: "Cân nặng",
      length: "Chiều dài",
      estimatedValue: "Giá bán ước tính",
      xp: "XP",
      coinBonus: "Coin thưởng",
      chest: "Rương kho báu",
      trash: "Dính rác",
      yes: "Có",
      no: "Không",
      yep: "Có luôn",
      nope: "Không",
      rod: "Cần câu",
      durabilityLeft: "Độ bền còn lại",
      unsoldFish: "Cá chưa bán",
      fishVaultValue: "Giá trị kho cá",
      bossFooter: "Boss cá đã thức tỉnh. Ping cả server đi.",
      jackpotFooter: "Năng lượng jackpot fish đã xuất hiện. Đại dương đang diễn sâu.",
      chestFooter: "Một rương salty loot box đã được thêm vào kho."
    },
    settings: {
      title: "Cài Đặt",
      description: "Các tùy chọn cá nhân của bạn.",
      updatedTitle: "Đã Cập Nhật Cấu Hình",
      updatedDescription: "Cài đặt cá nhân của bạn đã được cập nhật.",
      notifications: "Thông báo",
      compactProfile: "Profile gọn",
      theme: "Giao diện",
      chaosMode: "Mức hỗn loạn",
      language: "Ngôn ngữ",
      languageSaved: "Đã lưu ngôn ngữ thành **{{language}}**.",
      invalidConfig:
        "Các khóa cấu hình: `language vi/en`, `notifications on/off`, `compact on/off`, `theme <name>`, `chaos <mode>`.",
      invalidLanguage: "Ngôn ngữ hỗ trợ: `en`, `vi`."
    },
    expansion: {
      invalidNumber: "`{{value}}` không phải số hợp lệ. Thu ngân đang nhìn bạn rất phán xét.",
      invalidCount: "`{{value}}` không phải số lượng hợp lệ.",
      inJail: "Bạn còn ở tù goblin thêm **{{time}}** nữa. Thử `Njail` hoặc liều với `Nescape`.",
      wager: {
        bet: "Tiền Cược",
        profit: "Lãi/Lỗ",
        walletNow: "Ví Hiện Tại",
        betAboveZero: "Cược lớn hơn 0 đi. Sòng bạc không nhận tiền vô hình.",
        walletOnlyHave: "Ví của bạn chỉ còn {{wallet}}."
      },
      work: {
        fields: {
          payout: "Tiền Thưởng",
          xp: "XP",
          loot: "Thu Hoạch",
          skillLevel: "Cấp Nghề",
          levelProgress: "Tiến Độ Cấp",
          walletNow: "Ví Hiện Tại"
        },
        levelValue: "Lv.{{level}}",
        resources: {
          ore: "quặng",
          pelts: "da thú",
          crops: "nông sản",
          meals: "suất ăn",
          packages: "kiện hàng"
        },
        footer: {
          bonusKey: "Chìa khóa rương bonus vừa rơi từ trần nhà xuống.",
          default: "Vòng lặp cày cuốc vẫn ngon lành."
        },
        activities: {
          mine: {
            label: "Ca Đào Mỏ",
            flavor1: "Bạn đập bức tường pha lê tới lúc nó xin lỗi bằng vài cục quặng sáng choang.",
            flavor2: "Tên quản đốc gremlin gào 'nhanh hơn' và cái hang ném thêm coin cho bạn.",
            flavor3: "Bạn nhặt được một tảng đá phát sáng rất khả nghi và quyết định giữ luôn."
          },
          hunt: {
            label: "Ca Đi Săn",
            flavor1: "Bạn quay về với da thú, chiến tích và ít nhất một chiếc lá anh hùng trên tóc.",
            flavor2: "Một con vật trong rừng định lập công đoàn chống lại bạn. Bạn vẫn lĩnh lương.",
            flavor3: "Bạn lần theo dấu chân giữa hỗn loạn rồi trở về giàu hơn."
          },
          farm: {
            label: "Ca Nông Trại",
            flavor1: "Bạn tưới cây với quyết tâm và một chút hoảng loạn rất nhẹ.",
            flavor2: "Mùa vụ trông hơi bất hợp pháp. Chợ vẫn cực kỳ thích nó.",
            flavor3: "Bạn gieo hỗn loạn và gặt lợi nhuận."
          },
          cook: {
            label: "Ca Nhà Bếp",
            flavor1: "Cái chảo phát ra âm thanh như đang giao chiến, nhưng món ăn bán sạch ngay lập tức.",
            flavor2: "Một pha xào bốc lửa đã trở thành món premium trên menu.",
            flavor3: "Bạn phục vụ món comfort food gây nghiện đáng ngờ và còn được tip."
          },
          deliver: {
            label: "Ca Giao Hàng",
            flavor1: "Bạn phóng kiện hàng khắp thành phố với hiệu suất goblin đỉnh cao.",
            flavor2: "Mọi chiếc hộp đều tới nơi trong trạng thái gần như thẳng đứng, vậy là đủ xuất sắc.",
            flavor3: "Giao thông thua, bạn thắng. Khách hàng hét lên năm sao."
          }
        }
      },
      crash: {
        title: "Biểu Đồ Crash Tan Chảy",
        descriptionWin: "Bạn thoát ở **{{target}}x** trước khi biểu đồ nổ tung tại **{{crash}}x**.",
        descriptionLose: "Bạn đu **{{target}}x**, nhưng biểu đồ sập ở **{{crash}}x** và cuỗm luôn tiền ăn trưa.",
        fields: {
          crashPoint: "Điểm Nổ",
          cashoutTarget: "Mốc Rút"
        }
      },
      mines: {
        title: "Bảng Mìn",
        descriptionWin: "Bạn mở **{{cleared}}** ô an toàn rồi moonwalk rời đi trước khi cái bảng kịp hỗn.",
        descriptionLose: "Ô **{{tile}}** là bom. Cái bảng này không có lòng trắc ẩn.",
        fields: {
          safePicks: "Số Ô Đã Gọi",
          outcome: "Kết Quả"
        },
        outcomePayout: "{{multiplier}}x thưởng",
        outcomeBoom: "Nổ tung"
      },
      wheel: {
        title: "Vòng Quay May Rủi",
        description: "Bánh xe gào lên, tóe lửa và dừng ở **{{segment}}**.",
        fields: {
          segment: "Ô Trúng",
          multiplier: "Hệ Số"
        },
        segments: {
          void: "Trắng Tay",
          crumbs: "Vụn Vặt",
          even: "Hòa Vốn",
          nice: "Ổn Áp",
          juicy: "Ngon",
          absurd: "Phi Lý"
        }
      },
      plinko: {
        title: "Plinko Hỗn Loạn",
        description: "Con chip nảy loạn qua số phận rồi úp mặt vào ô **{{multiplier}}x**.",
        fields: {
          bucket: "Ô Rơi"
        }
      },
      baccarat: {
        invalidSide: "Chọn `player`, `banker` hoặc `tie`.",
        title: "Bàn Baccarat",
        description: "Player ra **{{playerScore}}**, banker ra **{{bankerScore}}**. Kết quả: **{{outcome}}**.",
        fields: {
          yourPick: "Bạn Chọn",
          payoutRule: "Luật Trả Thưởng"
        },
        houseAteIt: "Nhà cái nuốt sạch",
        sides: {
          player: "Player",
          banker: "Banker",
          tie: "Hòa"
        }
      }
    }
  }
};

function getNestedValue(source, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => (value ? value[key] : undefined), source);
}

function interpolate(template, variables = {}) {
  return String(template).replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const normalizedKey = String(key).trim();
    return variables[normalizedKey] ?? "";
  });
}

function normalizeLanguage(rawLanguage, fallback = "en") {
  const lowered = String(rawLanguage || "").trim().toLowerCase();
  if (SUPPORTED_LANGUAGES.has(lowered)) {
    return lowered;
  }

  if (lowered.startsWith("vi")) {
    return "vi";
  }

  if (lowered.startsWith("en")) {
    return "en";
  }

  return SUPPORTED_LANGUAGES.has(fallback) ? fallback : "en";
}

function createTranslator(language, fallbackLanguage = "en") {
  const locale = normalizeLanguage(language, fallbackLanguage);
  const fallback = normalizeLanguage(fallbackLanguage, "en");

  return (key, variables = {}, options = {}) => {
    const value =
      getNestedValue(translations[locale], key) ??
      getNestedValue(translations[fallback], key) ??
      options.fallback ??
      key;

    if (typeof value === "function") {
      return value(variables);
    }

    return interpolate(value, variables);
  };
}

module.exports = {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  createTranslator
};
