class MarketRepository {
  constructor(db) {
    this.db = db;
  }

  runner(executor) {
    return executor || this.db;
  }

  async createListing(listing, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        INSERT INTO market_listings (
          seller_user_id,
          listing_key,
          title,
          category,
          price,
          stock,
          payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        RETURNING *
      `,
      [
        listing.sellerUserId,
        listing.listingKey,
        listing.title,
        listing.category,
        listing.price,
        listing.stock || 1,
        JSON.stringify(listing.payload || {})
      ]
    );

    return rows[0];
  }

  async listActiveListings(limit = 12, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          ml.*,
          u.username AS seller_name
        FROM market_listings ml
        INNER JOIN users u ON u.id = ml.seller_user_id
        WHERE ml.active = TRUE
        ORDER BY ml.created_at DESC
        LIMIT $1
      `,
      [limit]
    );

    return rows;
  }

  async getListingById(listingId, executor, options = {}) {
    const queryable = this.runner(executor);
    const lockingClause = options.forUpdate ? "FOR UPDATE" : "";
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM market_listings
        WHERE id = $1
        ${lockingClause}
      `,
      [listingId]
    );

    return rows[0] || null;
  }

  async completeListing(listingId, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        UPDATE market_listings
        SET active = FALSE,
            stock = 0,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [listingId]
    );

    return rows[0] || null;
  }

  async createAuction(auction, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        INSERT INTO market_auctions (
          seller_user_id,
          title,
          category,
          starting_bid,
          current_bid,
          payload,
          ends_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        RETURNING *
      `,
      [
        auction.sellerUserId,
        auction.title,
        auction.category,
        auction.startingBid,
        auction.currentBid || auction.startingBid,
        JSON.stringify(auction.payload || {}),
        auction.endsAt
      ]
    );

    return rows[0];
  }

  async listActiveAuctions(limit = 8, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT
          ma.*,
          seller.username AS seller_name,
          bidder.username AS bidder_name
        FROM market_auctions ma
        INNER JOIN users seller ON seller.id = ma.seller_user_id
        LEFT JOIN users bidder ON bidder.id = ma.current_bidder_user_id
        WHERE ma.status = 'active'
        ORDER BY ma.ends_at ASC
        LIMIT $1
      `,
      [limit]
    );

    return rows;
  }

  async getAuctionById(auctionId, executor, options = {}) {
    const queryable = this.runner(executor);
    const lockingClause = options.forUpdate ? "FOR UPDATE" : "";
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM market_auctions
        WHERE id = $1
        ${lockingClause}
      `,
      [auctionId]
    );

    return rows[0] || null;
  }

  async listExpiredAuctions(executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        SELECT *
        FROM market_auctions
        WHERE status = 'active'
          AND ends_at <= NOW()
        ORDER BY ends_at ASC
      `
    );

    return rows;
  }

  async placeBid(auctionId, bidderUserId, bidAmount, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        UPDATE market_auctions
        SET current_bid = $3,
            current_bidder_user_id = $2
        WHERE id = $1
        RETURNING *
      `,
      [auctionId, bidderUserId, bidAmount]
    );

    return rows[0] || null;
  }

  async finalizeAuction(auctionId, status, executor) {
    const queryable = this.runner(executor);
    const { rows } = await queryable.query(
      `
        UPDATE market_auctions
        SET status = $2
        WHERE id = $1
        RETURNING *
      `,
      [auctionId, status]
    );

    return rows[0] || null;
  }
}

module.exports = { MarketRepository };
