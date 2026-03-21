const { MARKET_TEMPLATES } = require("../../data/liveGameData");
const { formatCoins } = require("./shared");

const economyMethods = {
  async handleInvest(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const fallback = Math.min(Number(summary.wallet), 250);
      const amount = this.parseAmount(args[0], fallback, Number(summary.wallet));

      if (amount <= 0) {
        throw new Error("Invest at least 1 coin. Manifesting wealth is not enough.");
      }

      if (Number(summary.wallet) < amount) {
        throw new Error(`Your wallet only has ${formatCoins(summary.wallet)}.`);
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
        title: "Milk Coin Portfolio",
        description: `You launched ${formatCoins(amount)} into the stonks blender. The chart looks illegal, which is a good sign.`,
        fields: [
          {
            name: "Invested Vault",
            value: formatCoins(state.systems.economy.invested),
            inline: true
          },
          {
            name: "Wallet Left",
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: "Projected Daily Swing",
            value: formatCoins(projected),
            inline: true
          }
        ],
        footer: "Use Ninterest to collect the drama."
      };
    });
  },

  async handleLoan(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const args = this.cleanArgs(context.args);
      const loanCap =
        1500 + Number(summary.level) * 900 + state.systems.housing.tier * 600 + state.systems.pet.stage * 250;
      const available = Math.max(0, loanCap - state.systems.economy.loanBalance);

      if (available <= 0) {
        throw new Error("The bank already regrets knowing you. Repay some debt first.");
      }

      const amount = this.parseAmount(args[0], Math.min(available, 1000), available);
      if (amount <= 0) {
        throw new Error("Borrow a real amount so the banker can panic correctly.");
      }

      await this.economyRepository.mutateWallet(actor.id, amount, "loan_issue", tx);
      const debtAdded = Math.floor(amount * 1.18);
      state.systems.economy.loanBalance += debtAdded;
      state.systems.economy.loanTakenAt = new Date().toISOString();
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);

      return {
        title: "Questionable Loan Approved",
        description: `The bank slid ${formatCoins(amount)} across the table and immediately started sweating.`,
        fields: [
          {
            name: "Debt Now",
            value: formatCoins(state.systems.economy.loanBalance),
            inline: true
          },
          {
            name: "Wallet Now",
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: "Borrow Limit Left",
            value: formatCoins(Math.max(0, available - amount)),
            inline: true
          }
        ],
        footer: "Use Nrepay before Ninterest makes the debt grow teeth."
      };
    });
  },

  async handleRepay(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      if (state.systems.economy.loanBalance <= 0) {
        throw new Error("You have no loan to repay. Miracles happen.");
      }

      const args = this.cleanArgs(context.args);
      const maxPayment = Math.min(Number(summary.wallet), state.systems.economy.loanBalance);
      if (maxPayment <= 0) {
        throw new Error("Your wallet is empty. The bank sent a very disappointed pigeon.");
      }

      const amount = this.parseAmount(args[0], maxPayment, maxPayment);
      if (amount <= 0) {
        throw new Error("Repay at least 1 coin.");
      }

      await this.economyRepository.mutateWallet(actor.id, -amount, "loan_repay", tx);
      state.systems.economy.loanBalance = Math.max(0, state.systems.economy.loanBalance - amount);
      if (state.systems.economy.loanBalance === 0) {
        state.systems.economy.loanTakenAt = null;
      }

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);

      return {
        title: "Debt Damage Control",
        description: `You slapped ${formatCoins(amount)} onto the loan and the banker hissed approvingly.`,
        fields: [
          {
            name: "Debt Remaining",
            value: formatCoins(state.systems.economy.loanBalance),
            inline: true
          },
          {
            name: "Wallet Left",
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: "Mood",
            value: state.systems.economy.loanBalance === 0 ? "Debt free and feral." : "Still in the trench.",
            inline: true
          }
        ]
      };
    });
  },

  async handleInterest(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
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
        title: "Interest Check",
        description: "The bank clerk unfolded your account statement with maximum dramatic pause.",
        fields: [
          {
            name: "Bank Interest",
            value: `${formatCoins(bankGain)} at ${this.formatPercent(bankRate)}/day`,
            inline: true
          },
          {
            name: "Investment Yield",
            value: `${formatCoins(investGain)} at ${this.formatPercent(investRate)}/day`,
            inline: true
          },
          {
            name: "Loan Creep",
            value: loanCreep > 0 ? `+${formatCoins(loanCreep)}` : "None today",
            inline: true
          },
          {
            name: "Bank Now",
            value: formatCoins(refreshed.bank),
            inline: true
          },
          {
            name: "Invested",
            value: formatCoins(state.systems.economy.invested),
            inline: true
          },
          {
            name: "Debt",
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
      const args = this.cleanArgs(context.args);
      const ticketCount = this.parseCount(args[0], 1, 1, 5);
      const cost = ticketCount * 250;

      if (Number(summary.wallet) < cost) {
        throw new Error(`You need ${formatCoins(cost)} for ${ticketCount} ticket(s).`);
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
        title: "Lottery Ticket Carnage",
        description:
          jackpotWon > 0
            ? `Absolute nonsense. You detonated the jackpot and stole ${formatCoins(jackpotWon)} from the universe.`
            : `You fed ${ticketCount} ticket(s) into the screaming machine and waited for destiny to burp.`,
        fields: [
          {
            name: "Spent",
            value: formatCoins(cost),
            inline: true
          },
          {
            name: "Won",
            value: winnings > 0 ? formatCoins(winnings) : "Nothing but vibes",
            inline: true
          },
          {
            name: "Chest Keys",
            value: `${keysWon}`,
            inline: true
          },
          {
            name: "Jackpot Pool",
            value: formatCoins(world.payload.jackpotPool),
            inline: true
          },
          {
            name: "Wallet Now",
            value: formatCoins(refreshed.wallet),
            inline: true
          },
          {
            name: "Lifetime Tickets Burned",
            value: formatCoins(state.systems.economy.totalLotterySpent),
            inline: true
          }
        ]
      };
    });
  },

  async handleJackpot() {
    return this.db.withTransaction(async (tx) => {
      const world = await this.worldStateRepository.getState("global", tx);
      const lastWinner = world.payload.lastWinnerUserId
        ? await this.userRepository.findById(world.payload.lastWinnerUserId, tx)
        : null;

      return {
        title: "Global Jackpot Board",
        description: "The community jackpot is a giant glittering trap and everyone loves it.",
        fields: [
          {
            name: "Current Pool",
            value: formatCoins(world.payload.jackpotPool),
            inline: true
          },
          {
            name: "Last Winner",
            value: lastWinner ? lastWinner.username : "Nobody has popped it yet",
            inline: true
          },
          {
            name: "Last Blast",
            value: world.payload.lastWinAmount ? formatCoins(world.payload.lastWinAmount) : "No payout yet",
            inline: true
          },
          {
            name: "Featured Bazaar Item",
            value: MARKET_TEMPLATES[world.payload.featuredTemplateIndex % MARKET_TEMPLATES.length],
            inline: false
          }
        ],
        footer: "Buy tickets with Nlottery. Regret is part of the loop."
      };
    });
  }
};

module.exports = { economyMethods };
