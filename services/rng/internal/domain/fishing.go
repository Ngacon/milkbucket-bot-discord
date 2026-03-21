package domain

import (
	"fmt"
	"math"
	"strings"
)

type FishingInput struct {
	Biome           string
	RodKey          string
	RodTier         int
	BaitKey         string
	BaitLuck        float64
	DurabilityBonus int
}

type FishingOutput struct {
	SpeciesKey     string
	SpeciesName    string
	Biome          string
	Rarity         string
	WeightKg       float64
	LengthCm       float64
	QualityScore   int
	EstimatedValue int64
	XP             int
	DurabilityLoss int
	Chest          bool
	Trash          bool
	BaitUsed       bool
	CoinBonus      int64
	IsBoss         bool
	IsJackpot      bool
	FlavorText     string
}

type fishSpecies struct {
	Key       string
	Name      string
	Biome     string
	Rarity    string
	MinKg     float64
	MaxKg     float64
	MinCm     float64
	MaxCm     float64
	BaseValue int64
	Boss      bool
}

var speciesPool = []fishSpecies{
	{Key: "reef_sardine", Name: "Reef Sardine", Biome: "reef", Rarity: "common", MinKg: 0.4, MaxKg: 1.4, MinCm: 15, MaxCm: 35, BaseValue: 40},
	{Key: "reef_puffer", Name: "Puffed-Up Menace", Biome: "reef", Rarity: "uncommon", MinKg: 1.2, MaxKg: 3.4, MinCm: 25, MaxCm: 55, BaseValue: 115},
	{Key: "reef_glassfin", Name: "Glassfin Idol", Biome: "reef", Rarity: "rare", MinKg: 2.1, MaxKg: 5.8, MinCm: 35, MaxCm: 85, BaseValue: 320},
	{Key: "reef_sunblade", Name: "Sunblade Snapper", Biome: "reef", Rarity: "epic", MinKg: 4.6, MaxKg: 9.3, MinCm: 50, MaxCm: 110, BaseValue: 860},
	{Key: "reef_prism", Name: "Prism Koi", Biome: "reef", Rarity: "legendary", MinKg: 5.3, MaxKg: 11.7, MinCm: 70, MaxCm: 130, BaseValue: 2350},
	{Key: "reef_leviathan", Name: "Coral Leviathan", Biome: "reef", Rarity: "mythical", MinKg: 14.0, MaxKg: 28.0, MinCm: 140, MaxCm: 260, BaseValue: 7800},
	{Key: "island_mullet", Name: "Island Mullet", Biome: "island", Rarity: "common", MinKg: 0.5, MaxKg: 1.8, MinCm: 18, MaxCm: 42, BaseValue: 45},
	{Key: "island_parrot", Name: "Parrot Biter", Biome: "island", Rarity: "uncommon", MinKg: 1.4, MaxKg: 3.8, MinCm: 24, MaxCm: 60, BaseValue: 120},
	{Key: "island_sting", Name: "Stingray Jr.", Biome: "island", Rarity: "rare", MinKg: 3.0, MaxKg: 7.0, MinCm: 45, MaxCm: 100, BaseValue: 340},
	{Key: "island_monsoon", Name: "Monsoon Marlin", Biome: "island", Rarity: "epic", MinKg: 6.5, MaxKg: 13.5, MinCm: 90, MaxCm: 170, BaseValue: 950},
	{Key: "island_aurora", Name: "Aurora Sailfin", Biome: "island", Rarity: "legendary", MinKg: 8.0, MaxKg: 16.8, MinCm: 110, MaxCm: 200, BaseValue: 2580},
	{Key: "island_krakenling", Name: "Pocket Krakenling", Biome: "island", Rarity: "mythical", MinKg: 16.5, MaxKg: 31.0, MinCm: 160, MaxCm: 280, BaseValue: 8400},
	{Key: "volcano_ashgill", Name: "Ashgill", Biome: "volcano", Rarity: "common", MinKg: 0.7, MaxKg: 2.0, MinCm: 20, MaxCm: 48, BaseValue: 55},
	{Key: "volcano_magma", Name: "Magma Guppy", Biome: "volcano", Rarity: "uncommon", MinKg: 1.8, MaxKg: 4.2, MinCm: 30, MaxCm: 68, BaseValue: 140},
	{Key: "volcano_smoketail", Name: "Smoketail Tuna", Biome: "volcano", Rarity: "rare", MinKg: 4.2, MaxKg: 8.8, MinCm: 55, MaxCm: 115, BaseValue: 390},
	{Key: "volcano_emberjaw", Name: "Emberjaw Serpent", Biome: "volcano", Rarity: "epic", MinKg: 7.2, MaxKg: 15.4, MinCm: 95, MaxCm: 185, BaseValue: 1080},
	{Key: "volcano_crown", Name: "Crown of Cinders", Biome: "volcano", Rarity: "legendary", MinKg: 10.3, MaxKg: 19.7, MinCm: 120, MaxCm: 215, BaseValue: 2890},
	{Key: "volcano_phoenix", Name: "Phoenix Eel", Biome: "volcano", Rarity: "mythical", MinKg: 18.5, MaxKg: 36.5, MinCm: 170, MaxCm: 320, BaseValue: 9200},
	{Key: "boss_abyssal", Name: "Abyssal Dragonfish", Biome: "reef", Rarity: "mythical", MinKg: 45.0, MaxKg: 88.0, MinCm: 300, MaxCm: 520, BaseValue: 32000, Boss: true},
}

