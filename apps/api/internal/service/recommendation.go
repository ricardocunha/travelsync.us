package service

import "context"

type RecommendationResult struct {
	RecommendedDestinationID int      `json:"recommended_destination_id"`
	Reasoning                string   `json:"reasoning"`
	Pros                     []string `json:"pros"`
	Cons                     []string `json:"cons"`
	Tips                     []string `json:"tips"`
}

type RecommendationService interface {
	Recommend(ctx context.Context, planID int) (RecommendationResult, error)
}
