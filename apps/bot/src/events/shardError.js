module.exports = {
  name: "shardError",
  execute(client, error, shardId) {
    const message = error?.stack || error?.message || String(error);
    console.error(`[discord:shard:${shardId ?? "unknown"}] ${message}`);
  }
};
