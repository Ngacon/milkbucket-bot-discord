const { WORK_ACTIVITIES } = require("../../data/liveGameData");
const { formatCoins } = require("./shared");
const { progressBar } = require("../../utils/formatters");

function getActivityLabel(t, activityKey, fallback) {
  return t(`expansion.work.activities.${activityKey}.label`, {}, { fallback });
}

function getActivityFlavors(t, activityKey, fallbacks) {
  return fallbacks.map((flavor, index) =>
    t(`expansion.work.activities.${activityKey}.flavor${index + 1}`, {}, { fallback: flavor })
  );
}

const workGamblingMethods = {
  async performWork(context, activityKey) {
    return this.db.withTransaction(async (tx) => {
      const activity = WORK_ACTIVITIES[activityKey];
      const t = this.getTranslator(context);
      const { actor, summary, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      this.assertNotJailed(state, t);

      const skillLevel = state.systems.work[activity.levelKey];
      const passiveBonus = this.getPetPassiveBonus(state, "work");
      const activityLabel = getActivityLabel(t, activityKey, activity.label);
      const activityFlavors = getActivityFlavors(t, activityKey, activity.flavor);
      const resourceLabel = t(`expansion.work.resources.${activity.statKey}`, {}, { fallback: activity.statKey });
      const reward =
        this.randomInt(activity.rewardRange[0], activity.rewardRange[1]) +
        skillLevel * 18 +
        Math.floor(Number(summary.level) * 8) +
        Math.floor(state.systems.housing.comfort * 0.6);
      const boostedReward = reward + Math.floor(reward * passiveBonus);
      const xp = this.randomInt(activity.xpRange[0], activity.xpRange[1]) + skillLevel * 4;
      const loot = this.randomInt(activity.lootRange[0], activity.lootRange[1]);
      const bonusKey = this.roll(0.12) ? 1 : 0;

      await this.economyRepository.mutateWallet(actor.id, boostedReward, `${activityKey}_work`, tx);
      await this.userRepository.addXp(actor.id, xp, tx);

      state.systems.work[activity.statKey] += loot;
      state.systems.work.totalShifts += 1;
      state.systems.work[activity.levelKey] = Math.min(
        20,
        1 + Math.floor(state.systems.work[activity.statKey] / 10)
      );
      state.systems.rewards.keys += bonusKey;

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      const refreshed = await this.economyRepository.getSummary(actor.id, tx);
      const nextThreshold = state.systems.work[activity.levelKey] * 10;
      const currentAmount = state.systems.work[activity.statKey];
      const intoTier = currentAmount % 10;

      return {
        title: activityLabel,
        description: this.pick(activityFlavors),
        fields: [
          {
            name: t("expansion.work.fields.payout", {}, { fallback: "Payout" }),
            value: formatCoins(boostedReward),
            inline: true
          },
          {
            name: t("expansion.work.fields.xp", {}, { fallback: "XP" }),
            value: `+${xp}`,
            inline: true
          },
          {
            name: t("expansion.work.fields.loot", {}, { fallback: "Loot" }),
            value: `${loot} ${resourceLabel}`,
            inline: true
          },
          {
            name: t("expansion.work.fields.skillLevel", {}, { fallback: "Skill Level" }),
            value: t(
              "expansion.work.levelValue",
              { level: state.systems.work[activity.levelKey] },
              { fallback: `Lv.${state.systems.work[activity.levelKey]}` }
            ),
            inline: true
          },
          {
            name: t("expansion.work.fields.levelProgress", {}, { fallback: "Level Progress" }),
            value: `${progressBar(intoTier, 10, 8)} ${currentAmount}/${nextThreshold}`,
            inline: true
          },
          {
            name: t("expansion.work.fields.walletNow", {}, { fallback: "Wallet Now" }),
            value: formatCoins(refreshed.wallet),
            inline: true
          }
        ],
        footer: bonusKey
          ? t(
              "expansion.work.footer.bonusKey",
              {},
              { fallback: "Bonus chest key dropped out of the ceiling." }
            )
          : t(
              "expansion.work.footer.default",
              {},
              { fallback: "The grind loop remains delicious." }
            )
      };
    });
  },

  async handleMine(context) {
    return this.performWork(context, "mine");
  },

  async handleHunt(context) {
    return this.performWork(context, "hunt");
  },

  async handleFarm(context) {
    return this.performWork(context, "farm");
  },

  async handleCook(context) {
    return this.performWork(context, "cook");
  },

  async handleDeliver(context) {
    return this.performWork(context, "deliver");
  },

  async handleCrash(context) {
    return this.playWagerGame(context, (ctx, summary, state, t) => {
      const args = this.cleanArgs(ctx.args);
      const bet = this.resolveBet(args, summary.wallet, 120, t);
      const targetMultiplier = this.clamp(Number(args[1] || 1.8), 1.2, 8);
      const crashPoint = Number((1 + Math.random() * 4.2).toFixed(2));
      const won = crashPoint >= targetMultiplier;
      const payout = Math.floor(bet * targetMultiplier);
      const profit = won ? payout - bet : -bet;

      return {
        bet,
        profit,
        reason: won ? "crash_win" : "crash_loss",
        title: t("expansion.crash.title", {}, { fallback: "Crash Chart Meltdown" }),
        description: won
          ? t(
              "expansion.crash.descriptionWin",
              {
                target: targetMultiplier.toFixed(2),
                crash: crashPoint.toFixed(2)
              },
              {
                fallback: `You hopped out at **${targetMultiplier.toFixed(
                  2
                )}x** before the graph exploded at **${crashPoint.toFixed(2)}x**.`
              }
            )
          : t(
              "expansion.crash.descriptionLose",
              {
                target: targetMultiplier.toFixed(2),
                crash: crashPoint.toFixed(2)
              },
              {
                fallback: `You chased **${targetMultiplier.toFixed(
                  2
                )}x**, but the chart imploded at **${crashPoint.toFixed(2)}x** and stole your lunch money.`
              }
            ),
        extraFields: [
          {
            name: t("expansion.crash.fields.crashPoint", {}, { fallback: "Crash Point" }),
            value: `${crashPoint.toFixed(2)}x`,
            inline: true
          },
          {
            name: t("expansion.crash.fields.cashoutTarget", {}, { fallback: "Cashout Target" }),
            value: `${targetMultiplier.toFixed(2)}x`,
            inline: true
          }
        ]
      };
    });
  },

  async handleMines(context) {
    return this.playWagerGame(context, (ctx, summary, state, t) => {
      const args = this.cleanArgs(ctx.args);
      const bet = this.resolveBet(args, summary.wallet, 120, t);
      const safePicks = this.parseCount(args[1], 2, 1, 4, t);
      let remainingTiles = 5;
      const mineCount = safePicks >= 3 ? 2 : 1;
      let survived = true;
      let cleared = 0;

      for (let index = 0; index < safePicks; index += 1) {
        const hitMine = this.roll(mineCount / remainingTiles);
        remainingTiles -= 1;
        if (hitMine) {
          survived = false;
          break;
        }

        cleared += 1;
      }

      const multiplier = 1 + safePicks * 0.55 + mineCount * 0.15;
      const payout = Math.floor(bet * multiplier);
      const profit = survived ? payout - bet : -bet;

      return {
        bet,
        profit,
        reason: survived ? "mines_win" : "mines_loss",
        title: t("expansion.mines.title", {}, { fallback: "Mines Board" }),
        description: survived
          ? t(
              "expansion.mines.descriptionWin",
              { cleared },
              {
                fallback: `You cleared **${cleared}** safe tile(s) and moonwalked away before the board could disrespect you.`
              }
            )
          : t(
              "expansion.mines.descriptionLose",
              { tile: cleared + 1 },
              { fallback: `Tile **${cleared + 1}** was a bomb. The board has no empathy.` }
            ),
        extraFields: [
          {
            name: t("expansion.mines.fields.safePicks", {}, { fallback: "Safe Picks Called" }),
            value: `${safePicks}`,
            inline: true
          },
          {
            name: t("expansion.mines.fields.outcome", {}, { fallback: "Outcome" }),
            value: survived
              ? t(
                  "expansion.mines.outcomePayout",
                  { multiplier: multiplier.toFixed(2) },
                  { fallback: `${multiplier.toFixed(2)}x payout` }
                )
              : t("expansion.mines.outcomeBoom", {}, { fallback: "Boom" }),
            inline: true
          }
        ]
      };
    });
  },

  async handleWheel(context) {
    return this.playWagerGame(context, (ctx, summary, state, t) => {
      const args = this.cleanArgs(ctx.args);
      const bet = this.resolveBet(args, summary.wallet, 100, t);
      const wheel = [
        { key: "void", label: "Void", multiplier: 0 },
        { key: "crumbs", label: "Crumbs", multiplier: 0.5 },
        { key: "even", label: "Even", multiplier: 1 },
        { key: "nice", label: "Nice", multiplier: 1.5 },
        { key: "juicy", label: "Juicy", multiplier: 2.2 },
        { key: "absurd", label: "Absurd", multiplier: 4.5 }
      ];
      const segment = this.pick(wheel);
      const segmentLabel = t(`expansion.wheel.segments.${segment.key}`, {}, { fallback: segment.label });
      const totalReturn = Math.floor(bet * segment.multiplier);
      const profit = totalReturn - bet;

      return {
        bet,
        profit,
        reason: profit >= 0 ? "wheel_win" : "wheel_loss",
        title: t("expansion.wheel.title", {}, { fallback: "Fortune Wheel" }),
        description: t(
          "expansion.wheel.description",
          { segment: segmentLabel },
          { fallback: `The wheel screamed, sparked, and landed on **${segmentLabel}**.` }
        ),
        extraFields: [
          {
            name: t("expansion.wheel.fields.segment", {}, { fallback: "Segment" }),
            value: segmentLabel,
            inline: true
          },
          {
            name: t("expansion.wheel.fields.multiplier", {}, { fallback: "Multiplier" }),
            value: `${segment.multiplier.toFixed(2)}x`,
            inline: true
          }
        ]
      };
    });
  },

  async handlePlinko(context) {
    return this.playWagerGame(context, (ctx, summary, state, t) => {
      const args = this.cleanArgs(ctx.args);
      const bet = this.resolveBet(args, summary.wallet, 100, t);
      const buckets = [
        { multiplier: 0.2, weight: 18 },
        { multiplier: 0.6, weight: 22 },
        { multiplier: 0.9, weight: 20 },
        { multiplier: 1.2, weight: 17 },
        { multiplier: 1.8, weight: 12 },
        { multiplier: 3.5, weight: 8 },
        { multiplier: 8, weight: 3 }
      ];
      const totalWeight = buckets.reduce((sum, bucket) => sum + bucket.weight, 0);
      let rollPoint = this.randomInt(1, totalWeight);
      let chosen = buckets[0];

      for (const bucket of buckets) {
        rollPoint -= bucket.weight;
        if (rollPoint <= 0) {
          chosen = bucket;
          break;
        }
      }

      const totalReturn = Math.floor(bet * chosen.multiplier);
      const profit = totalReturn - bet;

      return {
        bet,
        profit,
        reason: profit >= 0 ? "plinko_win" : "plinko_loss",
        title: t("expansion.plinko.title", {}, { fallback: "Plinko Chaos" }),
        description: t(
          "expansion.plinko.description",
          { multiplier: chosen.multiplier.toFixed(2) },
          {
            fallback: `The chip pinballed through destiny and face-planted into the **${chosen.multiplier.toFixed(
              2
            )}x** bucket.`
          }
        ),
        extraFields: [
          {
            name: t("expansion.plinko.fields.bucket", {}, { fallback: "Bucket" }),
            value: `${chosen.multiplier.toFixed(2)}x`,
            inline: true
          }
        ]
      };
    });
  },

  async handleBaccarat(context) {
    return this.playWagerGame(context, (ctx, summary, state, t) => {
      const args = this.cleanArgs(ctx.args);
      const firstArg = this.normalizeAnswer(args[0] || "");
      const looksNumeric = !Number.isNaN(Number(String(args[0] || "").replace(/,/g, "")));
      const side = looksNumeric || firstArg === "all" || firstArg === "max" ? "banker" : firstArg || "banker";
      const bet = this.resolveBet(
        looksNumeric || firstArg === "all" || firstArg === "max" ? args : args.slice(1),
        summary.wallet,
        140,
        t
      );
      const allowed = new Set(["player", "banker", "tie"]);
      if (!allowed.has(side)) {
        throw new Error(
          t(
            "expansion.baccarat.invalidSide",
            {},
            { fallback: "Choose `player`, `banker`, or `tie`." }
          )
        );
      }

      const playerScore = this.randomInt(0, 9);
      const bankerScore = this.randomInt(0, 9);
      const outcome =
        playerScore === bankerScore ? "tie" : playerScore > bankerScore ? "player" : "banker";
      const sideLabel = t(`expansion.baccarat.sides.${side}`, {}, { fallback: side });
      const outcomeLabel = t(`expansion.baccarat.sides.${outcome}`, {}, { fallback: outcome });
      const multiplier = side === "tie" ? 8 : 1.95;
      const profit = outcome === side ? Math.floor(bet * (multiplier - 1)) : -bet;

      return {
        bet,
        profit,
        reason: outcome === side ? "baccarat_win" : "baccarat_loss",
        title: t("expansion.baccarat.title", {}, { fallback: "Baccarat Table" }),
        description: t(
          "expansion.baccarat.description",
          {
            playerScore,
            bankerScore,
            outcome: outcomeLabel
          },
          {
            fallback: `Player rolled **${playerScore}**, banker rolled **${bankerScore}**. Outcome: **${outcomeLabel}**.`
          }
        ),
        extraFields: [
          {
            name: t("expansion.baccarat.fields.yourPick", {}, { fallback: "Your Pick" }),
            value: sideLabel,
            inline: true
          },
          {
            name: t("expansion.baccarat.fields.payoutRule", {}, { fallback: "Payout Rule" }),
            value:
              outcome === side
                ? `${multiplier}x`
                : t("expansion.baccarat.houseAteIt", {}, { fallback: "House ate it" }),
            inline: true
          }
        ]
      };
    });
  }
};

module.exports = { workGamblingMethods };
