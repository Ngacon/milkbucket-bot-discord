const { createGameEmbed } = require("../../utils/embeds");

function createExpansionCommand({ name, aliases = [], description, cooldownMs = 4_000, handler }) {
  return {
    name,
    aliases,
    description,
    cooldownMs,
    async execute(context) {
      const result = await context.services.expansionService[handler](context);
      if (!result) {
        return;
      }

      if (result.content) {
        await context.message.reply(result.content);
        return;
      }

      const embed = createGameEmbed(result.title || `N${name}`, context.config.embedColor);

      if (result.description) {
        embed.setDescription(result.description);
      }

      if (Array.isArray(result.fields) && result.fields.length) {
        embed.addFields(result.fields);
      }

      if (result.footer) {
        embed.setFooter({ text: result.footer });
      }

      await context.message.reply({ embeds: [embed] });
    }
  };
}

module.exports = { createExpansionCommand };
