package models

import "time"

type PlanDestination struct {
	ID                   int       `json:"id"`
	PlanID               int       `json:"plan_id"`
	DestinationID        int       `json:"destination_id"`
	TotalOutboundCost    float64   `json:"total_outbound_cost"`
	TotalReturnCost      float64   `json:"total_return_cost"`
	TotalCost            float64   `json:"total_cost"`
	AvgCostPerPerson     float64   `json:"avg_cost_per_person"`
	TotalFlightHours     float64   `json:"total_flight_hours"`
	AvgFlightHours       float64   `json:"avg_flight_hours"`
	MaxFlightHours       float64   `json:"max_flight_hours"`
	MinFlightHours       float64   `json:"min_flight_hours"`
	ArrivalSpreadHours   float64   `json:"arrival_spread_hours"`
	DepartureSpreadHours float64   `json:"departure_spread_hours"`
	RankByCost           int       `json:"rank_by_cost"`
	RankByTime           int       `json:"rank_by_time"`
	RankByBalance        int       `json:"rank_by_balance"`
	OverallRank          int       `json:"overall_rank"`
	AISummary            string    `json:"ai_summary"`
	SearchedAt           time.Time `json:"searched_at"`
}