func ResolveFishingCast(rng *RNG, input FishingInput) (FishingOutput, error) {
	biome := normalizeBiome(input.Biome)
	rodTier := input.RodTier
	if rodTier <= 0 {
		rodTier = 1
	}

	baitLuck := input.BaitLuck
	if baitLuck < 0 {
		baitLuck = 0
	}

	bossChance := 0.0007 + float64(rodTier)*0.0003 + baitLuck*0.0015
	bossRoll, err := rng.Float64()
	if err != nil {
		return FishingOutput{}, err
	}
	if bossRoll < bossChance {
		boss := speciesPool[len(speciesPool)-1]
		return buildCatch(rng, boss, true, false, false, input.BaitKey != ""), nil
	}

	trashChance := math.Max(0.04, 0.18-float64(rodTier)*0.01-baitLuck*0.55)
	trashRoll, err := rng.Float64()
	if err != nil {
		return FishingOutput{}, err
	}
	if trashRoll < trashChance {
		return buildTrash(rng, biome, input.BaitKey != ""), nil
	}

	rarity, err := rollRarity(rng, rodTier, baitLuck)
	if err != nil {
		return FishingOutput{}, err
	}

	var choices []WeightedChoice[fishSpecies]
	for _, candidate := range speciesPool {
		if candidate.Biome == biome && candidate.Rarity == rarity && !candidate.Boss {
			choices = append(choices, WeightedChoice[fishSpecies]{Item: candidate, Weight: 1})
		}
	}
	if len(choices) == 0 {
		return FishingOutput{}, fmt.Errorf("no fish configured for biome %s and rarity %s", biome, rarity)
	}

	species, err := WeightedPick(rng, choices)
	if err != nil {
		return FishingOutput{}, err
	}

	chestChance := 0.06 + baitLuck*0.25 + float64(rodTier)*0.004
	chestRoll, err := rng.Float64()
	if err != nil {
		return FishingOutput{}, err
	}

	catch := buildCatch(rng, species, false, chestRoll < chestChance, rarity == "mythical", input.BaitKey != "")
	catch.DurabilityLoss = maxInt(1, catch.DurabilityLoss-input.DurabilityBonus)
	if catch.IsJackpot {
		catch.CoinBonus += int64(400 + rodTier*75)
		catch.FlavorText = "Jackpot fish sparkles everywhere. Nearby wallets tremble with envy."
	}

	return catch, nil
}

func rollRarity(rng *RNG, rodTier int, baitLuck float64) (string, error) {
	bonus := float64(rodTier-1) * 0.9
	choices := []WeightedChoice[string]{
		{Item: "common", Weight: math.Max(10, 57-bonus*2.3-baitLuck*40)},
		{Item: "uncommon", Weight: 25 + bonus*1.2 + baitLuck*20},
		{Item: "rare", Weight: 11 + bonus*0.8 + baitLuck*12},
		{Item: "epic", Weight: 5 + bonus*0.35 + baitLuck*8},
		{Item: "legendary", Weight: 1.7 + bonus*0.15 + baitLuck*5},
		{Item: "mythical", Weight: 0.3 + bonus*0.08 + baitLuck*3},
	}

	return WeightedPick(rng, choices)
}

