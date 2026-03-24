package service

import (
	"context"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
	"github.com/ricardocunha/travelsync/apps/api/internal/repository"
)

type ReferenceService interface {
	ListRegions(ctx context.Context) ([]models.Region, error)
	ListCountries(ctx context.Context) ([]models.Country, error)
	ListAirports(ctx context.Context, countryID int, city string) ([]models.Airport, error)
	ListAirlines(ctx context.Context) ([]models.Airline, error)
	ListDestinations(ctx context.Context) ([]models.Location, error)
	GetDestination(ctx context.Context, destinationID int) (models.Location, error)
	SearchDestinations(ctx context.Context, query string) ([]models.Location, error)
}

type referenceService struct {
	repo repository.ReferenceRepository
}

func NewReferenceService(repo repository.ReferenceRepository) ReferenceService {
	return &referenceService{repo: repo}
}

func (s *referenceService) ListRegions(ctx context.Context) ([]models.Region, error) {
	return s.repo.ListRegions(ctx)
}

func (s *referenceService) ListCountries(ctx context.Context) ([]models.Country, error) {
	return s.repo.ListCountries(ctx)
}

func (s *referenceService) ListAirports(
	ctx context.Context,
	countryID int,
	city string,
) ([]models.Airport, error) {
	return s.repo.ListAirports(ctx, countryID, city)
}

func (s *referenceService) ListAirlines(ctx context.Context) ([]models.Airline, error) {
	return s.repo.ListAirlines(ctx)
}

func (s *referenceService) ListDestinations(ctx context.Context) ([]models.Location, error) {
	return s.repo.ListDestinations(ctx)
}

func (s *referenceService) GetDestination(
	ctx context.Context,
	destinationID int,
) (models.Location, error) {
	if destinationID <= 0 {
		return models.Location{}, ValidationError{Message: "destination id must be positive"}
	}
	return s.repo.GetDestination(ctx, destinationID)
}

func (s *referenceService) SearchDestinations(
	ctx context.Context,
	query string,
) ([]models.Location, error) {
	if query == "" {
		return nil, ValidationError{Message: "q is required"}
	}
	return s.repo.SearchDestinations(ctx, query)
}
