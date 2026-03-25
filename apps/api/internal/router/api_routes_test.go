package router

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ricardocunha/travelsync/apps/api/internal/handler"
	"github.com/ricardocunha/travelsync/apps/api/internal/models"
	"github.com/ricardocunha/travelsync/apps/api/internal/service"
)

type fakeReferenceService struct{}

func (f fakeReferenceService) ListRegions(ctx context.Context) ([]models.Region, error) {
	return []models.Region{{ID: 1, Name: "North America"}}, nil
}

func (f fakeReferenceService) ListCountries(ctx context.Context) ([]models.Country, error) {
	return []models.Country{{ID: 1, Name: "United States", ISOCode: "US", AltCode: "US"}}, nil
}

func (f fakeReferenceService) ListAirports(ctx context.Context, countryID int, city string) ([]models.Airport, error) {
	return []models.Airport{}, nil
}

func (f fakeReferenceService) ListAirlines(ctx context.Context) ([]models.Airline, error) {
	return []models.Airline{}, nil
}

func (f fakeReferenceService) ListDestinations(ctx context.Context) ([]models.Location, error) {
	return []models.Location{}, nil
}

func (f fakeReferenceService) GetDestination(ctx context.Context, destinationID int) (models.Location, error) {
	return models.Location{ID: destinationID, Name: "Lisbon"}, nil
}

func (f fakeReferenceService) SearchDestinations(ctx context.Context, query string) ([]models.Location, error) {
	return []models.Location{{ID: 1, Name: query}}, nil
}

type fakePlanService struct{}

func (f fakePlanService) CreatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	plan.ID = 42
	plan.Status = "draft"
	return plan, nil
}

func (f fakePlanService) ListPlans(ctx context.Context, organizationID int) ([]models.Plan, error) {
	return []models.Plan{{ID: 42, OrganizationID: organizationID, Name: "Team Offsite"}}, nil
}

func (f fakePlanService) GetPlan(ctx context.Context, planID int) (models.Plan, error) {
	return models.Plan{ID: planID, OrganizationID: 1, Name: "Team Offsite"}, nil
}

func (f fakePlanService) UpdatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	return plan, nil
}

func (f fakePlanService) DeletePlan(ctx context.Context, planID int) error {
	return nil
}

type fakeParticipantService struct{}

func (f fakeParticipantService) AddParticipants(
	ctx context.Context,
	participants []models.PlanParticipant,
) ([]models.PlanParticipant, error) {
	for index := range participants {
		participants[index].ID = index + 1
		if participants[index].Status == "" {
			participants[index].Status = "pending"
		}
		participants[index].AddedAt = time.Date(2026, 3, 20, 10, 0, 0, 0, time.UTC)
	}
	return participants, nil
}

func (f fakeParticipantService) ListParticipants(ctx context.Context, planID int) ([]models.PlanParticipant, error) {
	return []models.PlanParticipant{{ID: 1, PlanID: planID, GuestName: "Ana", DepartureCity: "Lisbon", DepartureAirportID: 1, Status: "pending"}}, nil
}

func (f fakeParticipantService) UpdateParticipant(
	ctx context.Context,
	participant models.PlanParticipant,
) (models.PlanParticipant, error) {
	return participant, nil
}

func (f fakeParticipantService) DeleteParticipant(ctx context.Context, participantID int) error {
	return nil
}

type fakeSearchService struct{}

func (f fakeSearchService) StartSearch(ctx context.Context, planID int) (service.SearchStatus, error) {
	return service.SearchStatus{
		PlanID:       planID,
		Status:       "reviewed",
		Destinations: 2,
		Participants: 1,
	}, nil
}

func (f fakeSearchService) GetSearchStatus(ctx context.Context, planID int) (service.SearchStatus, error) {
	return service.SearchStatus{
		PlanID:       planID,
		Status:       "reviewed",
		Destinations: 2,
		Participants: 1,
	}, nil
}

func (f fakeSearchService) ListDestinationResults(
	ctx context.Context,
	planID int,
) ([]service.DestinationResult, error) {
	return []service.DestinationResult{
		{
			Result: models.PlanDestination{
				ID:            11,
				PlanID:        planID,
				DestinationID: 7,
				TotalCost:     8450,
				OverallRank:   1,
			},
			Destination: models.Location{ID: 7, Name: "Panama City"},
		},
	}, nil
}

func (f fakeSearchService) GetDestinationDetail(
	ctx context.Context,
	planID int,
	destinationID int,
) (service.DestinationDetail, error) {
	return service.DestinationDetail{
		Result: service.DestinationResult{
			Result: models.PlanDestination{
				ID:            11,
				PlanID:        planID,
				DestinationID: destinationID,
				TotalCost:     8450,
				OverallRank:   1,
			},
			Destination: models.Location{ID: destinationID, Name: "Panama City"},
		},
		Flights: []service.DestinationFlightDetail{
			{
				Flight: models.PlanFlight{
					ID:              1,
					ParticipantID:   1,
					Direction:       "outbound",
					OriginAirport:   "JFK",
					DestAirport:     "PTY",
					DurationMinutes: 330,
					Price:           420,
				},
				Participant: models.PlanParticipant{
					ID:            1,
					GuestName:     "Ana",
					DepartureCity: "New York",
				},
				DisplayName:  "Ana",
				DepartureTag: "New York · JFK",
			},
		},
	}, nil
}

