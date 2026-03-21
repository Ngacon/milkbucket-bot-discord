const { REDEEM_CODES } = require("../../data/liveGameData");
const { ZONES, HOUSE_STYLES, formatCoins } = require("./shared");
const { createTranslator } = require("../../i18n");

const CONFIG_KEY_ALIASES = {
  language: new Set(["language", "lang", "ngonngu", "ngongu"]),
  notifications: new Set(["notifications", "notify", "notif", "thongbao", "tb"]),
  compactProfile: new Set(["compact", "compactprofile", "gon", "rutgon"]),
  theme: new Set(["theme", "giaodien", "gd"]),
  chaosMode: new Set(["chaos", "chaosmode", "honloan", "hl", "mode"])
};

const CONFIG_TRUE_VALUES = new Set(["on", "true", "yes", "enable", "enabled", "bat", "mo", "co"]);
const CONFIG_FALSE_VALUES = new Set([
  "off",
  "false",
  "no",
  "disable",
  "disabled",
  "tat",
  "dong",
  "khong"
]);

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function resolveConfigKey(rawKey) {
  for (const [settingKey, aliases] of Object.entries(CONFIG_KEY_ALIASES)) {
    if (aliases.has(rawKey)) {
      return settingKey;
    }
  }

  return null;
}

function resolveConfigBoolean(rawValue) {
  if (CONFIG_TRUE_VALUES.has(rawValue)) {
    return true;
  }

  if (CONFIG_FALSE_VALUES.has(rawValue)) {
    return false;
  }

  return null;
}

function getConfigCopy(language) {
  if (isVietnameseLanguage(language)) {
    return {
      guideDescription:
        "D\u00f9ng `Nconfig <muc> <gia tri>` \u0111\u1ec3 ch\u1ec9nh bot theo phong c\u00e1ch c\u1ee7a b\u1ea1n. G\u00f5 `Nconfig` kh\u00f4ng tham s\u1ed1 \u0111\u1ec3 m\u1edf b\u1ea3ng n\u00e0y.",
      availableKeys: "M\u1ee5c C\u00f3 Th\u1ec3 Ch\u1ec9nh",
      examples: "V\u00ed D\u1ee5 Nhanh",
      footer:
        "M\u1eb9o: `Nsettings` \u0111\u1ec3 xem c\u1ea5u h\u00ecnh hi\u1ec7n t\u1ea1i. `Nconfig language vi` \u0111\u1ec3 gi\u1eef bot n\u00f3i ti\u1ebfng Vi\u1ec7t.",
      invalidBoolean: "M\u1ee5c n\u00e0y d\u00f9ng `on/off` ho\u1eb7c `bat/tat`.",
      languageOptionEnglish: "Ti\u1ebfng Anh",
      languageOptionVietnamese: "Ti\u1ebfng Vi\u1ec7t",
      enabled: "B\u1eadt",
      disabled: "T\u1eaft",
      keyLanguageInfo: "`language <en|vi>` - \u0111\u1ed5i ng\u00f4n ng\u1eef bot.",
      keyNotificationsInfo: "`notifications <on|off>` - b\u1eadt ho\u1eb7c t\u1eaft th\u00f4ng b\u00e1o.",
      keyCompactInfo: "`compact <on|off>` - b\u1eadt profile g\u1ecdn.",
      keyThemeInfo: "`theme <ten>` - \u0111\u1ed5i giao di\u1ec7n h\u1ed3 s\u01a1, v\u00ed d\u1ee5 `theme ocean`.",
      keyChaosInfo: "`chaos <mode>` - \u0111\u1eb7t m\u1ee9c h\u1ed7n lo\u1ea1n \u01b0a th\u00edch."
    };
  }

  return {
    guideDescription:
      "Use `Nconfig <key> <value>` to tune your personal chaos. Running `Nconfig` with no arguments opens this panel.",
    availableKeys: "Editable Keys",
    examples: "Quick Examples",
    footer:
      "Tip: `Nsettings` shows your current setup. `Nconfig language vi` switches the bot to Vietnamese.",
    invalidBoolean: "Use `on/off` or `bat/tat` for this setting.",
    languageOptionEnglish: "English",
    languageOptionVietnamese: "Vietnamese",
    enabled: "On",
    disabled: "Off",
    keyLanguageInfo: "`language <en|vi>` - switch the bot language.",
    keyNotificationsInfo: "`notifications <on|off>` - toggle alert spam.",
    keyCompactInfo: "`compact <on|off>` - slim down profile output.",
    keyThemeInfo: "`theme <name>` - pick a profile vibe, for example `theme ocean`.",
    keyChaosInfo: "`chaos <mode>` - set your preferred chaos label."
  };
}

