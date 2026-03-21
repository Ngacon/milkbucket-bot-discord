module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`[bot] Logged in as ${client.user.tag}`);
  }
};
