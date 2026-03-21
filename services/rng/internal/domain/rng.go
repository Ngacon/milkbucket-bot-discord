package domain

import (
	"crypto/rand"
	"encoding/binary"
	"fmt"
)

type RNG struct{}

type WeightedChoice[T any] struct {
	Item   T
	Weight float64
}

func NewRNG() *RNG {
	return &RNG{}
}

func (r *RNG) Float64() (float64, error) {
	var buf [8]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return 0, err
	}

	value := binary.BigEndian.Uint64(buf[:]) >> 11
	return float64(value) / float64(uint64(1)<<53), nil
}

func (r *RNG) Intn(max int) (int, error) {
	if max <= 0 {
		return 0, fmt.Errorf("max must be positive")
	}

	value, err := r.Float64()
	if err != nil {
		return 0, err
	}

	index := int(value * float64(max))
	if index == max {
		index = max - 1
	}

	return index, nil
}

func WeightedPick[T any](rng *RNG, choices []WeightedChoice[T]) (T, error) {
	var zero T
	if len(choices) == 0 {
		return zero, fmt.Errorf("weighted choices cannot be empty")
	}

	total := 0.0
	for _, choice := range choices {
		total += choice.Weight
	}

	roll, err := rng.Float64()
	if err != nil {
		return zero, err
	}

	target := roll * total
	current := 0.0
	for _, choice := range choices {
		current += choice.Weight
		if target <= current {
			return choice.Item, nil
		}
	}

	return choices[len(choices)-1].Item, nil
}

