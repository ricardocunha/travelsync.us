package service

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
	"github.com/ricardocunha/travelsync/apps/api/internal/repository"
)

func TestSearchServiceBuildsRankedDestinationResults(t *testing.T) {
	ctx := context.Background()
	plan := models.Plan{
		ID:                   42,
		OrganizationID:       1,
		CreatedByUserID:      1,
		Name:                 "Team Summit",
		EventStart:           time.Date(2026, 4, 6, 14, 0, 0, 0, time.UTC),
		EventEnd:             time.Date(2026, 4, 10, 20, 0, 0, 0, time.UTC),
		EventTimezone:        "America/Panama",
		ArrivalBufferHours:   12,
		DepartureBufferHours: 4,
		Currency:             "USD",
		CabinClass:           "ECONOMY",
		SearchMode:           "flexible",
		Status:               "draft",
		RegionFilterIDs:      json.RawMessage(`[1,2,4]`),
	}

	participants := []models.PlanParticipant{
		{ID: 1, PlanID: 42, GuestName: "Ana", DepartureCity: "Brasilia", DepartureAirportID: 301, Status: "confirmed"},
		{ID: 2, PlanID: 42, GuestName: "John", DepartureCity: "New York", DepartureAirportID: 101, Status: "confirmed"},
	}

	destinations := []models.Location{
		{ID: 10, Name: "Panama City", RegionID: 2, Timezone: "America/Panama", IsActive: true},
		{ID: 11, Name: "Madrid", RegionID: 4, Timezone: "Europe/Madrid", IsActive: true},
	}

	airportsByID := map[int]models.Airport{
		101: {ID: 101, City: "New York", IATACode: "JFK", Latitude: 40.6413, Longitude: -73.7781, TimezoneCode: "America/New_York"},
		301: {ID: 301, City: "Brasilia", IATACode: "BSB", Latitude: -15.7939, Longitude: -47.8828, TimezoneCode: "America/Sao_Paulo"},
		401: {ID: 401, City: "Panama City", IATACode: "PTY", Latitude: 9.0714, Longitude: -79.3835, TimezoneCode: "America/Panama"},
		501: {ID: 501, City: "Madrid", IATACode: "MAD", Latitude: 40.4722, Longitude: -3.5608, TimezoneCode: "Europe/Madrid"},
	}

	referenceRepo := fakeReferenceRepository{
		destinations: destinations,
		airportsByID: airportsByID,
		destinationAirports: map[int][]models.Airport{
			10: {airportsByID[401]},
			11: {airportsByID[501]},
		},
	}
	planRepo := &fakePlanRepository{plan: plan}
	participantRepo := fakeParticipantRepository{participants: participants}
	searchRepo := &fakeSearchRepository{}

	service := NewSearchService(planRepo, participantRepo, referenceRepo, searchRepo)

	status, err := service.StartSearch(ctx, 42)
	if err != nil {
		t.Fatalf("expected search to succeed: %v", err)
	}

	if status.Status != "reviewed" {
		t.Fatalf("expected status reviewed, got %q", status.Status)
	}
	if status.Destinations != 2 {
		t.Fatalf("expected 2 scored destinations, got %d", status.Destinations)
	}

	results, err := service.ListDestinationResults(ctx, 42)
	if err != nil {
		t.Fatalf("expected destination results: %v", err)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 destination results, got %d", len(results))
	}
	if results[0].Result.OverallRank != 1 || results[1].Result.OverallRank != 2 {
		t.Fatalf("expected ordered overall ranks, got %+v", results)
	}
	if results[0].Destination.Name == results[1].Destination.Name {
		t.Fatalf("expected distinct destinations in results, got %+v", results)
	}

	detail, err := service.GetDestinationDetail(ctx, 42, results[0].Destination.ID)
	if err != nil {
		t.Fatalf("expected destination detail: %v", err)
	}

	if len(detail.Flights) != 4 {
		t.Fatalf("expected 4 flights for 2 participants, got %d", len(detail.Flights))
	}
	if detail.Result.Result.TotalCost <= 0 {
		t.Fatalf("expected positive total cost, got %+v", detail.Result.Result)
	}
}

type fakePlanRepository struct {
	plan models.Plan
}

func (f *fakePlanRepository) CreatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	panic("unexpected CreatePlan call")
}

func (f *fakePlanRepository) ListPlans(ctx context.Context, organizationID int) ([]models.Plan, error) {
	panic("unexpected ListPlans call")
}

func (f *fakePlanRepository) GetPlan(ctx context.Context, planID int) (models.Plan, error) {
	return f.plan, nil
}

func (f *fakePlanRepository) UpdatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	f.plan = plan
	return plan, nil
}

func (f *fakePlanRepository) DeletePlan(ctx context.Context, planID int) error {
	panic("unexpected DeletePlan call")
}

type fakeParticipantRepository struct {
	participants []models.PlanParticipant
}

