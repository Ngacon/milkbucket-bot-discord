const fs = require("fs");
const { Pool } = require("pg");

class Database {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      min: 1,
      connectionTimeoutMillis: 3_000,
      idleTimeoutMillis: 30_000
    });

    this.pool.on("error", (error) => {
      const message = error?.stack || error?.message || String(error);
      console.error(`[db:pool] ${message}`);
    });
  }

  query(text, params) {
    return this.pool.query(text, params);
  }

  async executeSqlFile(filePath) {
    const sql = fs.readFileSync(filePath, "utf8");
    return this.pool.query(sql);
  }

  async bootstrap({ schemaFile, seedFiles = [] }) {
    await this.executeSqlFile(schemaFile);

    for (const seedFile of seedFiles) {
      await this.executeSqlFile(seedFile);
    }
  }

  async withTransaction(fn) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = { Database };
