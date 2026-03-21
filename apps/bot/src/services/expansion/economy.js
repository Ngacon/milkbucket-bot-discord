const { MARKET_TEMPLATES } = require("../../data/liveGameData");
const { formatCoins } = require("./shared");

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function getEconomyCopy(language) {
  if (isVietnameseLanguage(language)) {
    return {
      investAtLeast: "Đầu tư ít nhất 1 coin đi. Chỉ ngồi cầu giàu không ăn thua.",
      walletOnly: (wallet) => `Ví của bạn chỉ còn ${formatCoins(wallet)}.`,
      portfolioTitle: "Danh Mục Milk Coin",
      portfolioDescription: (amount) =>
        `Bạn quăng ${formatCoins(amount)} vào máy xay cổ phiếu. Biểu đồ nhìn phi pháp, tức là khá ổn.`,
      investedVault: "Quỹ Đã Đầu Tư",
      walletLeft: "Ví Còn Lại",
      projectedDailySwing: "Biến Động Dự Kiến Mỗi Ngày",
      interestFooter: "Dùng `Ninterest` để hốt phần kịch tính.",
      loanBlocked: "Ngân hàng đã hối hận vì biết bạn rồi. Trả bớt nợ trước đi.",
      borrowRealAmount: "Vay một số tiền tử tế đi để nhân viên ngân hàng còn hoảng.",
      loanTitle: "Khoản Vay Đáng Ngờ Đã Duyệt",
      loanDescription: (amount) =>
        `Ngân hàng đẩy ${formatCoins(amount)} qua bàn rồi lập tức toát mồ hôi.`,
      debtNow: "Nợ Hiện Tại",
      walletNow: "Ví Hiện Tại",
      borrowLimitLeft: "Hạn Mức Còn Lại",
      repayFooter: "Dùng `Nrepay` trước khi `Ninterest` làm khoản nợ mọc nanh.",
      noLoan: "Bạn không có khoản vay nào để trả. Phép màu có thật.",
      walletEmpty: "Ví bạn trống không. Ngân hàng thả một con bồ câu thất vọng tới.",
      repayAtLeast: "Trả ít nhất 1 coin.",
      repayTitle: "Kiểm Soát Thiệt Hại Nợ",
      repayDescription: (amount) =>
        `Bạn quăng ${formatCoins(amount)} vào khoản nợ và nhân viên ngân hàng gật gù đầy hiểm độc.`,
      debtRemaining: "Nợ Còn Lại",
      mood: "Tâm Trạng",
      moodDebtFree: "Hết nợ và hoang dã.",
      moodInDebt: "Vẫn còn lội trong hố nợ.",
      interestTitle: "Bảng Tính Lãi",
      interestDescription: "Nhân viên ngân hàng mở bảng sao kê của bạn với độ kịch tính tối đa.",
      bankInterest: "Lãi Ngân Hàng",
      investmentYield: "Lợi Suất Đầu Tư",
      loanCreep: "Nợ Phình Thêm",
      noneToday: "Hôm nay không có",
      bankNow: "Ngân Hàng Hiện Tại",
      invested: "Đã Đầu Tư",
      debt: "Nợ",
      needForTickets: (cost, count) => `Bạn cần ${formatCoins(cost)} cho ${count} vé.`,
      lotteryTitle: "Bãi Chiến Vé Số",
      lotteryJackpotDescription: (amount) =>
        `Vô lý thật sự. Bạn nổ hũ và chôm ${formatCoins(amount)} khỏi vũ trụ.`,
      lotteryNormalDescription: (count) =>
        `Bạn nạp ${count} vé vào cái máy gào thét rồi ngồi đợi số mệnh ợ ra kết quả.`,
      spent: "Đã Chi",
      won: "Thắng",
      nothingButVibes: "Không được gì ngoài niềm tin",
      chestKeys: "Chìa Khóa Rương",
      jackpotPool: "Quỹ Nổ Hũ",
      lifetimeTicketsBurned: "Tổng Vé Đã Đốt",
      jackpotBoardTitle: "Bảng Nổ Hũ Toàn Server",
      jackpotBoardDescription: "Quỹ jackpot cộng đồng là một cái bẫy lấp lánh khổng lồ và ai cũng lao vào.",
      currentPool: "Quỹ Hiện Tại",
      lastWinner: "Người Trúng Gần Nhất",
      noWinnerYet: "Chưa ai nổ hũ cả",
      lastBlast: "Lần Nổ Gần Nhất",
      noPayoutYet: "Chưa có payout nào",
      featuredBazaarItem: "Món Bazaar Nổi Bật",
      jackpotFooter: "Mua vé bằng `Nlottery`. Hối hận là một phần của gameplay."
    };
  }

  return {
    investAtLeast: "Invest at least 1 coin. Manifesting wealth is not enough.",
    walletOnly: (wallet) => `Your wallet only has ${formatCoins(wallet)}.`,
    portfolioTitle: "Milk Coin Portfolio",
    portfolioDescription: (amount) =>
      `You launched ${formatCoins(amount)} into the stonks blender. The chart looks illegal, which is a good sign.`,
    investedVault: "Invested Vault",
    walletLeft: "Wallet Left",
    projectedDailySwing: "Projected Daily Swing",
    interestFooter: "Use `Ninterest` to collect the drama.",
    loanBlocked: "The bank already regrets knowing you. Repay some debt first.",
    borrowRealAmount: "Borrow a real amount so the banker can panic correctly.",
    loanTitle: "Questionable Loan Approved",
    loanDescription: (amount) =>
      `The bank slid ${formatCoins(amount)} across the table and immediately started sweating.`,
    debtNow: "Debt Now",
    walletNow: "Wallet Now",
    borrowLimitLeft: "Borrow Limit Left",
    repayFooter: "Use `Nrepay` before `Ninterest` makes the debt grow teeth.",
    noLoan: "You have no loan to repay. Miracles happen.",
    walletEmpty: "Your wallet is empty. The bank sent a very disappointed pigeon.",
    repayAtLeast: "Repay at least 1 coin.",
    repayTitle: "Debt Damage Control",
    repayDescription: (amount) =>
      `You slapped ${formatCoins(amount)} onto the loan and the banker hissed approvingly.`,
    debtRemaining: "Debt Remaining",
    mood: "Mood",
    moodDebtFree: "Debt free and feral.",
    moodInDebt: "Still in the trench.",
    interestTitle: "Interest Check",
    interestDescription: "The bank clerk unfolded your account statement with maximum dramatic pause.",
    bankInterest: "Bank Interest",
    investmentYield: "Investment Yield",
    loanCreep: "Loan Creep",
    noneToday: "None today",
    bankNow: "Bank Now",
    invested: "Invested",
    debt: "Debt",
    needForTickets: (cost, count) => `You need ${formatCoins(cost)} for ${count} ticket(s).`,
    lotteryTitle: "Lottery Ticket Carnage",
    lotteryJackpotDescription: (amount) =>
      `Absolute nonsense. You detonated the jackpot and stole ${formatCoins(amount)} from the universe.`,
    lotteryNormalDescription: (count) =>
      `You fed ${count} ticket(s) into the screaming machine and waited for destiny to burp.`,
    spent: "Spent",
    won: "Won",
    nothingButVibes: "Nothing but vibes",
    chestKeys: "Chest Keys",
    jackpotPool: "Jackpot Pool",
    lifetimeTicketsBurned: "Lifetime Tickets Burned",
    jackpotBoardTitle: "Global Jackpot Board",
    jackpotBoardDescription: "The community jackpot is a giant glittering trap and everyone loves it.",
    currentPool: "Current Pool",
    lastWinner: "Last Winner",
    noWinnerYet: "Nobody has popped it yet",
    lastBlast: "Last Blast",
    noPayoutYet: "No payout yet",
    featuredBazaarItem: "Featured Bazaar Item",
    jackpotFooter: "Buy tickets with `Nlottery`. Regret is part of the loop."
  };
}

