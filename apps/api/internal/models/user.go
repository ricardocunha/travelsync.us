package models

import "time"

type User struct {
	ID               int       `json:"id"`
	Username         string    `json:"username"`
	Email            string    `json:"email"`
	PasswordHash     string    `json:"password_hash"`
	Level            string    `json:"level"`
	OrganizationID   int       `json:"organization_id"`
	City             string    `json:"city"`
	DefaultAirportID *int      `json:"default_airport_id"`
	CountryID        *int      `json:"country_id"`
	Timezone         string    `json:"timezone"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