func buildCatch(rng *RNG, species fishSpecies, boss bool, chest bool, jackpot bool, baitUsed bool) FishingOutput {
	weight := rangedFloat(rng, species.MinKg, species.MaxKg)
	length := rangedFloat(rng, species.MinCm, species.MaxCm)
	quality := rangedInt(rng, 58, 100)
	if boss {
		quality = rangedInt(rng, 92, 100)
		chest = true
		jackpot = true
	}

	valueMultiplier := 1 + (float64(quality)-50)/100
	if jackpot {
		valueMultiplier += 0.35
	}
	if boss {
		valueMultiplier += 0.75
	}

	estimatedValue := int64(float64(species.BaseValue) * valueMultiplier)
	xp := 20 + rarityXP(species.Rarity) + quality/4
	durabilityLoss := 1
	if species.Rarity == "epic" || species.Rarity == "legendary" {
		durabilityLoss = 2
	}
	if species.Rarity == "mythical" || boss {
		durabilityLoss = 3
	}

	coinBonus := int64(0)
	if chest {
		coinBonus += int64(rangedInt(rng, 90, 260))
	}

	flavorLines := []string{
		"It flopped dramatically like it knew it had an audience.",
		"The water exploded and your rod made a sound it will remember forever.",
		"You locked eyes for one second and immediately knew this was content.",
	}
	flavor := flavorLines[rangedInt(rng, 0, len(flavorLines)-1)]
	if boss {
		flavor = "The sea boss surfaced. Nearby fishermen would absolutely call this unfair."
	}

	return FishingOutput{
		SpeciesKey:     species.Key,
		SpeciesName:    species.Name,
		Biome:          species.Biome,
		Rarity:         species.Rarity,
		WeightKg:       roundTwo(weight),
		LengthCm:       roundTwo(length),
		QualityScore:   quality,
		EstimatedValue: estimatedValue,
		XP:             xp,
		DurabilityLoss: durabilityLoss,
		Chest:          chest,
		Trash:          false,
		BaitUsed:       baitUsed,
		CoinBonus:      coinBonus,
		IsBoss:         boss,
		IsJackpot:      jackpot,
		FlavorText:     flavor,
	}
}

func buildTrash(rng *RNG, biome string, baitUsed bool) FishingOutput {
	trashNames := []string{"Cursed Sandal", "Suspicious Tire", "Wet Homework", "Plastic Emperor"}
	name := trashNames[rangedInt(rng, 0, len(trashNames)-1)]

	return FishingOutput{
		SpeciesKey:     "trash_" + strings.ReplaceAll(strings.ToLower(name), " ", "_"),
		SpeciesName:    name,
		Biome:          biome,
		Rarity:         "common",
		WeightKg:       roundTwo(rangedFloat(rng, 0.8, 4.0)),
		LengthCm:       roundTwo(rangedFloat(rng, 18, 85)),
		QualityScore:   rangedInt(rng, 1, 28),
		EstimatedValue: int64(rangedInt(rng, 5, 25)),
		XP:             6,
		DurabilityLoss: 1,
		Chest:          false,
		Trash:          true,
		BaitUsed:       baitUsed,
		CoinBonus:      0,
		IsBoss:         false,
		IsJackpot:      false,
		FlavorText:     "The ocean has gifted you... literal nonsense. Inspiring.",
	}
}

func normalizeBiome(raw string) string {
	switch strings.ToLower(raw) {
	case "island", "shore", "beach":
		return "island"
	case "volcano", "lava", "ash":
		return "volcano"
	default:
		return "reef"
	}
}

func rarityXP(rarity string) int {
	switch rarity {
	case "mythical":
		return 180
	case "legendary":
		return 130
	case "epic":
		return 90
	case "rare":
		return 55
	case "uncommon":
		return 30
	default:
		return 12
	}
}

func rangedFloat(rng *RNG, min float64, max float64) float64 {
	roll, err := rng.Float64()
	if err != nil {
		return min
	}
	return min + (max-min)*roll
}

func rangedInt(rng *RNG, min int, max int) int {
	if max <= min {
		return min
	}

	roll, err := rng.Intn(max - min + 1)
	if err != nil {
		return min
	}

	return min + roll
}

func roundTwo(value float64) float64 {
	return math.Round(value*100) / 100
}

func maxInt(a int, b int) int {
	if a > b {
		return a
	}
	return b
}