func (f fakeParticipantRepository) AddParticipants(
	ctx context.Context,
	participants []models.PlanParticipant,
) ([]models.PlanParticipant, error) {
	panic("unexpected AddParticipants call")
}

func (f fakeParticipantRepository) ListParticipants(ctx context.Context, planID int) ([]models.PlanParticipant, error) {
	return f.participants, nil
}

func (f fakeParticipantRepository) GetParticipant(ctx context.Context, participantID int) (models.PlanParticipant, error) {
	panic("unexpected GetParticipant call")
}

func (f fakeParticipantRepository) UpdateParticipant(
	ctx context.Context,
	participant models.PlanParticipant,
) (models.PlanParticipant, error) {
	panic("unexpected UpdateParticipant call")
}

func (f fakeParticipantRepository) DeleteParticipant(ctx context.Context, participantID int) error {
	panic("unexpected DeleteParticipant call")
}

type fakeReferenceRepository struct {
	destinations        []models.Location
	airportsByID        map[int]models.Airport
	destinationAirports map[int][]models.Airport
}

func (f fakeReferenceRepository) ListRegions(ctx context.Context) ([]models.Region, error) {
	panic("unexpected ListRegions call")
}

func (f fakeReferenceRepository) ListCountries(ctx context.Context) ([]models.Country, error) {
	panic("unexpected ListCountries call")
}

func (f fakeReferenceRepository) ListAirports(ctx context.Context, countryID int, city string) ([]models.Airport, error) {
	panic("unexpected ListAirports call")
}

func (f fakeReferenceRepository) GetAirport(ctx context.Context, airportID int) (models.Airport, error) {
	return f.airportsByID[airportID], nil
}

func (f fakeReferenceRepository) ListDestinationAirports(ctx context.Context, destinationID int) ([]models.Airport, error) {
	return f.destinationAirports[destinationID], nil
}

func (f fakeReferenceRepository) ListAirlines(ctx context.Context) ([]models.Airline, error) {
	panic("unexpected ListAirlines call")
}

func (f fakeReferenceRepository) ListDestinations(ctx context.Context) ([]models.Location, error) {
	return f.destinations, nil
}

func (f fakeReferenceRepository) GetDestination(ctx context.Context, destinationID int) (models.Location, error) {
	for _, item := range f.destinations {
		if item.ID == destinationID {
			return item, nil
		}
	}
	return models.Location{}, repository.ErrNotFound
}

func (f fakeReferenceRepository) SearchDestinations(ctx context.Context, query string) ([]models.Location, error) {
	panic("unexpected SearchDestinations call")
}

type fakeSearchRepository struct {
	results []repository.SearchResultRecord
}

func (f *fakeSearchRepository) ReplaceSearchResults(
	ctx context.Context,
	planID int,
	results []repository.SearchResultRecord,
) error {
	now := time.Date(2026, 3, 24, 18, 0, 0, 0, time.UTC)
	f.results = make([]repository.SearchResultRecord, len(results))
	for index, item := range results {
		item.Destination.ID = index + 1
		item.Destination.SearchedAt = now
		for flightIndex := range item.Flights {
			item.Flights[flightIndex].ID = (index * 100) + flightIndex + 1
			item.Flights[flightIndex].PlanDestinationID = item.Destination.ID
			item.Flights[flightIndex].PlanID = planID
			item.Flights[flightIndex].SearchedAt = now
		}
		f.results[index] = item
	}
	return nil
}

func (f *fakeSearchRepository) GetSearchMetadata(ctx context.Context, planID int) (repository.SearchMetadata, error) {
	if len(f.results) == 0 {
		return repository.SearchMetadata{}, nil
	}

	startedAt := f.results[0].Destination.SearchedAt
	completedAt := f.results[len(f.results)-1].Destination.SearchedAt
	return repository.SearchMetadata{
		Destinations: len(f.results),
		StartedAt:    &startedAt,
		CompletedAt:  &completedAt,
	}, nil
}

func (f *fakeSearchRepository) ListDestinationResults(ctx context.Context, planID int) ([]models.PlanDestination, error) {
	items := make([]models.PlanDestination, 0, len(f.results))
	for _, item := range f.results {
		items = append(items, item.Destination)
	}
	return items, nil
}

func (f *fakeSearchRepository) GetDestinationResult(
	ctx context.Context,
	planID int,
	destinationID int,
) (models.PlanDestination, error) {
	for _, item := range f.results {
		if item.Destination.DestinationID == destinationID {
			return item.Destination, nil
		}
	}
	return models.PlanDestination{}, repository.ErrNotFound
}

func (f *fakeSearchRepository) ListDestinationFlights(
	ctx context.Context,
	planDestinationID int,
) ([]models.PlanFlight, error) {
	for _, item := range f.results {
		if item.Destination.ID == planDestinationID {
			return item.Flights, nil
		}
	}
	return nil, repository.ErrNotFound
}
