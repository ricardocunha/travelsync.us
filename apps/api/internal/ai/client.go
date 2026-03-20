package ai

import (
	"context"
	"errors"
	"net/http"
	"time"
)

var ErrNotImplemented = errors.New("python agent integration not implemented")

type RecommendationRequest struct {
	PlanID int `json:"plan_id"`
}

type RecommendationResponse struct {
	RecommendedDestinationID int      `json:"recommended_destination_id"`
	Reasoning                string   `json:"reasoning"`
	Pros                     []string `json:"pros"`
	Cons                     []string `json:"cons"`
	Tips                     []string `json:"tips"`
}

type ItineraryRequest struct {
	Destination string   `json:"destination"`
	StartDate   string   `json:"start_date"`
	EndDate     string   `json:"end_date"`
	Travelers   []string `json:"travelers"`
}

type ItineraryResponse struct {
	Summary     string   `json:"summary"`
	Sources     []string `json:"sources"`
	Assumptions []string `json:"assumptions"`
	Warnings    []string `json:"warnings"`
}

type Client interface {
	Recommend(ctx context.Context, req RecommendationRequest) (RecommendationResponse, error)
	CreateItinerary(ctx context.Context, req ItineraryRequest) (ItineraryResponse, error)
}

type HTTPClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewHTTPClient(baseURL string) *HTTPClient {
	return &HTTPClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *HTTPClient) Recommend(ctx context.Context, req RecommendationRequest) (RecommendationResponse, error) {
	_ = ctx
	_ = req
	return RecommendationResponse{}, ErrNotImplemented
}

func (c *HTTPClient) CreateItinerary(ctx context.Context, req ItineraryRequest) (ItineraryResponse, error) {
	_ = ctx
	_ = req
	return ItineraryResponse{}, ErrNotImplemented
}
