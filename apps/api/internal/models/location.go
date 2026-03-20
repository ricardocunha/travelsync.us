package models

type Location struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	CountryID int     `json:"country_id"`
	RegionID  int     `json:"region_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Timezone  string  `json:"timezone"`
	IsActive  bool    `json:"is_active"`
}
