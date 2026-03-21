const {
  PET_SPECIES,
  HOUSE_STYLES,
  ZONES,
  DEEPSEA_SPECIES
} = require("../../data/liveGameData");
const { formatCoins, rarityEmoji, formatDuration } = require("../../utils/formatters");
const { createTranslator, normalizeLanguage } = require("../../i18n");
const {
  getSpeciesProfile,
  getAbilityProfile,
  getPetFormName,
  getMoodEmoji,
  ensurePetStateShape,
  getActivePet: resolveActivePet,
  syncLegacyPetSummary,
  applyPetDecayToState,
  calculatePetPassiveBonus,
  calculatePetBattleRating
} = require("./petEngine");

const sharedMethods = {
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  roll(chance) {
    return Math.random() < chance;
  },

  pick(list) {
    return list[this.randomInt(0, list.length - 1)];
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  cleanArgs(args) {
    return (args || []).filter((arg) => !/^<@!?\d+>$/.test(arg));
  },

  normalizeAnswer(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u0111/g, "d");
  },

  parseAmount(raw, fallback, maxValue, t) {
    const upperBound = Number.isFinite(Number(maxValue)) ? Number(maxValue) : Number.MAX_SAFE_INTEGER;
    if (!raw) {
      return Math.max(0, Math.floor(fallback || 0));
    }

    const normalized = String(raw).toLowerCase();
    if (normalized === "all" || normalized === "max") {
      return Math.max(0, Math.floor(upperBound));
    }

    const parsed = Number(normalized.replace(/,/g, ""));
    if (!Number.isFinite(parsed)) {
      throw new Error(
        t
          ? t(
              "expansion.invalidNumber",
              { value: raw },
              { fallback: `\`${raw}\` is not a valid number. The cashier is judging you.` }
            )
          : `\`${raw}\` is not a valid number. The cashier is judging you.`
      );
    }

    return Math.max(0, Math.floor(parsed));
  },

  parseCount(raw, fallback, min, max, t) {
    if (!raw) {
      return fallback;
    }

    const parsed = Number(String(raw).replace(/,/g, ""));
    if (!Number.isFinite(parsed)) {
      throw new Error(
        t
          ? t("expansion.invalidCount", { value: raw }, { fallback: `\`${raw}\` is not a valid count.` })
          : `\`${raw}\` is not a valid count.`
      );
    }

    return this.clamp(Math.floor(parsed), min, max);
  },

  formatPercent(value) {
    return `${(Number(value) * 100).toFixed(1)}%`;
  },

  resolveLanguage(context, state) {
    return normalizeLanguage(
      state?.settings?.language || context?.language || context?.config?.defaultLanguage,
      "en"
    );
  },

  isVietnameseLanguage(language) {
    return String(language || "").toLowerCase().startsWith("vi");
  },

  getTranslator(context) {
    if (typeof context?.t === "function") {
      return context.t;
    }

    const fallbackLanguage = normalizeLanguage(context?.config?.defaultLanguage, "en");
    const language = normalizeLanguage(context?.language, fallbackLanguage);
    return createTranslator(language, fallbackLanguage);
  },

  getMentionedUser(message) {
    return message.mentions.users.first() || null;
  },

  getJailMs(state) {
    const jailUntil = state.systems.crime.jailUntil;
    if (!jailUntil) {
      return 0;
    }

    const remaining = new Date(jailUntil).getTime() - Date.now();
    return remaining > 0 ? remaining : 0;
  },

  assertNotJailed(state, t) {
    const remainingMs = this.getJailMs(state);
    if (remainingMs > 0) {
      throw new Error(
        t
          ? t(
              "expansion.inJail",
              { time: formatDuration(remainingMs) },
              {
                fallback: `You are in goblin jail for another ${formatDuration(
                  remainingMs
                )}. Try \`Njail\` or gamble on \`Nescape\`.`
              }
            )
          : `You are in goblin jail for another ${formatDuration(
              remainingMs
            )}. Try \`Njail\` or gamble on \`Nescape\`.`
      );
    }
  },

  getPetState(state) {
    ensurePetStateShape(state);
    applyPetDecayToState(state);
    syncLegacyPetSummary(state);
    return state.systems.pet;
  },

  getActivePetRecord(state) {
    this.getPetState(state);
    return resolveActivePet(state);
  },

  getPetConfig(state) {
    const activePet = this.getActivePetRecord(state);
    return activePet ? getSpeciesProfile(activePet.speciesKey) : null;
  },

  getPetAbility(state) {
    const activePet = this.getActivePetRecord(state);
    return activePet ? getAbilityProfile(activePet.equippedAbility) : null;
  },

  getPetPassiveBonus(state, domain = "general") {
    const petState = this.getPetState(state);
    if (!petState.owned) {
      return 0;
    }

    return calculatePetPassiveBonus(state, domain);
  },

  getPetBattleRating(state) {
    this.getPetState(state);
    return calculatePetBattleRating(state);
  },

  getPetDisplayName(state) {
    const activePet = this.getActivePetRecord(state);
    if (!activePet) {
      return null;
    }

    return `${getMoodEmoji(activePet)} ${getPetFormName(activePet)}`;
  },

  getPartnerLabel(usersById, partnerUserId, language) {
    if (!partnerUserId) {
      return this.isVietnameseLanguage(language) ? "Chưa có" : "Nobody yet";
    }

    return usersById.get(partnerUserId)?.username || `User #${partnerUserId}`;
  },

  getLocalizedPetName(pet, language) {
    if (!pet) {
      return null;
    }

    return this.isVietnameseLanguage(language) && pet.nameVi ? pet.nameVi : pet.name;
  },

  getLocalizedHouseLabel(style, language) {
    if (!style) {
      return null;
    }

    return this.isVietnameseLanguage(language) && style.labelVi ? style.labelVi : style.label;
  },

  getLocalizedZoneLabel(zone, language) {
    if (!zone) {
      return null;
    }

    return this.isVietnameseLanguage(language) && zone.labelVi ? zone.labelVi : zone.label;
  },

  getLocalizedZoneDescription(zone, language) {
    if (!zone) {
      return "";
    }

    return this.isVietnameseLanguage(language) && zone.descriptionVi ? zone.descriptionVi : zone.description;
  },

  getLocalizedRewardDescription(reward, language) {
    if (!reward) {
      return "";
    }

    return this.isVietnameseLanguage(language) && reward.descriptionVi ? reward.descriptionVi : reward.description;
  },

  pushOwnedGood(state, title) {
    const goods = state.systems.market.ownedGoods;
    goods.unshift(title);
    state.systems.market.ownedGoods = goods.slice(0, 12);
  },

  upgradeRarity(rarity) {
    const order = ["uncommon", "rare", "epic", "legendary", "mythical"];
    const index = order.indexOf((rarity || "").toLowerCase());
    if (index === -1 || index === order.length - 1) {
      return rarity;
    }

    return order[index + 1];
  },

  buildLocalCatch(mode, level, biome) {
    const adjustedRoll = Math.random() + Math.min(level, 20) * 0.015 + (mode === "deepsea" ? 0.05 : 0);
    let chosen;
    if (adjustedRoll > 1.08) {
      chosen = DEEPSEA_SPECIES[3];
    } else if (adjustedRoll > 0.9) {
      chosen = DEEPSEA_SPECIES[2];
    } else if (adjustedRoll > 0.62) {
      chosen = DEEPSEA_SPECIES[1];
    } else {
      chosen = DEEPSEA_SPECIES[0];
    }

    if (mode === "island" && chosen.rarity === "legendary" && !this.roll(0.45)) {
      chosen = DEEPSEA_SPECIES[2];
    }

    const baseValue = this.randomInt(chosen.valueRange[0], chosen.valueRange[1]) + level * 18;
    const jackpot = chosen.rarity === "legendary" && this.roll(0.18);
    const estimatedValue = jackpot ? Math.floor(baseValue * 1.8) : baseValue;
    const qualityScore = this.clamp(this.randomInt(55, 98) + Math.floor(level / 2), 40, 100);
    const weightKg = (Math.random() * 7 + 1.2 + level * 0.18).toFixed(2);
    const lengthCm = (Math.random() * 90 + 35 + level * 2.2).toFixed(2);
    const xp = this.randomInt(32, 70) + level * 4;

    return {
      speciesKey: chosen.key,
      speciesName: chosen.name,
      rarity: jackpot ? "mythical" : chosen.rarity,
      weightKg,
      lengthCm,
      qualityScore,
      estimatedValue,
      xp,
      biome,
      isBoss: false,
      isJackpot: jackpot,
      flavorText: this.pick([
        "The water made a threatening sound and then paid you.",
        "A violent splash occurred. Financially, it was worth it.",
        "The ocean handed over a problem-shaped treasure."
      ])
    };
  },

  async recordLocalCatch(userId, catchData, source, executor) {
    await this.fishRepository.recordCatch(
      userId,
      {
        speciesKey: catchData.speciesKey,
        speciesName: catchData.speciesName,
        biome: catchData.biome,
        rarity: catchData.rarity,
        weightKg: catchData.weightKg,
        lengthCm: catchData.lengthCm,
        qualityScore: catchData.qualityScore,
        estValue: catchData.estimatedValue,
        isBoss: catchData.isBoss,
        isJackpot: catchData.isJackpot,
        metadata: {
          source
        }
      },
      executor
    );
  },

  storeAquariumFish(state, catchData) {
    const aquarium = state.systems.fishing.aquarium;
    const fishEntry = {
      id: `${Date.now()}-${this.randomInt(100, 999)}`,
      name: catchData.speciesName,
      rarity: catchData.rarity,
      value: catchData.estimatedValue,
      quality: catchData.qualityScore,
      mutations: 0
    };

    if (aquarium.length < 6) {
      aquarium.push(fishEntry);
      return { stored: true, replaced: false, entry: fishEntry };
    }

    const weakestIndex = aquarium.reduce(
      (index, fish, currentIndex, list) => (fish.value < list[index].value ? currentIndex : index),
      0
    );

    if (aquarium[weakestIndex].value >= fishEntry.value) {
      return { stored: false, replaced: false, entry: fishEntry };
    }

    aquarium.splice(weakestIndex, 1, fishEntry);
    return { stored: true, replaced: true, entry: fishEntry };
  },

  async getActorBundle(context, executor, options = {}) {
    const actor = await this.getActorUser(context, executor);
    const summary = await this.economyRepository.getSummary(actor.id, executor);
    const state = await this.playerStateRepository.getState(actor.id, executor, options);
    this.getPetState(state);
    return { actor, summary, state };
  },

  async getActorUser(context, executor) {
    if (
      context.user &&
      String(context.user.discord_id) === String(context.message.author.id)
    ) {
      return context.user;
    }

    return this.profileService.syncFromMessage(context.message, executor);
  },

  async getTargetBundle(discordUser, executor, options = {}) {
    const user = await this.profileService.resolveByDiscordUser(discordUser, executor);
    const summary = await this.economyRepository.getSummary(user.id, executor);
    const state = await this.playerStateRepository.getState(user.id, executor, options);
    this.getPetState(state);
    return { user, summary, state };
  },

  async settleExpiredAuctions(executor) {
    const expired = await this.marketRepository.listExpiredAuctions(executor);
    let sold = 0;
    let lapsed = 0;

    for (const auction of expired) {
      if (!auction.current_bidder_user_id) {
        await this.marketRepository.finalizeAuction(auction.id, "expired", executor);
        lapsed += 1;
        continue;
      }

      await this.economyRepository.mutateWallet(
        auction.seller_user_id,
        auction.current_bid,
        "auction_sale",
        executor
      );

      const states = await this.playerStateRepository.getStates(
        [auction.seller_user_id, auction.current_bidder_user_id],
        executor,
        { forUpdate: true }
      );
      const stateMap = new Map(states.map((state) => [Number(state.user_id), state]));
      const sellerState = stateMap.get(Number(auction.seller_user_id));
      const bidderState = stateMap.get(Number(auction.current_bidder_user_id));

      sellerState.systems.market.sales += 1;
      bidderState.systems.market.auctionWins += 1;
      this.pushOwnedGood(bidderState, auction.title);

      await this.playerStateRepository.saveState(
        Number(auction.seller_user_id),
        sellerState.systems,
        sellerState.settings,
        executor
      );
      await this.playerStateRepository.saveState(
        Number(auction.current_bidder_user_id),
        bidderState.systems,
        bidderState.settings,
        executor
      );
      await this.marketRepository.finalizeAuction(auction.id, "sold", executor);
      sold += 1;
    }

    return { sold, expired: lapsed };
  },

  resolveBet(args, wallet, fallback = 100, t) {
    const bet = this.parseAmount(args[0], fallback, Number(wallet), t);
    if (bet <= 0) {
      throw new Error(
        t
          ? t(
              "expansion.wager.betAboveZero",
              {},
              { fallback: "Bet more than zero. The casino hates invisible money." }
            )
          : "Bet more than zero. The casino hates invisible money."
      );
    }
    return bet;
  },

  async playWagerGame(context, resolver) {
    return this.db.withTransaction(async (tx) => {
      const t = this.getTranslator(context);
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      this.assertNotJailed(state, t);
      const result = resolver.call(this, context, summary, state, t);

      if (result.bet <= 0) {
        throw new Error(
          t(
            "expansion.wager.betAboveZero",
            {},
            { fallback: "Bet above 0, you beautiful gambler." }
          )
        );
      }

      if (Number(summary.wallet) < result.bet) {
        throw new Error(
          t(
            "expansion.wager.walletOnlyHave",
            { wallet: formatCoins(summary.wallet) },
            { fallback: `You only have ${formatCoins(summary.wallet)} in your wallet.` }
          )
        );
      }

      await this.economyRepository.mutateWallet(actor.id, result.profit, result.reason, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);

      return {
        title: result.title,
        description: result.description,
        fields: [
          {
            name: t("expansion.wager.bet", {}, { fallback: "Bet" }),
            value: formatCoins(result.bet),
            inline: true
          },
          {
            name: t("expansion.wager.profit", {}, { fallback: "Profit" }),
            value: result.profit >= 0 ? formatCoins(result.profit) : `-${formatCoins(Math.abs(result.profit))}`,
            inline: true
          },
          {
            name: t("expansion.wager.walletNow", {}, { fallback: "Wallet Now" }),
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          ...(result.extraFields || [])
        ],
        footer: result.footer
      };
    });
  }
};

module.exports = {
  sharedMethods,
  PET_SPECIES,
  HOUSE_STYLES,
  ZONES,
  formatCoins,
  rarityEmoji
};