const economyMethods = {
  async handleInvest(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const copy = getEconomyCopy(language);
      const args = this.cleanArgs(context.args);
      const fallback = Math.min(Number(summary.wallet), 250);
      const amount = this.parseAmount(args[0], fallback, Number(summary.wallet));

      if (amount <= 0) {
        throw new Error(copy.investAtLeast);
      }

      if (Number(summary.wallet) < amount) {
        throw new Error(copy.walletOnly(summary.wallet));
      }

      await this.economyRepository.mutateWallet(actor.id, -amount, "invest_deposit", tx);
      state.systems.economy.invested += amount;
      if (!state.systems.economy.lastInterestAt) {
        state.systems.economy.lastInterestAt = new Date().toISOString();
      }

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);
      const projected = Math.floor(amount * (0.05 + state.systems.housing.tier * 0.004));

      return {
        title: copy.portfolioTitle,
        description: copy.portfolioDescription(amount),
        fields: [
          {
            name: copy.investedVault,
            value: formatCoins(state.systems.economy.invested),
            inline: true
          },
          {
            name: copy.walletLeft,
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: copy.projectedDailySwing,
            value: formatCoins(projected),
            inline: true
          }
        ],
        footer: copy.interestFooter
      };
    });
  },

  async handleLoan(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const copy = getEconomyCopy(language);
      const args = this.cleanArgs(context.args);
      const loanCap =
        1500 + Number(summary.level) * 900 + state.systems.housing.tier * 600 + state.systems.pet.stage * 250;
      const available = Math.max(0, loanCap - state.systems.economy.loanBalance);

      if (available <= 0) {
        throw new Error(copy.loanBlocked);
      }

      const amount = this.parseAmount(args[0], Math.min(available, 1000), available);
      if (amount <= 0) {
        throw new Error(copy.borrowRealAmount);
      }

      await this.economyRepository.mutateWallet(actor.id, amount, "loan_issue", tx);
      const debtAdded = Math.floor(amount * 1.18);
      state.systems.economy.loanBalance += debtAdded;
      state.systems.economy.loanTakenAt = new Date().toISOString();
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);

      return {
        title: copy.loanTitle,
        description: copy.loanDescription(amount),
        fields: [
          {
            name: copy.debtNow,
            value: formatCoins(state.systems.economy.loanBalance),
            inline: true
          },
          {
            name: copy.walletNow,
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: copy.borrowLimitLeft,
            value: formatCoins(Math.max(0, available - amount)),
            inline: true
          }
        ],
        footer: copy.repayFooter
      };
    });
  },

  async handleRepay(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const copy = getEconomyCopy(language);
      if (state.systems.economy.loanBalance <= 0) {
        throw new Error(copy.noLoan);
      }

      const args = this.cleanArgs(context.args);
      const maxPayment = Math.min(Number(summary.wallet), state.systems.economy.loanBalance);
      if (maxPayment <= 0) {
        throw new Error(copy.walletEmpty);
      }

      const amount = this.parseAmount(args[0], maxPayment, maxPayment);
      if (amount <= 0) {
        throw new Error(copy.repayAtLeast);
      }

      await this.economyRepository.mutateWallet(actor.id, -amount, "loan_repay", tx);
      state.systems.economy.loanBalance = Math.max(0, state.systems.economy.loanBalance - amount);
      if (state.systems.economy.loanBalance === 0) {
        state.systems.economy.loanTakenAt = null;
      }

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);

      return {
        title: copy.repayTitle,
        description: copy.repayDescription(amount),
        fields: [
          {
            name: copy.debtRemaining,
            value: formatCoins(state.systems.economy.loanBalance),
            inline: true
          },
          {
            name: copy.walletLeft,
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: copy.mood,
            value: state.systems.economy.loanBalance === 0 ? copy.moodDebtFree : copy.moodInDebt,
            inline: true
          }
        ]
      };
    });
  },

  async handleInterest(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const copy = getEconomyCopy(language);
      const now = new Date();
      const lastInterestAt = state.systems.economy.lastInterestAt
        ? new Date(state.systems.economy.lastInterestAt)
        : new Date(Date.now() - 6 * 60 * 60 * 1000);
      const elapsedHours = this.clamp((now.getTime() - lastInterestAt.getTime()) / 3_600_000, 1, 24);
      const bankRate = 0.03 + Number(summary.level) * 0.0012;
      const investRate = 0.05 + state.systems.housing.tier * 0.004;
      const bankGain = Math.floor(Number(summary.bank) * bankRate * (elapsedHours / 24));
      const investGain = Math.floor(state.systems.economy.invested * investRate * (elapsedHours / 24));
      const loanCreep = Math.floor(state.systems.economy.loanBalance * 0.08 * (elapsedHours / 24));

      if (bankGain + investGain > 0) {
        await this.economyRepository.mutateBank(actor.id, bankGain + investGain, "interest_claim", tx);
      }

      if (loanCreep > 0) {
        state.systems.economy.loanBalance += loanCreep;
      }

      state.systems.economy.lastInterestAt = now.toISOString();
      state.systems.economy.totalInterestCollected += bankGain + investGain;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);

      return {
        title: copy.interestTitle,
        description: copy.interestDescription,
        fields: [
          {
            name: copy.bankInterest,
            value: `${formatCoins(bankGain)} at ${this.formatPercent(bankRate)}/day`,
            inline: true
          },
          {
            name: copy.investmentYield,
            value: `${formatCoins(investGain)} at ${this.formatPercent(investRate)}/day`,
            inline: true
          },
          {
            name: copy.loanCreep,
            value: loanCreep > 0 ? `+${formatCoins(loanCreep)}` : copy.noneToday,
            inline: true
          },
          {
            name: copy.bankNow,
            value: formatCoins(refreshed.bank),
            inline: true
          },
          {
            name: copy.invested,
            value: formatCoins(state.systems.economy.invested),
            inline: true
          },
          {
            name: copy.debt,
            value: formatCoins(state.systems.economy.loanBalance),
            inline: true
          }
        ]
      };
    });
  },

  async handleLottery(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const copy = getEconomyCopy(language);
      const args = this.cleanArgs(context.args);
      const ticketCount = this.parseCount(args[0], 1, 1, 5);
      const cost = ticketCount * 250;

      if (Number(summary.wallet) < cost) {
        throw new Error(copy.needForTickets(cost, ticketCount));
      }

      const world = await this.worldStateRepository.getState("global", tx, { forUpdate: true });
      await this.economyRepository.mutateWallet(actor.id, -cost, "lottery_ticket", tx);

      world.payload.jackpotPool += ticketCount * 180;
      let winnings = 0;
      let jackpotWon = 0;
      let keysWon = 0;

      for (let index = 0; index < ticketCount; index += 1) {
        const roll = Math.random();
        if (roll < 0.006 && jackpotWon === 0) {
          jackpotWon = world.payload.jackpotPool;
          winnings += jackpotWon;
          world.payload.lastWinnerUserId = actor.id;
          world.payload.lastWinAmount = jackpotWon;
          world.payload.jackpotPool = 12_000 + this.randomInt(1_000, 4_000);
          continue;
        }

        if (roll < 0.09) {
          winnings += this.randomInt(450, 1_800);
        }

        if (this.roll(0.16)) {
          keysWon += 1;
        }
      }

      if (winnings > 0) {
        await this.economyRepository.mutateWallet(actor.id, winnings, "lottery_win", tx);
      }

      state.systems.economy.totalLotterySpent += cost;
      state.systems.rewards.keys += keysWon;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      await this.worldStateRepository.saveState("global", world.payload, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);

      return {
        title: copy.lotteryTitle,
        description:
          jackpotWon > 0 ? copy.lotteryJackpotDescription(jackpotWon) : copy.lotteryNormalDescription(ticketCount),
        fields: [
          {
            name: copy.spent,
            value: formatCoins(cost),
            inline: true
          },
          {
            name: copy.won,
            value: winnings > 0 ? formatCoins(winnings) : copy.nothingButVibes,
            inline: true
          },
          {
            name: copy.chestKeys,
            value: `${keysWon}`,
            inline: true
          },
          {
            name: copy.jackpotPool,
            value: formatCoins(world.payload.jackpotPool),
            inline: true
          },
          {
            name: copy.walletNow,
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: copy.lifetimeTicketsBurned,
            value: formatCoins(state.systems.economy.totalLotterySpent),
            inline: true
          }
        ]
      };
    });
  },

  async handleJackpot(context) {
    return this.db.withTransaction(async (tx) => {
      const language = this.resolveLanguage(context);
      const copy = getEconomyCopy(language);
      const world = await this.worldStateRepository.getState("global", tx);
      const lastWinner = world.payload.lastWinnerUserId
        ? await this.userRepository.findById(world.payload.lastWinnerUserId, tx)
        : null;

      return {
        title: copy.jackpotBoardTitle,
        description: copy.jackpotBoardDescription,
        fields: [
          {
            name: copy.currentPool,
            value: formatCoins(world.payload.jackpotPool),
            inline: true
          },
          {
            name: copy.lastWinner,
            value: lastWinner ? lastWinner.username : copy.noWinnerYet,
            inline: true
          },
          {
            name: copy.lastBlast,
            value: world.payload.lastWinAmount ? formatCoins(world.payload.lastWinAmount) : copy.noPayoutYet,
            inline: true
          },
          {
            name: copy.featuredBazaarItem,
            value: MARKET_TEMPLATES[world.payload.featuredTemplateIndex % MARKET_TEMPLATES.length],
            inline: false
          }
        ],
        footer: copy.jackpotFooter
      };
    });
  }
};

module.exports = { economyMethods };
