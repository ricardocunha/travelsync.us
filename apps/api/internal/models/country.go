package models

type Country struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	ISOCode string `json:"iso_code"`
	AltCode string `json:"alt_code"`
}
