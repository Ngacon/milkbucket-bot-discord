const { QUIZ_BANK, FASTTYPE_PHRASES, MARKET_TEMPLATES } = require("../../data/liveGameData");
const { formatCoins } = require("./shared");

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function getQuizPrompt(quiz, language) {
  return isVietnameseLanguage(language) ? quiz.promptVi || quiz.prompt : quiz.prompt;
}

function getQuizHint(quiz, language) {
  return isVietnameseLanguage(language) ? quiz.hintVi || quiz.hint : quiz.hint;
}

function getMarketCopy(language) {
  if (isVietnameseLanguage(language)) {
    return {
      marketTitle: "Chợ Người Chơi",
      marketDescription:
        "Không khí bazaar live-service. Bên trái là listing, bên phải là auction đang chạy, hi vọng scam ở mức tối thiểu.",
      listings: "Danh Sách Rao",
      noListings: "Chưa có listing nào. Dùng `Nsell player <item> <price>`.",
      auctions: "Phiên Đấu Giá",
      nobody: "chưa ai",
      noAuctions: "Chưa có đấu giá nào. Dùng `Nauction start <item> <startBid>`.",
      autoSettled: "Tự Chốt",
      soldExpired: (sold, expired) => `${sold} bán xong / ${expired} hết hạn`,
      sellUsage: "Hiện tại chợ người chơi dùng `Nsell player <tên món> <giá>`.",
      validPrice: "Kết thúc câu lệnh bằng một mức giá hợp lệ đi.",
      listingCreated: "Đã Tạo Listing",
      listingDescription: (title) => `Bạn đã đăng **${title}** lên chợ người chơi.`,
      listingId: "Mã Listing",
      price: "Giá",
      buyUsage: "Dùng `Nbuy player <listingId>` để mua trên chợ.",
      listingGone: "Listing đó biến mất rồi.",
      buyOwnListing: "Tự mua listing của mình là một dạng hoang mang nâng cao.",
      needToBuy: (price) => `Bạn cần ${formatCoins(price)} để mua món đó.`,
      marketPurchase: "Mua Chợ Thành Công",
      purchaseDescription: (title, price) => `Bạn đã mua **${title}** với giá ${formatCoins(price)}.`,
      buyerGoods: "Kho Đồ Người Mua",
      storedGoods: (count) => `${count} món đang giữ`,
      sellerId: "ID Người Bán",
      auctionStartPositive: "Giá mở phiên phải là số dương hợp lệ.",
      auctionStarted: "Đã Mở Đấu Giá",
      auctionStartedDescription: (title) => `Bạn đã mở đấu giá cho **${title}**.`,
      auctionId: "Mã Đấu Giá",
      startingBid: "Giá Khởi Điểm",
      settledEarlier: "Đã Chốt Trước Đó",
      auctionInactive: "Phiên đấu giá đó không còn hoạt động.",
      ownAuctionBid: "Bạn không thể tự bid đấu giá của mình.",
      alreadyTopBid: "Bạn đang là top bid rồi. Để người khác còn có dịp hoảng.",
      minimumBid: (amount) => `Mức bid tối thiểu hợp lệ là ${formatCoins(amount)}.`,
      needWalletBid: (amount) => `Bạn cần ${formatCoins(amount)} trong ví.`,
      bidPlaced: "Đã Đặt Giá",
      bidPlacedDescription: (amount, title) =>
        `Bạn ném ${formatCoins(amount)} vào **${title}** và thách cả server vượt mặt.`,
      previousBid: "Giá Trước Đó",
      auctionBoard: "Bảng Đấu Giá",
      auctionBoardDescription: "Dùng `Nauction start <item> <startBid>` hoặc `Nauction bid <id> <amount>`.",
      activeAuctions: "Đấu Giá Đang Chạy",
      noActiveAuctions: "Chưa có đấu giá nào đang chạy.",
      justSettled: "Vừa Chốt",
      quizTime: "Đố Vui",
      hint: "Gợi Ý",
      answerWith: "Trả Lời Bằng",
      quizExpired: "Câu đố đó hết hạn rồi. Chạy `Nquiz` lại để lấy câu mới.",
      quizSolved: "Giải Đúng",
      quizSolvedDescription: "Chuẩn rồi. Con goblin đố vui đã tạm thời bị bịt miệng.",
      reward: "Thưởng",
      streak: "Chuỗi",
      quizMissed: "Trả Lời Sai",
      quizMissedDescription: (answer) => `Sai rồi. Đáp án đúng là **${answer}**.`,
      streakReset: "Reset về 0",
      fastType: "Gõ Nhanh",
      fastTypeDescription: (phrase) => `Gõ y nguyên câu này: **${phrase}**`,
      submitWith: "Gửi Bằng",
      fastTypeExpired: "Màn gõ nhanh đó hết hạn rồi. Chạy `Nfasttype` lại đi.",
      fastTypeClear: "Gõ Chuẩn",
      fastTypeClearDescription: "Chuẩn từng ký tự. Ngón tay bạn chính thức được tài trợ bởi sự hoảng loạn.",
      fastTypeMiss: "Gõ Trượt",
      fastTypeMissDescription: (phrase) => `Suýt đúng, nhưng cụm chính xác là **${phrase}**.`
    };
  }

  return {
    marketTitle: "Player Market",
    marketDescription:
      "Live-service bazaar energy. Listings on the left, active auctions on the right, scams hopefully minimal.",
    listings: "Listings",
    noListings: "No listings yet. Use `Nsell player <item> <price>`.",
    auctions: "Auctions",
    nobody: "nobody",
    noAuctions: "No active auctions. Use `Nauction start <item> <startBid>`.",
    autoSettled: "Auto Settled",
    soldExpired: (sold, expired) => `${sold} sold / ${expired} expired`,
    sellUsage: "Right now the player market uses `Nsell player <item name> <price>`.",
    validPrice: "End your command with a valid price.",
    listingCreated: "Listing Created",
    listingDescription: (title) => `You listed **${title}** on the player market.`,
    listingId: "Listing ID",
    price: "Price",
    buyUsage: "Use `Nbuy player <listingId>` for market purchases.",
    listingGone: "That listing is gone.",
    buyOwnListing: "Buying your own listing is just advanced confusion.",
    needToBuy: (price) => `You need ${formatCoins(price)} to buy that.`,
    marketPurchase: "Market Purchase",
    purchaseDescription: (title, price) => `You bought **${title}** for ${formatCoins(price)}.`,
    buyerGoods: "Buyer Goods",
    storedGoods: (count) => `${count} stored goods`,
    sellerId: "Seller ID",
    auctionStartPositive: "Auction start bid must be a valid positive number.",
    auctionStarted: "Auction Started",
    auctionStartedDescription: (title) => `You started an auction for **${title}**.`,
    auctionId: "Auction ID",
    startingBid: "Starting Bid",
    settledEarlier: "Settled Earlier",
    auctionInactive: "That auction is not active.",
    ownAuctionBid: "You cannot bid on your own auction.",
    alreadyTopBid: "You already hold the top bid. Let somebody else panic.",
    minimumBid: (amount) => `Minimum valid bid is ${formatCoins(amount)}.`,
    needWalletBid: (amount) => `You need ${formatCoins(amount)} in your wallet.`,
    bidPlaced: "Auction Bid Placed",
    bidPlacedDescription: (amount, title) =>
      `You slapped down ${formatCoins(amount)} on **${title}** and dared the server to top it.`,
    previousBid: "Previous Bid",
    auctionBoard: "Auction Board",
    auctionBoardDescription: "Use `Nauction start <item> <startBid>` or `Nauction bid <id> <amount>`.",
    activeAuctions: "Active Auctions",
    noActiveAuctions: "No active auctions yet.",
    justSettled: "Just Settled",
    quizTime: "Quiz Time",
    hint: "Hint",
    answerWith: "Answer With",
    quizExpired: "That quiz expired. Run `Nquiz` again for a fresh one.",
    quizSolved: "Quiz Solved",
    quizSolvedDescription: "Correct. The trivia goblin has been silenced for now.",
    reward: "Reward",
    streak: "Streak",
    quizMissed: "Quiz Missed",
    quizMissedDescription: (answer) => `Wrong answer. The correct answer was **${answer}**.`,
    streakReset: "Reset to 0",
    fastType: "Fast Type",
    fastTypeDescription: (phrase) => `Type this exactly: **${phrase}**`,
    submitWith: "Submit With",
    fastTypeExpired: "That fast type prompt expired. Run `Nfasttype` again.",
    fastTypeClear: "Fast Type Clear",
    fastTypeClearDescription: "Perfect copy. Your fingers are officially sponsored by panic.",
    fastTypeMiss: "Fast Type Miss",
    fastTypeMissDescription: (phrase) => `Close, but the phrase was **${phrase}**.`
  };
}

