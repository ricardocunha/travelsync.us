package models

type Airline struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Code      string `json:"code"`
	CountryID int    `json:"country_id"`
}
