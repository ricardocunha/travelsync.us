package models

import (
	"encoding/json"
	"time"
)

type PlanFlight struct {
	ID                int             `json:"id"`
	PlanID            int             `json:"plan_id"`
	PlanDestinationID int             `json:"plan_destination_id"`
	ParticipantID     int             `json:"participant_id"`
	Direction         string          `json:"direction"`
	OriginAirport     string          `json:"origin_airport"`
	DestAirport       string          `json:"dest_airport"`
	DepartureTime     time.Time       `json:"departure_time"`
	ArrivalTime       time.Time       `json:"arrival_time"`
	DurationMinutes   int             `json:"duration_minutes"`
	Stops             int             `json:"stops"`
	Segments          json.RawMessage `json:"segments"`
	Price             float64         `json:"price"`
	Currency          string          `json:"currency"`
	MainCarrier       string          `json:"main_carrier"`
	CarrierCode       string          `json:"carrier_code"`
	IsSelected        bool            `json:"is_selected"`
	FilterType        string          `json:"filter_type"`
	AmadeusOfferID    string          `json:"amadeus_offer_id"`
	SearchedAt        time.Time       `json:"searched_at"`
}