function formatConfigValue(settingKey, value, language) {
  const copy = getConfigCopy(language);

  if (settingKey === "language") {
    return value === "vi" ? copy.languageOptionVietnamese : copy.languageOptionEnglish;
  }

  if (settingKey === "notifications" || settingKey === "compactProfile") {
    return value ? copy.enabled : copy.disabled;
  }

  return String(value || "-");
}

function buildConfigOverviewFields(state, context, t, language) {
  const activeLanguage = state.settings.language || context.language || context.config.defaultLanguage;

  return [
    {
      name: t("settings.language"),
      value: formatConfigValue("language", activeLanguage, language),
      inline: true
    },
    {
      name: t("settings.notifications"),
      value: formatConfigValue("notifications", state.settings.notifications, language),
      inline: true
    },
    {
      name: t("settings.compactProfile"),
      value: formatConfigValue("compactProfile", state.settings.compactProfile, language),
      inline: true
    },
    {
      name: t("settings.theme"),
      value: formatConfigValue("theme", state.settings.profileTheme, language),
      inline: true
    },
    {
      name: t("settings.chaosMode"),
      value: formatConfigValue("chaosMode", state.settings.chaosMode, language),
      inline: true
    }
  ];
}

function buildConfigGuideFields(language) {
  const copy = getConfigCopy(language);
  const isVietnamese = isVietnameseLanguage(language);

  return [
    {
      name: copy.availableKeys,
      value: [
        copy.keyLanguageInfo,
        copy.keyNotificationsInfo,
        copy.keyCompactInfo,
        copy.keyThemeInfo,
        copy.keyChaosInfo
      ].join("\n"),
      inline: false
    },
    {
      name: copy.examples,
      value: [
        "`Nconfig language vi`",
        isVietnamese ? "`Nconfig thongbao bat`" : "`Nconfig notifications on`",
        isVietnamese ? "`Nconfig compact tat`" : "`Nconfig compact off`",
        isVietnamese ? "`Nconfig giaodien ocean`" : "`Nconfig theme ocean`",
        isVietnamese ? "`Nconfig honloan turbo`" : "`Nconfig chaos turbo`"
      ].join("\n"),
      inline: false
    }
  ];
}

function buildConfigPanel(state, context, t, language, options = {}) {
  const copy = getConfigCopy(language);

  return {
    title: options.title || t("settings.title"),
    description:
      options.description || (options.showGuide ? copy.guideDescription : t("settings.description")),
    fields: [
      ...buildConfigOverviewFields(state, context, t, language),
      ...(options.showGuide ? buildConfigGuideFields(language) : [])
    ],
    footer: options.footer || copy.footer
  };
}

