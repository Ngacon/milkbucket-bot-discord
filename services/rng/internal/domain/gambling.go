package domain

import (
	"fmt"
	"strings"
)

type CoinflipInput struct {
	Choice string
	Bet    int64
}

type CoinflipOutput struct {
	Outcome    string
	Won        bool
	Profit     int64
	Payout     int64
	Multiplier float64
	FlavorText string
}

func ResolveCoinflip(rng *RNG, input CoinflipInput) (CoinflipOutput, error) {
	if input.Bet <= 0 {
		return CoinflipOutput{}, fmt.Errorf("bet must be positive")
	}

	choice := strings.ToLower(input.Choice)
	if choice == "h" {
		choice = "heads"
	}
	if choice == "t" {
		choice = "tails"
	}
	if choice != "heads" && choice != "tails" {
		return CoinflipOutput{}, fmt.Errorf("choice must be heads or tails")
	}

	index, err := rng.Intn(2)
	if err != nil {
		return CoinflipOutput{}, err
	}

	outcome := "heads"
	if index == 1 {
		outcome = "tails"
	}

	won := choice == outcome
	multiplier := 1.92
	profit := -input.Bet
	payout := int64(0)

	if won {
		profit = int64(float64(input.Bet) * (multiplier - 1.0))
		payout = input.Bet + profit
	}

	winLines := []string{
		"The casino blinked first. Huge scene.",
		"Your coin-fu was impeccable. Security is upset.",
		"The table groaned as you stole a little destiny.",
	}
	loseLines := []string{
		"The coin chose violence. Classic.",
		"The casino inhaled your bet like popcorn.",
		"That flip was criminally disrespectful.",
	}

	flavor := loseLines[0]
	if won {
		pick, err := rng.Intn(len(winLines))
		if err != nil {
			return CoinflipOutput{}, err
		}
		flavor = winLines[pick]
	} else {
		pick, err := rng.Intn(len(loseLines))
		if err != nil {
			return CoinflipOutput{}, err
		}
		flavor = loseLines[pick]
	}

	return CoinflipOutput{
		Outcome:    outcome,
		Won:        won,
		Profit:     profit,
		Payout:     payout,
		Multiplier: multiplier,
		FlavorText: flavor,
	}, nil
}

