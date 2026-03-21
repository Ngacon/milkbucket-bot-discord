const { FISHING_MAPS, FISHING_MAPS_BY_KEY, resolveFishingMapKey } = require("../data/fishingMaps");
const { buildFishingResult } = require("./fishingEngine");
const {
  applyPetDecayToState,
  getActivePet,
  getAbilityProfile,
  syncLegacyPetSummary,
  grantPetXp,
  calculatePetPassiveBonus
} = require("./expansion/petEngine");

const CACHE_TTL_MS = 25 * 1000;
const LEADERBOARD_TTL_MS = 30 * 1000;

function isVietnameseLanguage(language) {
  return String(language || "").toLowerCase().startsWith("vi");
}

function getFishingCopy(language) {
  if (isVietnameseLanguage(language)) {
    return {
      unknownMap: (mapKey) => `Không tìm thấy bản đồ câu cá: ${mapKey}`,
      noRod: "Bạn chưa trang bị cần câu. Sự nghiệp câu cá hiện chỉ là nhìn mặt nước thật căng.",
      brokenRod: "Cần câu của bạn gãy đôi rồi. Sửa nó trước khi tiếp tục quậy đại dương.",
      levelGate: (unlockLevel, label) => `Bạn cần đạt level ${unlockLevel} để câu ở ${label}.`
    };
  }

  return {
    unknownMap: (mapKey) => `Unknown fishing map: ${mapKey}`,
    noRod: "No rod equipped. Your fish career is currently just intense staring.",
    brokenRod: "Your rod is snapped in half. Repair it before bullying the ocean.",
    levelGate: (unlockLevel, label) => `You need to be level ${unlockLevel} to fish in ${label}.`
  };
}