const marketMinigameMethods = {
  async handleMarket(context) {
    return this.db.withTransaction(async (tx) => {
      const language = this.resolveLanguage(context);
      const copy = getMarketCopy(language);
      const settled = await this.settleExpiredAuctions(tx);
      const listings = await this.marketRepository.listActiveListings(8, tx);
      const auctions = await this.marketRepository.listActiveAuctions(5, tx);

      return {
        title: copy.marketTitle,
        description: copy.marketDescription,
        fields: [
          {
            name: copy.listings,
            value: listings.length
              ? listings
                  .map(
                    (listing) =>
                      `#${listing.id} ${listing.title} - ${formatCoins(listing.price)} by ${listing.seller_name}`
                  )
                  .join("\n")
              : copy.noListings,
            inline: false
          },
          {
            name: copy.auctions,
            value: auctions.length
              ? auctions
                  .map(
                    (auction) =>
                      `#${auction.id} ${auction.title} - bid ${formatCoins(auction.current_bid)} by ${
                        auction.bidder_name || copy.nobody
                      }`
                  )
                  .join("\n")
              : copy.noAuctions,
            inline: false
          },
          {
            name: copy.autoSettled,
            value: copy.soldExpired(settled.sold, settled.expired),
            inline: true
          }
        ]
      };
    });
  },

  async handleSell(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, state);
      const copy = getMarketCopy(language);
      const args = this.cleanArgs(context.args);
      const category = this.normalizeAnswer(args[0] || "");
      if (category !== "player") {
        throw new Error(copy.sellUsage);
      }

      const price = this.parseAmount(args[args.length - 1], 0, Number.MAX_SAFE_INTEGER);
      if (price <= 0) {
        throw new Error(copy.validPrice);
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
        title: copy.listingCreated,
        description: copy.listingDescription(title),
        fields: [
          {
            name: copy.listingId,
            value: `#${listing.id}`,
            inline: true
          },
          {
            name: copy.price,
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
      const { actor, summary, state } = await this.getActorBundle(context, tx);
      const language = this.resolveLanguage(context, state);
      const copy = getMarketCopy(language);
      if (category !== "player") {
        throw new Error(copy.buyUsage);
      }

      const listingId = this.parseCount(args[1], 0, 1, Number.MAX_SAFE_INTEGER);
      const listing = await this.marketRepository.getListingById(listingId, tx, { forUpdate: true });

      if (!listing || !listing.active) {
        throw new Error(copy.listingGone);
      }

      if (Number(listing.seller_user_id) === Number(actor.id)) {
        throw new Error(copy.buyOwnListing);
      }

      if (Number(summary.wallet) < Number(listing.price)) {
        throw new Error(copy.needToBuy(listing.price));
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
      await this.playerStateRepository.saveState(
        Number(listing.seller_user_id),
        sellerState.systems,
        sellerState.settings,
        tx
      );

      return {
        title: copy.marketPurchase,
        description: copy.purchaseDescription(listing.title, listing.price),
        fields: [
          {
            name: copy.buyerGoods,
            value: copy.storedGoods(buyerState.systems.market.ownedGoods.length),
            inline: true
          },
          {
            name: copy.sellerId,
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
      const language = this.resolveLanguage(context);
      const copy = getMarketCopy(language);
      const settled = await this.settleExpiredAuctions(tx);

      if (subcommand === "start" || subcommand === "create") {
        const { actor, state } = await this.getActorBundle(context, tx);
        const activeLanguage = this.resolveLanguage(context, state);
        const activeCopy = getMarketCopy(activeLanguage);
        const startingBid = this.parseAmount(args[args.length - 1], 0, Number.MAX_SAFE_INTEGER);
        if (startingBid <= 0) {
          throw new Error(activeCopy.auctionStartPositive);
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
          title: activeCopy.auctionStarted,
          description: activeCopy.auctionStartedDescription(title),
          fields: [
            {
              name: activeCopy.auctionId,
              value: `#${auction.id}`,
              inline: true
            },
            {
              name: activeCopy.startingBid,
              value: formatCoins(startingBid),
              inline: true
            },
            {
              name: activeCopy.settledEarlier,
              value: activeCopy.soldExpired(settled.sold, settled.expired),
              inline: true
            }
          ]
        };
      }

      if (subcommand === "bid") {
        const auctionId = this.parseCount(args[1], 0, 1, Number.MAX_SAFE_INTEGER);
        const bidAmount = this.parseAmount(args[2], 0, Number.MAX_SAFE_INTEGER);
        const { actor, summary, state } = await this.getActorBundle(context, tx);
        const activeLanguage = this.resolveLanguage(context, state);
        const activeCopy = getMarketCopy(activeLanguage);
        const auction = await this.marketRepository.getAuctionById(auctionId, tx, { forUpdate: true });

        if (!auction || auction.status !== "active") {
          throw new Error(activeCopy.auctionInactive);
        }

        if (Number(auction.seller_user_id) === Number(actor.id)) {
          throw new Error(activeCopy.ownAuctionBid);
        }

        if (Number(auction.current_bidder_user_id || 0) === Number(actor.id)) {
          throw new Error(activeCopy.alreadyTopBid);
        }

        const minimumBid = auction.current_bidder_user_id
          ? Number(auction.current_bid) + 100
          : Number(auction.starting_bid);
        if (bidAmount < minimumBid) {
          throw new Error(activeCopy.minimumBid(minimumBid));
        }

        if (Number(summary.wallet) < bidAmount) {
          throw new Error(activeCopy.needWalletBid(bidAmount));
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
          title: activeCopy.bidPlaced,
          description: activeCopy.bidPlacedDescription(bidAmount, auction.title),
          fields: [
            {
              name: activeCopy.auctionId,
              value: `#${auctionId}`,
              inline: true
            },
            {
              name: activeCopy.previousBid,
              value: formatCoins(auction.current_bid),
              inline: true
            }
          ]
        };
      }

      const auctions = await this.marketRepository.listActiveAuctions(8, tx);
      return {
        title: copy.auctionBoard,
        description: copy.auctionBoardDescription,
        fields: [
          {
            name: copy.activeAuctions,
            value: auctions.length
              ? auctions
                  .map(
                    (auction) =>
                      `#${auction.id} ${auction.title} - ${formatCoins(auction.current_bid)} by ${
                        auction.bidder_name || copy.nobody
                      }`
                  )
                  .join("\n")
              : copy.noActiveAuctions,
            inline: false
          },
          {
            name: copy.justSettled,
            value: copy.soldExpired(settled.sold, settled.expired),
            inline: true
          }
        ]
      };
    });
  },

  async handleQuiz(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const copy = getMarketCopy(language);
      const answer = this.cleanArgs(context.args).join(" ").trim();
      const pending = state.systems.minigames.pendingQuiz;

      if (!pending || !answer) {
        const quiz = this.pick(QUIZ_BANK);
        const prompt = getQuizPrompt(quiz, language);
        const hint = getQuizHint(quiz, language);
        state.systems.minigames.pendingQuiz = {
          answer: quiz.answer,
          prompt,
          hint,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        };
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: copy.quizTime,
          description: prompt,
          fields: [
            {
              name: copy.hint,
              value: hint,
              inline: false
            },
            {
              name: copy.answerWith,
              value: "`Nquiz <answer>`",
              inline: false
            }
          ]
        };
      }

      if (new Date(pending.expiresAt).getTime() < Date.now()) {
        state.systems.minigames.pendingQuiz = null;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
        throw new Error(copy.quizExpired);
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
          title: copy.quizSolved,
          description: copy.quizSolvedDescription,
          fields: [
            {
              name: copy.reward,
              value: formatCoins(reward),
              inline: true
            },
            {
              name: copy.streak,
              value: `${state.systems.minigames.streak}`,
              inline: true
            }
          ]
        };
      }

      state.systems.minigames.streak = 0;
      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

      return {
        title: copy.quizMissed,
        description: copy.quizMissedDescription(pending.answer),
        fields: [
          {
            name: copy.streak,
            value: copy.streakReset,
            inline: true
          }
        ]
      };
    });
  },

  async handleFasttype(context) {
    return this.db.withTransaction(async (tx) => {
      const { actor, state } = await this.getActorBundle(context, tx, { forUpdate: true });
      const language = this.resolveLanguage(context, state);
      const copy = getMarketCopy(language);
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
          title: copy.fastType,
          description: copy.fastTypeDescription(phrase),
          fields: [
            {
              name: copy.submitWith,
              value: "`Nfasttype <phrase>`",
              inline: false
            }
          ]
        };
      }

      if (new Date(pending.expiresAt).getTime() < Date.now()) {
        state.systems.minigames.pendingFasttype = null;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
        throw new Error(copy.fastTypeExpired);
      }

      const correct = input === pending.phrase;
      state.systems.minigames.pendingFasttype = null;

      if (correct) {
        const reward = 260 + state.systems.minigames.fasttypeWins * 20;
        await this.economyRepository.mutateWallet(actor.id, reward, "fasttype_win", tx);
        state.systems.minigames.fasttypeWins += 1;
        await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);

        return {
          title: copy.fastTypeClear,
          description: copy.fastTypeClearDescription,
          fields: [
            {
              name: copy.reward,
              value: formatCoins(reward),
              inline: true
            }
          ]
        };
      }

      await this.playerStateRepository.saveState(actor.id, state.systems, state.settings, tx);
      return {
        title: copy.fastTypeMiss,
        description: copy.fastTypeMissDescription(pending.phrase),
        fields: []
      };
    });
  }
};

module.exports = { marketMinigameMethods };
