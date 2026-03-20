package repository

import (
	"context"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type SearchRepository interface {
	SaveDestinationResults(ctx context.Context, results []models.PlanDestination) error
	SaveFlightResults(ctx context.Context, flights []models.PlanFlight) error
	ListDestinationResults(ctx context.Context, planID int) ([]models.PlanDestination, error)
	GetDestinationResult(ctx context.Context, planID int, destinationID int) (models.PlanDestination, error)
}
