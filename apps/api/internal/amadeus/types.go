package amadeus

import "time"

type SearchFlightsRequest struct {
	OriginAirport       string
	DestinationAirports []string
	DepartureDate       time.Time
	ReturnDate          time.Time
	CabinClass          string
	Adults              int
}

type FlightSegment struct {
	CarrierCode      string    `json:"carrier_code"`
	FlightNumber     string    `json:"flight_number"`
	DepartureAirport string    `json:"departure_airport"`
	ArrivalAirport   string    `json:"arrival_airport"`
	DepartureTime    time.Time `json:"departure_time"`
	ArrivalTime      time.Time `json:"arrival_time"`
}

type FlightOffer struct {
	ID              string          `json:"id"`
	OriginAirport   string          `json:"origin_airport"`
	DestAirport     string          `json:"dest_airport"`
	DepartureTime   time.Time       `json:"departure_time"`
	ArrivalTime     time.Time       `json:"arrival_time"`
	DurationMinutes int             `json:"duration_minutes"`
	Stops           int             `json:"stops"`
	Price           float64         `json:"price"`
	Currency        string          `json:"currency"`
	MainCarrier     string          `json:"main_carrier"`
	CarrierCode     string          `json:"carrier_code"`
	Segments        []FlightSegment `json:"segments"`
}
