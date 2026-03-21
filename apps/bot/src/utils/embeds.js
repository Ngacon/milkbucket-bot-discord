const { EmbedBuilder } = require("discord.js");

function createGameEmbed(title, color) {
  return new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
}

module.exports = { createGameEmbed };

