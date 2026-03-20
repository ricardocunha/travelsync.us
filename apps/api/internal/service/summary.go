package service

import (
	"context"
	"time"
)

type SummaryPlan struct {
	Name        string    `json:"name"`
	Destination string    `json:"destination"`
	EventStart  time.Time `json:"event_start"`
	EventEnd    time.Time `json:"event_end"`
	Currency    string    `json:"currency"`
}

type SummaryTotals struct {
	TotalCost         float64 `json:"total_cost"`
	AvgCostPerPerson  float64 `json:"avg_cost_per_person"`
	TotalFlightHours  float64 `json:"total_flight_hours"`
	AvgFlightHours    float64 `json:"avg_flight_hours"`
	ParticipantsCount int     `json:"participants_count"`
	ArrivalWindow     string  `json:"arrival_window"`
	DepartureWindow   string  `json:"departure_window"`
}

type SummaryFlight struct {
	Flight   string  `json:"flight"`
	Departs  string  `json:"departs"`
	Arrives  string  `json:"arrives"`
	Duration string  `json:"duration"`
	Stops    int     `json:"stops"`
	Price    float64 `json:"price"`
	Carrier  string  `json:"carrier"`
}

type SummaryParticipant struct {
	Name       string        `json:"name"`
	Airport    string        `json:"airport"`
	Outbound   SummaryFlight `json:"outbound"`
	Return     SummaryFlight `json:"return"`
	TotalPrice float64       `json:"total_price"`
}

type SummaryOriginGroup struct {
	City         string               `json:"city"`
	Country      string               `json:"country"`
	Count        int                  `json:"count"`
	Participants []SummaryParticipant `json:"participants"`
}

type SummaryResponse struct {
	Plan           SummaryPlan          `json:"plan"`
	Totals         SummaryTotals        `json:"totals"`
	ByOrigin       []SummaryOriginGroup `json:"by_origin"`
	Recommendation string               `json:"recommendation"`
}

type SummaryService interface {
	Build(ctx context.Context, planID int) (SummaryResponse, error)
}