const worldRewardsUtilityMethods = {
  async handleGuess(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const guess = args[0] ? Number(args[0]) : null;
      const pending = state.systems.minigames.pendingGuess;

      if (!pending || !Number.isFinite(guess)) {
        const max = 10 + Math.min(20, state.systems.world.travelCount);
        const target = this.randomInt(1, max);
        state.systems.minigames.pendingGuess = {
          target,
          max,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        };
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Guess Game",
          description: `Guess a number between **1** and **${max}**.`,
          fields: [
            {
              name: "Submit With",
              value: "`Nguess <number>`",
              inline: false
            }
          ]
        };
      }

      if (new Date(pending.expiresAt).getTime() < Date.now()) {
        state.systems.minigames.pendingGuess = null;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
        throw new Error("That guess challenge expired. Run `Nguess` again.");
      }

      state.systems.minigames.pendingGuess = null;
      if (Number(guess) === Number(pending.target)) {
        const reward = 180 + pending.max * 12;
        await this.economyRepository.mutateWallet(actor.id, reward, "guess_win", tx);
        state.systems.minigames.guessWins += 1;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Guess Correct",
          description: `Bullseye. The hidden number was **${pending.target}**.`,
          fields: [
            {
              name: "Reward",
              value: formatCoins(reward),
              inline: true
            }
          ]
        };
      }

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      return {
        title: "Guess Wrong",
        description: `Nope. The number was **${pending.target}**.`,
        fields: []
      };
    });
  },

  async handleBattle(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);

      if (targetDiscordUser && targetDiscordUser.id !== context.message.author.id) {
        const actor = await this.getActorUser(context, tx);
        const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
        const actorSummary = await this.economyRepository.getSummary(actor.id, tx);
        const targetSummary = await this.economyRepository.getSummary(targetUser.id, tx);
        const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
          forUpdate: true
        });
        const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
        const actorState = stateMap.get(Number(actor.id));
        const targetState = stateMap.get(Number(targetUser.id));

        const actorPower =
          Number(actorSummary.level) * 3 +
          Math.floor(this.getPetBattleRating(actorState) * 0.45) +
          Math.floor(actorState.systems.housing.comfort / 4) +
          this.randomInt(10, 35);
        const targetPower =
          Number(targetSummary.level) * 3 +
          Math.floor(this.getPetBattleRating(targetState) * 0.45) +
          Math.floor(targetState.systems.housing.comfort / 4) +
          this.randomInt(10, 35);
        const actorWon = actorPower >= targetPower;

        if (actorWon) {
          const reward = 280 + this.randomInt(0, 180);
          await this.economyRepository.mutateWallet(actor.id, reward, "battle_win", tx);
          actorState.systems.minigames.battleWins += 1;
          await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);

          return {
            title: "PvP Battle",
            description: `You defeated **${targetDiscordUser.username}** in a loud, unnecessary, glorious showdown.`,
            fields: [
              {
                name: "Power",
                value: `${actorPower} vs ${targetPower}`,
                inline: true
              },
              {
                name: "Reward",
                value: formatCoins(reward),
                inline: true
              }
            ]
          };
        }

        return {
          title: "PvP Battle",
          description: `**${targetDiscordUser.username}** won the clash. You have been respectfully ratioed.`,
          fields: [
            {
              name: "Power",
              value: `${actorPower} vs ${targetPower}`,
              inline: true
            }
          ]
        };
      }

      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const zone = ZONES[state.systems.world.zone];
      const actorPower =
        Number(summary.level) * 3 +
        Math.floor(this.getPetBattleRating(state) * 0.5) +
        Math.floor(state.systems.housing.comfort / 5) +
        this.randomInt(10, 35);
      const enemyPower = zone.danger * 22 + this.randomInt(10, 35);
      const won = actorPower >= enemyPower;

      if (won) {
        const reward = zone.rewardRange[0] + this.randomInt(40, zone.rewardRange[1]);
        await this.economyRepository.mutateWallet(actor.id, reward, "battle_npc_win", tx);
        state.systems.minigames.battleWins += 1;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Arena Battle",
          description: `You flattened a local menace in **${zone.label}** and looted the applause.`,
          fields: [
            {
              name: "Power",
              value: `${actorPower} vs ${enemyPower}`,
              inline: true
            },
            {
              name: "Reward",
              value: formatCoins(reward),
              inline: true
            }
          ]
        };
      }

      return {
        title: "Arena Battle",
        description: `The local menace in **${zone.label}** punched back. Very rude.`,
        fields: [
          {
            name: "Power",
            value: `${actorPower} vs ${enemyPower}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleTravel(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const zoneKey = this.normalizeAnswer(args[0] || "");

      if (!zoneKey) {
        return {
          title: "Travel Routes",
          description: Object.entries(ZONES)
            .map(
              ([key, zone]) =>
                `**${key}** -> ${zone.label} | unlock Lv.${zone.unlockLevel} | fare ${formatCoins(zone.fare)}`
            )
            .join("\n"),
          fields: []
        };
      }

      const zone = ZONES[zoneKey];
      if (!zone) throw new Error(`Unknown zone. Options: ${Object.keys(ZONES).join(", ")}`);
      if (Number(summary.level) < zone.unlockLevel) {
        throw new Error(`You need to be level ${zone.unlockLevel} to reach ${zone.label}.`);
      }
      if (Number(summary.wallet) < zone.fare) throw new Error(`Travel fare is ${formatCoins(zone.fare)}.`);

      if (zone.fare > 0) {
        await this.economyRepository.mutateWallet(actor.id, -zone.fare, "travel_fare", tx);
      }

      if (!state.systems.world.discovered.includes(zoneKey)) {
        state.systems.world.discovered.push(zoneKey);
      }

      state.systems.world.zone = zoneKey;
      state.systems.world.travelCount += 1;
      state.systems.utility.favoriteZone = zoneKey;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Travel Complete",
        description: `You traveled to **${zone.label}**. ${zone.description}`,
        fields: [
          {
            name: "Fare",
            value: formatCoins(zone.fare),
            inline: true
          },
          {
            name: "Danger",
            value: `${zone.danger}/5`,
            inline: true
          },
          {
            name: "Trips",
            value: `${state.systems.world.travelCount}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleMap(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const discovered = new Set(state.systems.world.discovered);

      return {
        title: "World Map",
        description: Object.entries(ZONES)
          .map(([key, zone]) => {
            const marker = key === state.systems.world.zone ? "[YOU]" : discovered.has(key) ? "[OPEN]" : "[FOG]";
            return `${marker} **${zone.label}** (\`${key}\`)`;
          })
          .join("\n"),
        fields: [
          {
            name: "Current Zone",
            value: ZONES[state.systems.world.zone].label,
            inline: true
          }
        ]
      };
    });
  },

  async handleZone(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const zone = ZONES[state.systems.world.zone];

      return {
        title: "Zone Intel",
        description: zone.description,
        fields: [
          {
            name: "Zone",
            value: zone.label,
            inline: true
          },
          {
            name: "Danger",
            value: `${zone.danger}/5`,
            inline: true
          },
          {
            name: "Reward Range",
            value: `${formatCoins(zone.rewardRange[0])} - ${formatCoins(zone.rewardRange[1])}`,
            inline: true
          },
          {
            name: "Chest Chance",
            value: this.formatPercent(zone.chestChance),
            inline: true
          }
        ]
      };
    });
  },

  async handleDungeon(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      this.assertNotJailed(state);
      const zone = ZONES[state.systems.world.zone];
      const successChance = this.clamp(
        0.7 - zone.danger * 0.08 + Number(summary.level) * 0.02 + this.getPetPassiveBonus(state, "combat"),
        0.2,
        0.92
      );
      const success = this.roll(successChance);

      if (success) {
        const reward = this.randomInt(zone.rewardRange[0], zone.rewardRange[1]) + zone.danger * 70;
        const xp = 90 + zone.danger * 35;
        const keyDrop = this.roll(zone.chestChance) ? 1 : 0;
        await this.economyRepository.mutateWallet(actor.id, reward, "dungeon_clear", tx);
        await this.userRepository.addXp(actor.id, xp, tx);

        state.systems.world.dungeonClears += 1;
        state.systems.rewards.keys += keyDrop;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Dungeon Clear",
          description: `You cleared a dungeon in **${zone.label}** and emerged with pockets full of nonsense.`,
          fields: [
            {
              name: "Reward",
              value: formatCoins(reward),
              inline: true
            },
            {
              name: "XP",
              value: `+${xp}`,
              inline: true
            },
            {
              name: "Key Drop",
              value: keyDrop ? "1 key found" : "No key this run",
              inline: true
            }
          ]
        };
      }

      const loss = Math.min(Number(summary.wallet), this.randomInt(80, 180) + zone.danger * 40);
      if (loss > 0) {
        await this.economyRepository.mutateWallet(actor.id, -loss, "dungeon_fail", tx);
      }

      return {
        title: "Dungeon Wipe",
        description: `You got bounced out of the dungeon in **${zone.label}**. The walls won this round.`,
        fields: [
          {
            name: "Loss",
            value: formatCoins(loss),
            inline: true
          },
          {
            name: "Success Chance",
            value: this.formatPercent(successChance),
            inline: true
          }
        ]
      };
    });
  },

  async handleGift(context) {
    return this.db.withTransaction(async (tx) => {
      const targetDiscordUser = this.getMentionedUser(context.message);
      if (!targetDiscordUser) throw new Error("Tag someone to gift.");
      if (targetDiscordUser.id === context.message.author.id) {
        throw new Error("Gift someone else. Self-gifting is just inventory cosplay.");
      }

      const actor = await this.getActorUser(context, tx);
      const targetUser = await this.profileService.resolveByDiscordUser(targetDiscordUser, tx);
      const actorSummary = await this.economyRepository.getSummary(actor.id, tx);
      const states = await this.playerStateRepository.getStates([actor.id, targetUser.id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const actorState = stateMap.get(Number(actor.id));
      const targetState = stateMap.get(Number(targetUser.id));
      const args = this.cleanArgs(context.args);
      const amount = this.parseAmount(args[1], 200, Number(actorSummary.wallet));

      if (amount <= 0) throw new Error("Gift at least 1 coin.");
      if (Number(actorSummary.wallet) < amount) throw new Error(`You need ${formatCoins(amount)} in your wallet.`);

      await this.economyRepository.mutateWallet(actor.id, -amount, "gift_sent", tx);
      await this.economyRepository.mutateWallet(targetUser.id, amount, "gift_received", tx);
      actorState.systems.social.giftsSent += 1;
      targetState.systems.social.giftsReceived += 1;
      actorState.systems.rewards.giftedCoins += amount;

      await this.playerStateRepository.saveState(actor.id, actorState.systems, actorState.settings, tx);
      await this.playerStateRepository.saveState(targetUser.id, targetState.systems, targetState.settings, tx);

      return {
        title: "Gift Sent",
        description: `You sent ${formatCoins(amount)} to **${targetDiscordUser.username}**.`,
        fields: [
          {
            name: "Gifts Sent",
            value: `${actorState.systems.social.giftsSent}`,
            inline: true
          },
          {
            name: "Lifetime Gifted",
            value: formatCoins(actorState.systems.rewards.giftedCoins),
            inline: true
          }
        ]
      };
    });
  },

  async handleRedeem(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const code = String(args[0] || "").toUpperCase();
      const reward = REDEEM_CODES[code];

      if (!reward) throw new Error("Unknown redeem code.");
      if (state.systems.rewards.redeemedCodes.includes(code)) throw new Error("You already redeemed that code.");

      state.systems.rewards.redeemedCodes.push(code);
      state.systems.rewards.keys += reward.keys || 0;
      await this.economyRepository.mutateWallet(actor.id, reward.coins || 0, "redeem_code", tx);
      if (reward.xp) {
        await this.userRepository.addXp(actor.id, reward.xp, tx);
      }

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Code Redeemed",
        description: `Redeemed **${code}**. ${reward.description}`,
        fields: [
          {
            name: "Coins",
            value: formatCoins(reward.coins || 0),
            inline: true
          },
          {
            name: "XP",
            value: `${reward.xp || 0}`,
            inline: true
          },
          {
            name: "Keys",
            value: `${reward.keys || 0}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleChest(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      if (state.systems.rewards.keys <= 0) {
        throw new Error("You have no chest keys. Farm some with lottery, dungeon, or work luck.");
      }

      state.systems.rewards.keys -= 1;
      state.systems.rewards.chestsOpened += 1;

      const coinReward = this.randomInt(250, 850);
      const xpReward = this.randomInt(40, 120);
      const crateKey = this.roll(0.5) ? "lootbox_salty" : "lootbox_rusty";

      await this.economyRepository.mutateWallet(actor.id, coinReward, "chest_open", tx);
      await this.userRepository.addXp(actor.id, xpReward, tx);
      await this.inventoryRepository.grantItemByKey(actor.id, crateKey, 1, {}, tx);
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Chest Opened",
        description: "The chest exploded into coins, XP, and one suspicious loot box.",
        fields: [
          {
            name: "Coins",
            value: formatCoins(coinReward),
            inline: true
          },
          {
            name: "XP",
            value: `+${xpReward}`,
            inline: true
          },
          {
            name: "Loot Box",
            value: crateKey,
            inline: true
          }
        ]
      };
    });
  },

  async handleConfig(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const key = this.normalizeAnswer(args[0] || "");
      const joinedValue = args.slice(1).join(" ").trim();
      const normalizedValue = this.normalizeAnswer(joinedValue);
      const currentLanguage =
        state.settings.language || context.language || context.config.defaultLanguage;
      const currentT = createTranslator(currentLanguage, context.config.defaultLanguage);
      const currentCopy = getConfigCopy(currentLanguage);
      const settingKey = resolveConfigKey(key);
      const booleanValue = resolveConfigBoolean(normalizedValue);

      if (!key || ["help", "?", "view", "show", "xem"].includes(key)) {
        return buildConfigPanel(state, context, currentT, currentLanguage, { showGuide: true });
      }

      if (!settingKey) {
        return buildConfigPanel(state, context, currentT, currentLanguage, {
          showGuide: true,
          description: `${currentT("settings.invalidConfig")}\n${currentCopy.guideDescription}`
        });
      }

      if (settingKey === "language") {
        if (!["en", "vi"].includes(normalizedValue)) {
          return buildConfigPanel(state, context, currentT, currentLanguage, {
            showGuide: true,
            description: `${currentT("settings.invalidLanguage")}\n${currentCopy.guideDescription}`
          });
        }

        state.settings.language = normalizedValue;
      } else if (settingKey === "notifications") {
        if (booleanValue === null) {
          return buildConfigPanel(state, context, currentT, currentLanguage, {
            showGuide: true,
            description: `${currentCopy.invalidBoolean}\n${currentCopy.guideDescription}`
          });
        }

        state.settings.notifications = booleanValue;
      } else if (settingKey === "compactProfile") {
        if (booleanValue === null) {
          return buildConfigPanel(state, context, currentT, currentLanguage, {
            showGuide: true,
            description: `${currentCopy.invalidBoolean}\n${currentCopy.guideDescription}`
          });
        }

        state.settings.compactProfile = booleanValue;
      } else if (settingKey === "theme") {
        if (!normalizedValue) {
          return buildConfigPanel(state, context, currentT, currentLanguage, {
            showGuide: true,
            description: `${currentT("settings.invalidConfig")}\n${currentCopy.guideDescription}`
          });
        }

        state.settings.profileTheme = normalizedValue;
      } else if (settingKey === "chaosMode") {
        if (!normalizedValue) {
          return buildConfigPanel(state, context, currentT, currentLanguage, {
            showGuide: true,
            description: `${currentT("settings.invalidConfig")}\n${currentCopy.guideDescription}`
          });
        }

        state.settings.chaosMode = normalizedValue;
      }

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const responseLanguage = state.settings.language || currentLanguage;
      const responseT = createTranslator(responseLanguage, context.config.defaultLanguage);
      const languageLabel = formatConfigValue("language", state.settings.language, responseLanguage);

      return buildConfigPanel(state, context, responseT, responseLanguage, {
        title: responseT("settings.updatedTitle"),
        description:
          settingKey === "language"
            ? responseT("settings.languageSaved", { language: languageLabel })
            : responseT("settings.updatedDescription")
      });
    });
  },

  async handleSettings(context) {
    return this.db.withTransaction(async (tx) => {
      const { state } = await this.getActorBundle(context, tx);
      const t = context.t || ((key, vars = {}, options = {}) => options.fallback || key);
      const language = state.settings.language || context.language || context.config.defaultLanguage;
      return buildConfigPanel(state, context, t, language);
    });
  },

  async handleProfile(context) {
    return this.db.withTransaction(async (tx) => {
      const args = this.cleanArgs(context.args);
      const subcommand = this.normalizeAnswer(args[0] || "view");
      if (subcommand !== "view" && args.length) {
        throw new Error("Use `Nprofile view @user` or just `Nprofile`.");
      }

      const targetDiscordUser = this.getMentionedUser(context.message) || context.message.author;
      const bundle =
        targetDiscordUser.id === context.message.author.id
          ? await this.getActorBundle(context, tx)
          : await this.getTargetBundle(targetDiscordUser, tx);
      const partnerUserId = bundle.state.systems.social.partnerUserId;
      const users = await this.userRepository.getUsersByIds([partnerUserId].filter(Boolean), tx);
      const usersById = new Map(users.map((user) => [Number(user.id), user]));
      const pet = this.getPetConfig(bundle.state);
      const activePet = this.getActivePetRecord(bundle.state);
      const house = bundle.state.systems.housing;
      const zone = ZONES[bundle.state.systems.world.zone];

      return {
        title: `${targetDiscordUser.username}'s Profile`,
        description: "Live-service progress snapshot.",
        fields: [
          {
            name: "Wallet / Bank",
            value: `${formatCoins(bundle.summary.wallet)} / ${formatCoins(bundle.summary.bank)}`,
            inline: true
          },
          {
            name: "Level",
            value: `Lv.${bundle.summary.level} | XP ${bundle.summary.xp}`,
            inline: true
          },
          {
            name: "Zone",
            value: zone.label,
            inline: true
          },
          {
            name: "Pet",
            value: pet && activePet
              ? `${activePet.nickname} | Lv.${activePet.level} | stage ${bundle.state.systems.pet.stage}`
              : "None",
            inline: true
          },
          {
            name: "House",
            value: house.owned ? `${HOUSE_STYLES[house.style].label} T${house.tier}` : "None",
            inline: true
          },
          {
            name: "Island",
            value: bundle.state.systems.island.owned ? `Tier ${bundle.state.systems.island.tier}` : "None",
            inline: true
          },
          {
            name: "Partner",
            value: this.getPartnerLabel(usersById, partnerUserId),
            inline: true
          },
          {
            name: "Market Goods",
            value: `${bundle.state.systems.market.ownedGoods.length}`,
            inline: true
          },
          {
            name: "Crime Heat / Bounty",
            value: `${bundle.state.systems.crime.heat} / ${formatCoins(bundle.state.systems.crime.bounty)}`,
            inline: true
          }
        ]
      };
    });
  }
};

module.exports = { worldRewardsUtilityMethods };