class FishingService {
  constructor({
    db,
    apiClient,
    userRepository,
    economyRepository,
    inventoryRepository,
    fishRepository,
    playerStateRepository
  }) {
    this.db = db;
    this.apiClient = apiClient;
    this.userRepository = userRepository;
    this.economyRepository = economyRepository;
    this.inventoryRepository = inventoryRepository;
    this.fishRepository = fishRepository;
    this.playerStateRepository = playerStateRepository;
    this.cache = new Map();
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  setCached(key, value, ttlMs) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  invalidateCache(prefixes) {
    const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
    for (const key of this.cache.keys()) {
      if (prefixList.some((prefix) => key.startsWith(prefix))) {
        this.cache.delete(key);
      }
    }
  }

  async resolveUser(discordUser, tx, options = {}) {
    if (options.user && String(options.user.discord_id) === String(discordUser.id)) {
      return options.user;
    }

    return this.userRepository.ensureUser(
      { discordId: discordUser.id, username: discordUser.username },
      tx
    );
  }

  getMapOrThrow(mapKey, language) {
    const map = FISHING_MAPS_BY_KEY.get(mapKey);
    if (!map) {
      throw new Error(getFishingCopy(language).unknownMap(mapKey));
    }
    if (!isVietnameseLanguage(language)) {
      return map;
    }

    return {
      ...map,
      label: map.labelVi || map.label,
      description: map.descriptionVi || map.description
    };
  }

  resolveMapKey(rawMapKey, fallbackMapKey) {
    const resolved = resolveFishingMapKey(rawMapKey, fallbackMapKey);
    return resolved || fallbackMapKey;
  }

  async getFishingStateBundle(userId, tx, rawMapKey = "", language) {
    const state = await this.playerStateRepository.getState(userId, tx, { forUpdate: true });
    const currentMapKey = state.systems.world.zone || "milk_docks";
    const mapKey = this.resolveMapKey(rawMapKey, currentMapKey);
    const map = this.getMapOrThrow(mapKey, language);
    return { state, currentMapKey, mapKey, map };
  }

  async castLine(discordUser, rawMapKey = "", options = {}) {
    return this.db.withTransaction(async (tx) => {
      const copy = getFishingCopy(options.language);
      const user = await this.resolveUser(discordUser, tx, options);
      if (!options.skipBootstrap) {
        await this.economyRepository.ensureAccount(user.id, tx);
        await this.inventoryRepository.ensureStarterKit(user.id, tx);
      }

      const loadout = await this.inventoryRepository.getFishingLoadout(user.id, tx);
      if (!loadout.rod) {
        throw new Error(copy.noRod);
      }

      if ((loadout.rod.durability || 0) <= 0) {
        throw new Error(copy.brokenRod);
      }

      const { state, mapKey, map } = await this.getFishingStateBundle(user.id, tx, rawMapKey, options.language);
      if (Number(user.level) < map.unlockLevel) {
        throw new Error(copy.levelGate(map.unlockLevel, map.label));
      }

      let activePet = null;
      let petBonus = 0;
      applyPetDecayToState(state);
      activePet = getActivePet(state);
      petBonus = activePet ? calculatePetPassiveBonus(state, "fishing") : 0;

      const result = buildFishingResult({
        map,
        rod: loadout.rod,
        bait: loadout.bait,
        petBonus
      });

      if (activePet && petBonus > 0) {
        const ability = getAbilityProfile(activePet.equippedAbility);
        const petCoinBonus = Math.floor(result.estimated_value * Math.min(0.22, petBonus * 0.5));
        result.coin_bonus += petCoinBonus;
        result.quality_score = Math.min(100, result.quality_score + Math.floor(petBonus * 28));
        result.pet_bonus = petCoinBonus;
        result.pet_name = activePet.nickname;
        result.pet_ability = ability.label;
        result.pet_xp = 10 + Math.floor(result.xp * 0.32);

        activePet.energy = Math.max(0, activePet.energy - 5);
        activePet.hunger = Math.max(0, activePet.hunger - 3);
        grantPetXp(activePet, result.pet_xp);
      }

      await this.fishRepository.recordCatch(
        user.id,
        {
          speciesKey: result.species_key,
          speciesName: result.species_name,
          biome: mapKey,
          rarity: result.rarity,
          weightKg: result.weight_kg,
          lengthCm: result.length_cm,
          qualityScore: result.quality_score,
          estValue: result.estimated_value,
          isBoss: result.is_boss,
          isJackpot: result.is_jackpot,
          isShiny: result.is_shiny,
          metadata: {
            map_key: mapKey,
            map_label: map.label,
            rod_key: loadout.rod.key,
            bait_key: loadout.bait?.key || null,
            chest: result.chest,
            shiny: result.is_shiny,
            pet_name: result.pet_name || null,
            pet_ability: result.pet_ability || null
          }
        },
        tx
      );

      await this.fishRepository.recordCollectionEntry(
        user.id,
        {
          speciesKey: result.species_key,
          mapKey,
          isShiny: result.is_shiny,
          weightKg: result.weight_kg,
          lengthCm: result.length_cm
        },
        tx
      );

      await this.userRepository.addXp(user.id, result.xp, tx);
      await this.inventoryRepository.reduceDurability(
        user.id,
        loadout.rod.key,
        result.durability_loss,
        tx
      );

      if (loadout.bait && result.bait_used) {
        await this.inventoryRepository.consumeBait(user.id, loadout.bait.key, 1, tx);
      }

      if (result.chest) {
        await this.inventoryRepository.grantItemByKey(user.id, "lootbox_salty", 1, {}, tx);
      }

      if (result.coin_bonus > 0) {
        await this.economyRepository.mutateWallet(user.id, result.coin_bonus, "fish_bonus", tx);
      }

      syncLegacyPetSummary(state);
      await this.playerStateRepository.saveState(user.id, state.systems, state.settings, tx);

      const economy = await this.economyRepository.getSummary(user.id, tx);
      const fishSummary = await this.fishRepository.getUnsoldSummary(user.id, tx);
      const mapProgress = await this.fishRepository.getCollectionProgress(user.id, mapKey, tx);
      const overallCollection = await this.fishRepository.getOverallCollection(user.id, tx);
      const refreshedLoadout = await this.inventoryRepository.getFishingLoadout(user.id, tx);

      this.invalidateCache([
        `fishing:info:${user.id}:`,
        `fishing:collection:${user.id}:`,
        `fishing:leaderboard:all`,
        `fishing:leaderboard:${mapKey}`
      ]);

      return {
        result,
        map,
        economy,
        fishSummary,
        mapProgress,
        overallCollection,
        loadout: refreshedLoadout
      };
    });
  }

  async getMapInfo(discordUser, options = {}) {
    const cacheKey = `fishing:info:${discordUser.id}:${options.mapKey || "current"}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const payload = await this.db.withTransaction(async (tx) => {
      const user = await this.resolveUser(discordUser, tx, options);
      const state = await this.playerStateRepository.getState(user.id, tx);
      const currentMapKey = state.systems.world.zone || "milk_docks";
      const mapKey = this.resolveMapKey(options.mapKey || "", currentMapKey);
      const map = this.getMapOrThrow(mapKey, options.language);
      const progress = await this.fishRepository.getCollectionProgress(user.id, mapKey, tx);
      const overall = await this.fishRepository.getOverallCollection(user.id, tx);
      const loadout = await this.inventoryRepository.getFishingLoadout(user.id, tx);

      return {
        map,
        currentMapKey,
        progress,
        overall,
        loadout
      };
    });

    this.setCached(cacheKey, payload, CACHE_TTL_MS);
    return payload;
  }

  async getCollectionOverview(discordUser, options = {}) {
    const cacheKey = `fishing:collection:${discordUser.id}:${options.mapKey || "current"}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const payload = await this.db.withTransaction(async (tx) => {
      const user = await this.resolveUser(discordUser, tx, options);
      const state = await this.playerStateRepository.getState(user.id, tx);
      const currentMapKey = state.systems.world.zone || "milk_docks";
      const mapKey = this.resolveMapKey(options.mapKey || "", currentMapKey);
      const map = this.getMapOrThrow(mapKey, options.language);
      const progress = await this.fishRepository.getCollectionProgress(user.id, mapKey, tx);
      const overall = await this.fishRepository.getOverallCollection(user.id, tx);

      return {
        map,
        progress,
        overall
      };
    });

    this.setCached(cacheKey, payload, CACHE_TTL_MS);
    return payload;
  }

  async getLeaderboard(options = {}) {
    const mapKey = options.mapKey || "all";
    const cacheKey = `fishing:leaderboard:${mapKey}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const resolvedMapKey =
      mapKey === "all" ? null : this.resolveMapKey(mapKey, "milk_docks");
    const rows = await this.fishRepository.getLeaderboard(options.limit || 10, resolvedMapKey);
    const payload = {
      mapKey: resolvedMapKey,
      rows
    };

    this.setCached(cacheKey, payload, LEADERBOARD_TTL_MS);
    return payload;
  }

  listMaps() {
    return FISHING_MAPS;
  }
}

module.exports = { FishingService };
