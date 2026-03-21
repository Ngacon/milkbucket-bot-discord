package api

type CoinflipRequest struct {
	UserID string `json:"user_id"`
	Choice string `json:"choice"`
	Bet    int64  `json:"bet"`
}

type CoinflipResponse struct {
	Outcome    string  `json:"outcome"`
	Won        bool    `json:"won"`
	Profit     int64   `json:"profit"`
	Payout     int64   `json:"payout"`
	Multiplier float64 `json:"multiplier"`
	FlavorText string  `json:"flavor_text"`
}

type FishingCastRequest struct {
	UserID          string  `json:"user_id"`
	Biome           string  `json:"biome"`
	RodKey          string  `json:"rod_key"`
	RodTier         int     `json:"rod_tier"`
	BaitKey         string  `json:"bait_key"`
	BaitLuck        float64 `json:"bait_luck"`
	DurabilityBonus int     `json:"durability_bonus"`
}

type FishingCastResponse struct {
	SpeciesKey     string `json:"species_key"`
	SpeciesName    string `json:"species_name"`
	Biome          string `json:"biome"`
	Rarity         string `json:"rarity"`
	WeightKg       string `json:"weight_kg"`
	LengthCm       string `json:"length_cm"`
	QualityScore   int    `json:"quality_score"`
	EstimatedValue int64  `json:"estimated_value"`
	XP             int    `json:"xp"`
	DurabilityLoss int    `json:"durability_loss"`
	Chest          bool   `json:"chest"`
	Trash          bool   `json:"trash"`
	BaitUsed       bool   `json:"bait_used"`
	CoinBonus      int64  `json:"coin_bonus"`
	IsBoss         bool   `json:"is_boss"`
	IsJackpot      bool   `json:"is_jackpot"`
	FlavorText     string `json:"flavor_text"`
}

