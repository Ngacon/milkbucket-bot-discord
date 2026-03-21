const { formatCoins } = require("../utils/formatters");

class RandomEventService {
  constructor({ chaosChance, ambientChance, profileService, economyRepository }) {
    this.chaosChance = chaosChance;
    this.ambientChance = ambientChance;
    this.profileService = profileService;
    this.economyRepository = economyRepository;
  }

  roll(chance) {
    return Math.random() < chance;
  }

  async tryAmbientTrigger(message) {
    if (!message.guild || !this.roll(this.ambientChance)) {
      return;
    }

    const options = [
      async () => {
        const bonus = 25 + Math.floor(Math.random() * 75);
        const profile = await this.profileService.resolveByDiscordUser(message.author);
        await this.economyRepository.mutateWallet(profile.id, bonus, "money_rain");
        await message.channel.send(
          `🌧️💸 **Money Rain!** ${message.author} got splashed with ${formatCoins(
            bonus
          )}. The sky remains financially irresponsible.`
        );
      },
      async () => {
        await message.channel.send(
          "🥚 A hidden easter egg wiggles in the walls... but vanishes before anyone can screenshot it."
        );
      },
      async () => {
        await message.channel.send(
          "🗣️ Rare meme omen: `bro just one more gamble` echoes through the channel."
        );
      }
    ];

    const event = options[Math.floor(Math.random() * options.length)];
    await event();
  }

  async tryPostCommandTrigger(message) {
    if (!this.roll(this.chaosChance)) {
      return;
    }

    const options = [
      async () => {
        const fee = 10 + Math.floor(Math.random() * 50);
        const profile = await this.profileService.resolveByDiscordUser(message.author);
        const result = await this.economyRepository.mutateWallet(profile.id, -fee, "tax_event");
        if (result.appliedDelta === 0) {
          return;
        }

        await message.reply(
          `💀 **Chaotic tax goblin** appeared and yoinked ${formatCoins(
            Math.abs(result.appliedDelta)
          )} from your wallet.`
        );
      },
      async () => {
        await message.reply("✨ Jackpot fish energy is in the air. The ocean is plotting something huge.");
      }
    ];

    const event = options[Math.floor(Math.random() * options.length)];
    await event();
  }
}

module.exports = { RandomEventService };

