module.exports = {
  name: "error",
  execute(client, error) {
    const message = error?.stack || error?.message || String(error);
    console.error(`[discord:error] ${message}`);
  }
};
