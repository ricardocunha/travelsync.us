package models

import "time"

type Organization struct {
	ID        int       `json:"id"`
	OrgName   string    `json:"org_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
