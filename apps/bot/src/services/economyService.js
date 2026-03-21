const { formatCoins } = require("../utils/formatters");
const {
  applyPetDecayToState,
  getActivePet,
  getAbilityProfile,
  syncLegacyPetSummary,
  grantPetXp,
  calculatePetPassiveBonus
} = require("./expansion/petEngine");

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function getEconomyCopy(language) {
  if (isVietnameseLanguage(language)) {
    return {
      invalidBet: (rawInput) => `Cược \`${rawInput}\` bị lỗi rồi. Thử nhập số sạch hoặc \`all\`.`,
      imaginaryBet: "Bạn không thể cược coin tưởng tượng. Hãy nhập số lớn hơn 0.",
      walletOnlyHas: (wallet) => `Ví của bạn chỉ có ${wallet}. Bảo kê sòng bạc lắc đầu.`,
      rebateBoth: (petName, currentText) =>
        currentText
          ? `${currentText} ${petName} còn cào về được một khoản hoàn tiền.`
          : `${petName} còn cào về được một khoản hoàn tiền nhỏ.`
    };
  }

  return {
    invalidBet: (rawInput) => `Bet \`${rawInput}\` is cursed. Try a clean number or \`all\`.`,
    imaginaryBet: "You cannot bet imaginary coins. Try a number above 0.",
    walletOnlyHas: (wallet) => `Your wallet only has ${wallet}. The casino bouncer said no.`,
    rebateBoth: (petName, currentText) =>
      currentText
        ? `${currentText} ${petName} clawed back a rebate.`
        : `${petName} clawed back a small rebate.`
  };
}

class EconomyService {
  constructor({ db, apiClient, userRepository, economyRepository, playerStateRepository }) {
    this.db = db;
    this.apiClient = apiClient;
    this.userRepository = userRepository;
    this.economyRepository = economyRepository;
    this.playerStateRepository = playerStateRepository;
  }

  async resolveActor(discordUser, tx, options = {}) {
    if (options.user && String(options.user.discord_id) === String(discordUser.id)) {
      return options.user;
    }

    return this.userRepository.ensureUser(
      { discordId: discordUser.id, username: discordUser.username },
      tx
    );
  }

  normalizeBetInput(rawInput, wallet, language) {
    if (!rawInput) {
      return 100;
    }

    const normalized = rawInput.toLowerCase();
    if (normalized === "all" || normalized === "max") {
      return wallet;
    }

    const parsed = Number(normalized.replace(/,/g, ""));
    if (!Number.isFinite(parsed)) {
      throw new Error(getEconomyCopy(language).invalidBet(rawInput));
    }

    return Math.floor(parsed);
  }

  async getWalletSnapshot(discordUser, options = {}) {
    return this.db.withTransaction(async (tx) => {
      const user = await this.resolveActor(discordUser, tx, options);
      if (!options.skipBootstrap) {
        await this.economyRepository.ensureAccount(user.id, tx);
      }
      const summary = await this.economyRepository.getSummary(user.id, tx);

      return { user, summary };
    });
  }

  async playCoinflip(discordUser, choice, rawBet, options = {}) {
    return this.db.withTransaction(async (tx) => {
      const copy = getEconomyCopy(options.language);
      const user = await this.resolveActor(discordUser, tx, options);
      const account = options.skipBootstrap
        ? await this.economyRepository.getSummary(user.id, tx)
        : await this.economyRepository.ensureAccount(user.id, tx);
      const bet = this.normalizeBetInput(rawBet, Number(account.wallet), options.language);

      if (bet <= 0) {
        throw new Error(copy.imaginaryBet);
      }

      if (Number(account.wallet) < bet) {
        throw new Error(copy.walletOnlyHas(formatCoins(account.wallet)));
      }

      let petState = null;
      let activePet = null;
      let petBonus = 0;

      if (this.playerStateRepository) {
        petState = await this.playerStateRepository.getState(user.id, tx, { forUpdate: true });
        applyPetDecayToState(petState);
        activePet = getActivePet(petState);
        petBonus = activePet ? calculatePetPassiveBonus(petState, "gambling") : 0;
      }

      const result = await this.apiClient.coinflip({
        user_id: discordUser.id,
        choice,
        bet
      });

      if (activePet && petBonus > 0) {
        const ability = getAbilityProfile(activePet.equippedAbility);
        result.pet_name = activePet.nickname;
        result.pet_ability = ability.label;
        result.pet_xp = 10 + Math.min(80, Math.floor(bet / 70));

        if (result.won) {
          const extraProfit = Math.floor(bet * Math.min(0.18, petBonus * 0.45));
          result.profit += extraProfit;
          result.payout += extraProfit;
          result.pet_bonus = extraProfit;
        } else if (Math.random() < Math.min(0.35, petBonus * 0.8)) {
          const rebate = Math.floor(bet * Math.min(0.14, petBonus * 0.32));
          result.profit += rebate;
          result.pet_bonus = rebate;
          result.mood_text = copy.rebateBoth(activePet.nickname, result.mood_text);
        }

        activePet.energy = Math.max(0, activePet.energy - 4);
        activePet.hunger = Math.max(0, activePet.hunger - 2);
        grantPetXp(activePet, result.pet_xp);
      }

      await this.economyRepository.mutateWallet(
        user.id,
        result.profit,
        result.won ? "coinflip_win" : "coinflip_loss",
        tx
      );

      if (petState && activePet) {
        syncLegacyPetSummary(petState);
        await this.playerStateRepository.saveState(user.id, petState.systems, petState.settings, tx);
      }

      const summary = await this.economyRepository.getSummary(user.id, tx);

      return {
        result,
        summary,
        bet
      };
    });
  }
}

module.exports = { EconomyService };
