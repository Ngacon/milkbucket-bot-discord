const { sharedMethods } = require("./expansion/shared");
const { economyMethods } = require("./expansion/economy");
const { workGamblingMethods } = require("./expansion/workGambling");
const { fishingIslandPetMethods } = require("./expansion/fishingIslandPet");
const { socialHousingCrimeMethods } = require("./expansion/socialHousingCrime");
const { marketMinigameMethods } = require("./expansion/marketMinigames");
const { worldRewardsUtilityMethods } = require("./expansion/worldRewardsUtility");
const { petSystemMethods } = require("./expansion/petSystem");

class ExpansionService {
  constructor({
    db,
    profileService,
    userRepository,
    economyRepository,
    inventoryRepository,
    fishRepository,
    playerStateRepository,
    worldStateRepository,
    marketRepository
  }) {
    this.db = db;
    this.profileService = profileService;
    this.userRepository = userRepository;
    this.economyRepository = economyRepository;
    this.inventoryRepository = inventoryRepository;
    this.fishRepository = fishRepository;
    this.playerStateRepository = playerStateRepository;
    this.worldStateRepository = worldStateRepository;
    this.marketRepository = marketRepository;
  }
}

Object.assign(
  ExpansionService.prototype,
  sharedMethods,
  economyMethods,
  workGamblingMethods,
  fishingIslandPetMethods,
  socialHousingCrimeMethods,
  marketMinigameMethods,
  worldRewardsUtilityMethods,
  petSystemMethods
);

module.exports = { ExpansionService };
