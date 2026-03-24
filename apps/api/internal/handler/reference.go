package handler

import (
	"net/http"
	"strings"
)

func (a *API) ListRegions(w http.ResponseWriter, r *http.Request) {
	items, err := a.referenceService.ListRegions(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) ListCountries(w http.ResponseWriter, r *http.Request) {
	items, err := a.referenceService.ListCountries(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) ListAirports(w http.ResponseWriter, r *http.Request) {
	countryID, err := parseOptionalQueryInt(r, "country_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "country_id must be an integer")
		return
	}

	items, err := a.referenceService.ListAirports(r.Context(), countryID, strings.TrimSpace(r.URL.Query().Get("city")))
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) ListAirlines(w http.ResponseWriter, r *http.Request) {
	items, err := a.referenceService.ListAirlines(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) ListDestinations(w http.ResponseWriter, r *http.Request) {
	items, err := a.referenceService.ListDestinations(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) GetDestination(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "destination id must be an integer")
		return
	}

	item, err := a.referenceService.GetDestination(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (a *API) SearchDestinations(w http.ResponseWriter, r *http.Request) {
	items, err := a.referenceService.SearchDestinations(
		r.Context(),
		strings.TrimSpace(r.URL.Query().Get("q")),
	)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}
