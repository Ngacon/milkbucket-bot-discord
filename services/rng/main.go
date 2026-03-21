package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"botgame-rng/internal/api"
	"botgame-rng/internal/domain"
)

func main() {
	rng := domain.NewRNG()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status": "ok",
			"time":   time.Now().UTC().Format(time.RFC3339),
		})
	})

	mux.HandleFunc("/v1/gamble/coinflip", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}

		var req api.CoinflipRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON body"})
			return
		}

		result, err := domain.ResolveCoinflip(rng, domain.CoinflipInput{
			Choice: req.Choice,
			Bet:    req.Bet,
		})
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, api.CoinflipResponse{
			Outcome:    result.Outcome,
			Won:        result.Won,
			Profit:     result.Profit,
			Payout:     result.Payout,
			Multiplier: result.Multiplier,
			FlavorText: result.FlavorText,
		})
	})

	mux.HandleFunc("/v1/fishing/cast", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}

		var req api.FishingCastRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON body"})
			return
		}

		result, err := domain.ResolveFishingCast(rng, domain.FishingInput{
			Biome:           req.Biome,
			RodKey:          req.RodKey,
			RodTier:         req.RodTier,
			BaitKey:         req.BaitKey,
			BaitLuck:        req.BaitLuck,
			DurabilityBonus: req.DurabilityBonus,
		})
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, api.FishingCastResponse{
			SpeciesKey:     result.SpeciesKey,
			SpeciesName:    result.SpeciesName,
			Biome:          result.Biome,
			Rarity:         result.Rarity,
			WeightKg:       fmt.Sprintf("%.2f", result.WeightKg),
			LengthCm:       fmt.Sprintf("%.2f", result.LengthCm),
			QualityScore:   result.QualityScore,
			EstimatedValue: result.EstimatedValue,
			XP:             result.XP,
			DurabilityLoss: result.DurabilityLoss,
			Chest:          result.Chest,
			Trash:          result.Trash,
			BaitUsed:       result.BaitUsed,
			CoinBonus:      result.CoinBonus,
			IsBoss:         result.IsBoss,
			IsJackpot:      result.IsJackpot,
			FlavorText:     result.FlavorText,
		})
	})

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           loggingMiddleware(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("[rng] listening on :%s", port)
	log.Fatal(server.ListenAndServe())
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
