const { QUIZ_BANK, FASTTYPE_PHRASES, MARKET_TEMPLATES } = require("../../data/liveGameData");
const { ZONES, formatCoins } = require("./shared");

const marketMinigameMethods = {
  async handleMarket(context) {
    return this.db.withTransaction(async (tx) => {
      const settled = await this.settleExpiredAuctions(tx);
      const listings = await this.marketRepository.listActiveListings(8, tx);
      const auctions = await this.marketRepository.listActiveAuctions(5, tx);

      return {
        title: "Player Market",
        description: "Live-service bazaar energy. Listings on the left, active auctions on the right, scams hopefully minimal.",
        fields: [
          {
            name: "Listings",
            value: listings.length
              ? listings
                  .map(
                    (listing) =>
                      `#${listing.id} ${listing.title} - ${formatCoins(listing.price)} by ${listing.seller_name}`
                  )
                  .join("\n")
              : "No listings yet. Use `Nsell player <item> <price>`.",
            inline: false
          },
          {
            name: "Auctions",
            value: auctions.length
              ? auctions
                  .map(
                    (auction) =>
                      `#${auction.id} ${auction.title} - bid ${formatCoins(auction.current_bid)} by ${
                        auction.bidder_name || "nobody"
                      }`
                  )
                  .join("\n")
              : "No active auctions. Use `Nauction start <item> <startBid>`.",
            inline: false
          },
          {
            name: "Auto Settled",
            value: `${settled.sold} sold / ${settled.expired} expired`,
            inline: true
          }
        ]
      };
    });
  },

  async handleSell(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor } = await this.getActorBundle(context, tx);
      const args = this.cleanArgs(context.args);
      const category = this.normalizeAnswer(args[0] || "");
      if (category !== "player") {
        throw new Error("Right now the player market uses `Nsell player <item name> <price>`.");
      }

      const price = this.parseAmount(args[args.length - 1], 0, Number.MAX_SAFE_INTEGER);
      if (price <= 0) {
        throw new Error("End your command with a valid price.");
      }

      const titleTokens = args.slice(1, -1);
      const title = titleTokens.length ? titleTokens.join(" ") : this.pick(MARKET_TEMPLATES);
      const listing = await this.marketRepository.createListing(
        {
          sellerUserId: actor.id,
          listingKey: `player-${Date.now()}-${this.randomInt(100, 999)}`,
          title,
          category: "player",
          price,
          stock: 1,
          payload: {
            rarity_hint: this.pick(["common", "rare", "epic"])
          }
        },
        tx
      );

      return {
        title: "Listing Created",
        description: `You listed **${title}** on the player market.`,
        fields: [
          {
            name: "Listing ID",
            value: `#${listing.id}`,
            inline: true
          },
          {
            name: "Price",
            value: formatCoins(price),
            inline: true
          }
        ]
      };
    });
  },

  async handleBuy(context) {
    return this.db.withTransaction(async (tx) => {
      const args = this.cleanArgs(context.args);
      const category = this.normalizeAnswer(args[0] || "");
      if (category !== "player") {
        throw new Error("Use `Nbuy player <listingId>` for market purchases.");
      }

      const listingId = this.parseCount(args[1], 0, 1, Number.MAX_SAFE_INTEGER);
      const { actor, summary } = await this.getActorBundle(context, tx);
      const listing = await this.marketRepository.getListingById(listingId, tx, { forUpdate: true });

      if (!listing || !listing.active) {
        throw new Error("That listing is gone.");
      }

      if (Number(listing.seller_user_id) === Number(actor.id)) {
        throw new Error("Buying your own listing is just advanced confusion.");
      }

      if (Number(summary.wallet) < Number(listing.price)) {
        throw new Error(`You need ${formatCoins(listing.price)} to buy that.`);
      }

      const states = await this.playerStateRepository.getStates([actor.id, listing.seller_user_id], tx, {
        forUpdate: true
      });
      const stateMap = new Map(states.map((entry) => [Number(entry.user_id), entry]));
      const buyerState = stateMap.get(Number(actor.id));
      const sellerState = stateMap.get(Number(listing.seller_user_id));

      await this.economyRepository.mutateWallet(actor.id, -Number(listing.price), "market_buy", tx);
      await this.economyRepository.mutateWallet(listing.seller_user_id, Number(listing.price), "market_sale", tx);
      await this.marketRepository.completeListing(listing.id, tx);

      buyerState.systems.market.purchases += 1;
      sellerState.systems.market.sales += 1;
      this.pushOwnedGood(buyerState, listing.title);

      await this.playerStateRepository.saveState(actor.id, buyerState.systems, buyerState.settings, tx);
      await this.playerStateRepository.saveState(Number(listing.seller_user_id), sellerState.systems, sellerState.settings, tx);

      return {
        title: "Market Purchase",
        description: `You bought **${listing.title}** for ${formatCoins(listing.price)}.`,
        fields: [
          {
            name: "Buyer Goods",
            value: `${buyerState.systems.market.ownedGoods.length} stored goods`,
            inline: true
          },
          {
            name: "Seller ID",
            value: `${listing.seller_user_id}`,
            inline: true
          }
        ]
      };
    });
  },

  async handleAuction(context) {
    return this.db.withTransaction(async (tx) => {
      const args = this.cleanArgs(context.args);
      const subcommand = this.normalizeAnswer(args[0] || "view");
      const settled = await this.settleExpiredAuctions(tx);

      if (subcommand === "start" || subcommand === "create") {
        const { actor } = await this.getActorBundle(context, tx);
        const startingBid = this.parseAmount(args[args.length - 1], 0, Number.MAX_SAFE_INTEGER);
        if (startingBid <= 0) {
          throw new Error("Auction start bid must be a valid positive number.");
        }

        const title = args.slice(1, -1).join(" ").trim() || this.pick(MARKET_TEMPLATES);
        const endsAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        const auction = await this.marketRepository.createAuction(
          {
            sellerUserId: actor.id,
            title,
            category: "player",
            startingBid,
            endsAt
          },
          tx
        );

        return {
          title: "Auction Started",
          description: `You started an auction for **${title}**.`,
          fields: [
            {
              name: "Auction ID",
              value: `#${auction.id}`,
              inline: true
            },
            {
              name: "Starting Bid",
              value: formatCoins(startingBid),
              inline: true
            },
            {
              name: "Settled Earlier",
              value: `${settled.sold} sold / ${settled.expired} expired`,
              inline: true
            }
          ]
        };
      }

      if (subcommand === "bid") {
        const auctionId = this.parseCount(args[1], 0, 1, Number.MAX_SAFE_INTEGER);
        const bidAmount = this.parseAmount(args[2], 0, Number.MAX_SAFE_INTEGER);
        const { actor, summary } = await this.getActorBundle(context, tx);
        const auction = await this.marketRepository.getAuctionById(auctionId, tx, { forUpdate: true });

        if (!auction || auction.status !== "active") {
          throw new Error("That auction is not active.");
        }

        if (Number(auction.seller_user_id) === Number(actor.id)) {
          throw new Error("You cannot bid on your own auction.");
        }

        if (Number(auction.current_bidder_user_id || 0) === Number(actor.id)) {
          throw new Error("You already hold the top bid. Let somebody else panic.");
        }

        const minimumBid = auction.current_bidder_user_id
          ? Number(auction.current_bid) + 100
          : Number(auction.starting_bid);
        if (bidAmount < minimumBid) {
          throw new Error(`Minimum valid bid is ${formatCoins(minimumBid)}.`);
        }

        if (Number(summary.wallet) < bidAmount) {
          throw new Error(`You need ${formatCoins(bidAmount)} in your wallet.`);
        }

        await this.economyRepository.mutateWallet(actor.id, -bidAmount, "auction_bid_hold", tx);
        if (auction.current_bidder_user_id) {
          await this.economyRepository.mutateWallet(
            auction.current_bidder_user_id,
            Number(auction.current_bid),
            "auction_bid_refund",
            tx
          );
        }

        await this.marketRepository.placeBid(auctionId, actor.id, bidAmount, tx);

        return {
          title: "Auction Bid Placed",
          description: `You slapped down ${formatCoins(bidAmount)} on **${auction.title}** and dared the server to top it.`,
          fields: [
            {
              name: "Auction ID",
              value: `#${auctionId}`,
              inline: true
            },
            {
              name: "Previous Bid",
              value: formatCoins(auction.current_bid),
              inline: true
            }
          ]
        };
      }

      const auctions = await this.marketRepository.listActiveAuctions(8, tx);
      return {
        title: "Auction Board",
        description: "Use `Nauction start <item> <startBid>` or `Nauction bid <id> <amount>`.",
        fields: [
          {
            name: "Active Auctions",
            value: auctions.length
              ? auctions
                  .map(
                    (auction) =>
                      `#${auction.id} ${auction.title} - ${formatCoins(auction.current_bid)} by ${
                        auction.bidder_name || "nobody"
                      }`
                  )
                  .join("\n")
              : "No active auctions yet.",
            inline: false
          },
          {
            name: "Just Settled",
            value: `${settled.sold} sold / ${settled.expired} expired`,
            inline: true
          }
        ]
      };
    });
  },

  async handleQuiz(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const answer = this.cleanArgs(context.args).join(" ").trim();
      const pending = state.systems.minigames.pendingQuiz;

      if (!pending || !answer) {
        const quiz = this.pick(QUIZ_BANK);
        state.systems.minigames.pendingQuiz = {
          answer: quiz.answer,
          prompt: quiz.prompt,
          hint: quiz.hint,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        };
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Quiz Time",
          description: quiz.prompt,
          fields: [
            {
              name: "Hint",
              value: quiz.hint,
              inline: false
            },
            {
              name: "Answer With",
              value: "`Nquiz <answer>`",
              inline: false
            }
          ]
        };
      }

      if (new Date(pending.expiresAt).getTime() < Date.now()) {
        state.systems.minigames.pendingQuiz = null;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
        throw new Error("That quiz expired. Run `Nquiz` again for a fresh one.");
      }

      const correct = this.normalizeAnswer(answer) === this.normalizeAnswer(pending.answer);
      state.systems.minigames.pendingQuiz = null;

      if (correct) {
        const reward = 220 + state.systems.minigames.streak * 25;
        await this.economyRepository.mutateWallet(actor.id, reward, "quiz_win", tx);
        state.systems.minigames.quizWins += 1;
        state.systems.minigames.streak += 1;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Quiz Solved",
          description: "Correct. The trivia goblin has been silenced for now.",
          fields: [
            {
              name: "Reward",
              value: formatCoins(reward),
              inline: true
            },
            {
              name: "Streak",
              value: `${state.systems.minigames.streak}`,
              inline: true
            }
          ]
        };
      }

      state.systems.minigames.streak = 0;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: "Quiz Missed",
        description: `Wrong answer. The correct answer was **${pending.answer}**.`,
        fields: [
          {
            name: "Streak",
            value: "Reset to 0",
            inline: true
          }
        ]
      };
    });
  },

  async handleFasttype(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const input = this.cleanArgs(context.args).join(" ").trim();
      const pending = state.systems.minigames.pendingFasttype;

      if (!pending || !input) {
        const phrase = this.pick(FASTTYPE_PHRASES);
        state.systems.minigames.pendingFasttype = {
          phrase,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Fast Type",
          description: `Type this exactly: **${phrase}**`,
          fields: [
            {
              name: "Submit With",
              value: "`Nfasttype <phrase>`",
              inline: false
            }
          ]
        };
      }

      if (new Date(pending.expiresAt).getTime() < Date.now()) {
        state.systems.minigames.pendingFasttype = null;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
        throw new Error("That fast type prompt expired. Run `Nfasttype` again.");
      }

      const correct = input === pending.phrase;
      state.systems.minigames.pendingFasttype = null;

      if (correct) {
        const reward = 260 + state.systems.minigames.fasttypeWins * 20;
        await this.economyRepository.mutateWallet(actor.id, reward, "fasttype_win", tx);
        state.systems.minigames.fasttypeWins += 1;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: "Fast Type Clear",
          description: "Perfect copy. Your fingers are officially sponsored by panic.",
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
        title: "Fast Type Miss",
        description: `Close, but the phrase was **${pending.phrase}**.`,
        fields: []
      };
    });
  }
};

module.exports = { marketMinigameMethods };
