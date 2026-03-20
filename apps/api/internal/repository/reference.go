package repository

import (
	"context"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type ReferenceRepository interface {
	ListRegions(ctx context.Context) ([]models.Region, error)
	ListCountries(ctx context.Context) ([]models.Country, error)
	ListAirports(ctx context.Context, countryID int, city string) ([]models.Airport, error)
	ListAirlines(ctx context.Context) ([]models.Airline, error)
	ListDestinations(ctx context.Context) ([]models.Location, error)
	SearchDestinations(ctx context.Context, query string) ([]models.Location, error)
}
