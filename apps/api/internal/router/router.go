package router

import (
	"net/http"

	"github.com/ricardocunha/travelsync/apps/api/internal/handler"
)

func New(api *handler.API, allowedOrigins []string) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handler.Health)

	mux.HandleFunc("GET /api/v1/regions", api.ListRegions)
	mux.HandleFunc("GET /api/v1/countries", api.ListCountries)
	mux.HandleFunc("GET /api/v1/airports", api.ListAirports)
	mux.HandleFunc("GET /api/v1/airlines", api.ListAirlines)
	mux.HandleFunc("GET /api/v1/destinations", api.ListDestinations)
	mux.HandleFunc("GET /api/v1/destinations/search", api.SearchDestinations)
	mux.HandleFunc("GET /api/v1/destinations/{id}", api.GetDestination)

	mux.HandleFunc("POST /api/v1/plans", api.CreatePlan)
	mux.HandleFunc("GET /api/v1/plans", api.ListPlans)
	mux.HandleFunc("GET /api/v1/plans/{id}", api.GetPlan)
	mux.HandleFunc("PUT /api/v1/plans/{id}", api.UpdatePlan)
	mux.HandleFunc("DELETE /api/v1/plans/{id}", api.DeletePlan)

	mux.HandleFunc("POST /api/v1/plans/{id}/participants", api.AddParticipants)
	mux.HandleFunc("GET /api/v1/plans/{id}/participants", api.ListParticipants)
	mux.HandleFunc("PUT /api/v1/plans/{id}/participants/{pid}", api.UpdateParticipant)
	mux.HandleFunc("DELETE /api/v1/plans/{id}/participants/{pid}", api.DeleteParticipant)

	mux.HandleFunc("POST /api/v1/plans/{id}/search", handler.StartSearch)
	mux.HandleFunc("GET /api/v1/plans/{id}/search/status", handler.GetSearchStatus)
	mux.HandleFunc("GET /api/v1/plans/{id}/destinations", handler.ListDestinationResults)
	mux.HandleFunc("GET /api/v1/plans/{id}/destinations/{did}", handler.GetDestinationResult)
	mux.HandleFunc("POST /api/v1/plans/{id}/recommend", handler.RecommendDestination)
	mux.HandleFunc("POST /api/v1/plans/{id}/select", handler.SelectDestination)
	mux.HandleFunc("GET /api/v1/plans/{id}/summary", handler.GetSummary)

	return handler.Recover(handler.Logging(handler.CORS(allowedOrigins, mux)))
}
