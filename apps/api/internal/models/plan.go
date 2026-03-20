package models

import (
	"encoding/json"
	"time"
)

type Plan struct {
	ID                   int             `json:"id"`
	OrganizationID       int             `json:"organization_id"`
	CreatedByUserID      int             `json:"created_by_user_id"`
	Name                 string          `json:"name"`
	Description          string          `json:"description"`
	EventStart           time.Time       `json:"event_start"`
	EventEnd             time.Time       `json:"event_end"`
	EventTimezone        string          `json:"event_timezone"`
	ArrivalBufferHours   int             `json:"arrival_buffer_hours"`
	DepartureBufferHours int             `json:"departure_buffer_hours"`
	MaxBudgetPerPerson   *float64        `json:"max_budget_per_person"`
	Currency             string          `json:"currency"`
	CabinClass           string          `json:"cabin_class"`
	SearchMode           string          `json:"search_mode"`
	Status               string          `json:"status"`
	ChosenDestinationID  *int            `json:"chosen_destination_id"`
	RegionFilterIDs      json.RawMessage `json:"region_filter_ids"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}
