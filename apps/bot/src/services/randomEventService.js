const { formatCoins } = require("../utils/formatters");

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

class RandomEventService {
  constructor({ chaosChance, ambientChance, profileService, economyRepository, playerStateRepository }) {
    this.chaosChance = chaosChance;
    this.ambientChance = ambientChance;
    this.profileService = profileService;
    this.economyRepository = economyRepository;
    this.playerStateRepository = playerStateRepository;
  }

  roll(chance) {
    return Math.random() < chance;
  }

  async getLanguageForProfile(profile) {
    if (!this.playerStateRepository) {
      return "en";
    }

    const state = await this.playerStateRepository.getState(profile.id);
    return state?.settings?.language || "en";
  }

  async tryAmbientTrigger(message) {
    if (!message.guild || !this.roll(this.ambientChance)) {
      return;
    }

    const options = [
      async () => {
        const bonus = 25 + Math.floor(Math.random() * 75);
        const profile = await this.profileService.resolveByDiscordUser(message.author);
        const language = await this.getLanguageForProfile(profile);
        const vi = isVietnameseLanguage(language);
        await this.economyRepository.mutateWallet(profile.id, bonus, "money_rain");
        await message.channel.send(
          vi
            ? `🌧️💸 **Mưa Tiền!** ${message.author} vừa bị tạt trúng ${formatCoins(
                bonus
              )}. Bầu trời vẫn tiêu tiền rất thiếu trách nhiệm.`
            : `🌧️💸 **Money Rain!** ${message.author} got splashed with ${formatCoins(
                bonus
              )}. The sky remains financially irresponsible.`
        );
      },
      async () => {
        const profile = await this.profileService.resolveByDiscordUser(message.author);
        const language = await this.getLanguageForProfile(profile);
        await message.channel.send(
          isVietnameseLanguage(language)
            ? "🥚 Một easter egg bí mật vừa ngọ nguậy trong tường... rồi biến mất trước khi ai kịp chụp màn hình."
            : "🥚 A hidden easter egg wiggles in the walls... but vanishes before anyone can screenshot it."
        );
      },
      async () => {
        const profile = await this.profileService.resolveByDiscordUser(message.author);
        const language = await this.getLanguageForProfile(profile);
        await message.channel.send(
          isVietnameseLanguage(language)
            ? "🗣️ Điềm meme hiếm xuất hiện: `bro just one more gamble` vang vọng khắp kênh chat."
            : "🗣️ Rare meme omen: `bro just one more gamble` echoes through the channel."
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
        const language = await this.getLanguageForProfile(profile);
        const vi = isVietnameseLanguage(language);
        const result = await this.economyRepository.mutateWallet(profile.id, -fee, "tax_event");
        if (result.appliedDelta === 0) {
          return;
        }

        await message.reply(
          vi
            ? `💀 **Goblin thuế hỗn loạn** vừa xuất hiện và bốc luôn ${formatCoins(
                Math.abs(result.appliedDelta)
              )} khỏi ví của bạn.`
            : `💀 **Chaotic tax goblin** appeared and yoinked ${formatCoins(
                Math.abs(result.appliedDelta)
              )} from your wallet.`
        );
      },
      async () => {
        const profile = await this.profileService.resolveByDiscordUser(message.author);
        const language = await this.getLanguageForProfile(profile);
        await message.reply(
          isVietnameseLanguage(language)
            ? "✨ Năng lượng jackpot fish đang tràn trong không khí. Đại dương sắp bày trò lớn."
            : "✨ Jackpot fish energy is in the air. The ocean is plotting something huge."
        );
      }
    ];

    const event = options[Math.floor(Math.random() * options.length)];
    await event();
  }
}

module.exports = { RandomEventService };

