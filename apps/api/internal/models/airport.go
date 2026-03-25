package models

type Airport struct {
	ID             int     `json:"id"`
	Name           string  `json:"name"`
	City           string  `json:"city"`
	CountryID      int     `json:"country_id"`
	IATACode       string  `json:"iata_code"`
	ICAOCode       string  `json:"icao_code"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
	Altitude       int     `json:"altitude"`
	TimezoneOffset float64 `json:"timezone_offset"`
	TimezoneCode   string  `json:"timezone_code"`
	Type           string  `json:"type"`
}
