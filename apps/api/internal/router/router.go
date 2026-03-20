package router

import (
	"net/http"

	"github.com/ricardocunha/travelsync/apps/api/internal/handler"
)

func New() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handler.Health)

	mux.HandleFunc("GET /api/v1/regions", handler.ListRegions)
	mux.HandleFunc("GET /api/v1/countries", handler.ListCountries)
	mux.HandleFunc("GET /api/v1/airports", handler.ListAirports)
	mux.HandleFunc("GET /api/v1/airlines", handler.ListAirlines)
	mux.HandleFunc("GET /api/v1/destinations", handler.ListDestinations)
	mux.HandleFunc("GET /api/v1/destinations/search", handler.SearchDestinations)
	mux.HandleFunc("GET /api/v1/destinations/{id}", handler.GetDestination)

	mux.HandleFunc("POST /api/v1/plans", handler.CreatePlan)
	mux.HandleFunc("GET /api/v1/plans", handler.ListPlans)
	mux.HandleFunc("GET /api/v1/plans/{id}", handler.GetPlan)
	mux.HandleFunc("PUT /api/v1/plans/{id}", handler.UpdatePlan)
	mux.HandleFunc("DELETE /api/v1/plans/{id}", handler.DeletePlan)

	mux.HandleFunc("POST /api/v1/plans/{id}/participants", handler.AddParticipants)
	mux.HandleFunc("GET /api/v1/plans/{id}/participants", handler.ListParticipants)
	mux.HandleFunc("PUT /api/v1/plans/{id}/participants/{pid}", handler.UpdateParticipant)
	mux.HandleFunc("DELETE /api/v1/plans/{id}/participants/{pid}", handler.DeleteParticipant)

	mux.HandleFunc("POST /api/v1/plans/{id}/search", handler.StartSearch)
	mux.HandleFunc("GET /api/v1/plans/{id}/search/status", handler.GetSearchStatus)
	mux.HandleFunc("GET /api/v1/plans/{id}/destinations", handler.ListDestinationResults)
	mux.HandleFunc("GET /api/v1/plans/{id}/destinations/{did}", handler.GetDestinationResult)
	mux.HandleFunc("POST /api/v1/plans/{id}/recommend", handler.RecommendDestination)
	mux.HandleFunc("POST /api/v1/plans/{id}/select", handler.SelectDestination)
	mux.HandleFunc("GET /api/v1/plans/{id}/summary", handler.GetSummary)

	return handler.Recover(handler.Logging(mux))
}
