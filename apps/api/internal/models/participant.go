package models

import "time"

type PlanParticipant struct {
	ID                 int       `json:"id"`
	PlanID             int       `json:"plan_id"`
	UserID             *int      `json:"user_id"`
	GuestName          string    `json:"guest_name"`
	GuestEmail         string    `json:"guest_email"`
	DepartureCity      string    `json:"departure_city"`
	DepartureAirportID int       `json:"departure_airport_id"`
	DepartureCountryID *int      `json:"departure_country_id"`
	Status             string    `json:"status"`
	AddedAt            time.Time `json:"added_at"`
}
