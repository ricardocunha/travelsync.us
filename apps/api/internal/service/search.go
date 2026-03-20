package service

import (
	"context"
	"time"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type SearchStatus struct {
	PlanID       int       `json:"plan_id"`
	Status       string    `json:"status"`
	StartedAt    time.Time `json:"started_at"`
	CompletedAt  time.Time `json:"completed_at,omitempty"`
	Destinations int       `json:"destinations"`
	Participants int       `json:"participants"`
}

type SearchService interface {
	StartSearch(ctx context.Context, planID int) error
	GetSearchStatus(ctx context.Context, planID int) (SearchStatus, error)
	ListDestinationResults(ctx context.Context, planID int) ([]models.PlanDestination, error)
	GetDestinationDetail(ctx context.Context, planID int, destinationID int) (models.PlanDestination, []models.PlanFlight, error)
}
