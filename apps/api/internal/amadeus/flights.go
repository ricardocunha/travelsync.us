package amadeus

import (
	"context"
	"errors"
)

var ErrNotImplemented = errors.New("amadeus integration not implemented")

func (c *Client) SearchFlightOffers(ctx context.Context, req SearchFlightsRequest) ([]FlightOffer, error) {
	_ = ctx
	_ = req
	return nil, ErrNotImplemented
}