func TestRegionsRouteReturnsJSON(t *testing.T) {
	server := New(handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}), nil)
	request := httptest.NewRequest(http.MethodGet, "/api/v1/regions", nil)
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}

	var payload []models.Region
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid json: %v", err)
	}

	if len(payload) != 1 || payload[0].Name != "North America" {
		t.Fatalf("unexpected regions payload: %+v", payload)
	}
}

func TestCreatePlanRouteCreatesPlan(t *testing.T) {
	server := New(handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}), nil)

	body := bytes.NewBufferString(`{
		"organization_id": 1,
		"created_by_user_id": 7,
		"name": "Q2 Offsite",
		"event_start": "2026-04-06T09:00:00Z",
		"event_end": "2026-04-10T17:00:00Z",
		"event_timezone": "America/Panama",
		"arrival_buffer_hours": 12,
		"departure_buffer_hours": 4,
		"currency": "USD",
		"cabin_class": "ECONOMY",
		"search_mode": "strict"
	}`)

	request := httptest.NewRequest(http.MethodPost, "/api/v1/plans", body)
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, recorder.Code, recorder.Body.String())
	}

	var payload models.Plan
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid json: %v", err)
	}

	if payload.ID != 42 || payload.Name != "Q2 Offsite" {
		t.Fatalf("unexpected plan payload: %+v", payload)
	}
}

func TestAddParticipantsAcceptsSingleObject(t *testing.T) {
	server := New(handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}), nil)

	body := bytes.NewBufferString(`{
		"guest_name": "Ana",
		"departure_city": "Lisbon",
		"departure_airport_id": 123
	}`)

	request := httptest.NewRequest(http.MethodPost, "/api/v1/plans/42/participants", body)
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, recorder.Code, recorder.Body.String())
	}

	var payload []models.PlanParticipant
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid json: %v", err)
	}

	if len(payload) != 1 || payload[0].PlanID != 42 || payload[0].GuestName != "Ana" {
		t.Fatalf("unexpected participant payload: %+v", payload)
	}
}

func TestListPlansRequiresOrgID(t *testing.T) {
	server := New(handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}), nil)
	request := httptest.NewRequest(http.MethodGet, "/api/v1/plans", nil)
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}
}

func TestStartSearchRouteReturnsStatus(t *testing.T) {
	server := New(handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}), nil)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/plans/42/search", nil)
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var payload service.SearchStatus
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid json: %v", err)
	}

	if payload.PlanID != 42 || payload.Status != "reviewed" {
		t.Fatalf("unexpected search status: %+v", payload)
	}
}

func TestListDestinationResultsRouteReturnsRankedCards(t *testing.T) {
	server := New(handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}), nil)
	request := httptest.NewRequest(http.MethodGet, "/api/v1/plans/42/destinations", nil)
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var payload []service.DestinationResult
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid json: %v", err)
	}

	if len(payload) != 1 || payload[0].Destination.Name != "Panama City" || payload[0].Result.OverallRank != 1 {
		t.Fatalf("unexpected destination results: %+v", payload)
	}
}

func TestCORSAllowsConfiguredLocalOrigin(t *testing.T) {
	server := New(
		handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}),
		[]string{"http://127.0.0.1:5173"},
	)

	request := httptest.NewRequest(http.MethodGet, "/api/v1/regions", nil)
	request.Header.Set("Origin", "http://127.0.0.1:5173")
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Header().Get("Access-Control-Allow-Origin") != "http://127.0.0.1:5173" {
		t.Fatalf("expected access-control-allow-origin header to echo the allowed origin")
	}
}

func TestCORSHandlesPreflightRequest(t *testing.T) {
	server := New(
		handler.NewAPI(fakeReferenceService{}, fakePlanService{}, fakeParticipantService{}, fakeSearchService{}),
		[]string{"http://localhost:5173"},
	)

	request := httptest.NewRequest(http.MethodOptions, "/api/v1/plans", nil)
	request.Header.Set("Origin", "http://localhost:5173")
	recorder := httptest.NewRecorder()

	server.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, recorder.Code)
	}

	if recorder.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Fatalf("expected access-control-allow-origin header to echo the allowed origin")
	}
}

var (
	_ service.ReferenceService   = fakeReferenceService{}
	_ service.PlanService        = fakePlanService{}
	_ service.ParticipantService = fakeParticipantService{}
	_ service.SearchService      = fakeSearchService{}
)
