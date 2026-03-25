package handler

import "net/http"

func (a *API) StartSearch(w http.ResponseWriter, r *http.Request) {
	planID, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	status, err := a.searchService.StartSearch(r.Context(), planID)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, status)
}

func (a *API) GetSearchStatus(w http.ResponseWriter, r *http.Request) {
	planID, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	status, err := a.searchService.GetSearchStatus(r.Context(), planID)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, status)
}

func (a *API) ListDestinationResults(w http.ResponseWriter, r *http.Request) {
	planID, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	items, err := a.searchService.ListDestinationResults(r.Context(), planID)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, items)
}

func (a *API) GetDestinationResult(w http.ResponseWriter, r *http.Request) {
	planID, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	destinationID, err := parsePathID(r, "did")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "destination id must be an integer")
		return
	}

	item, err := a.searchService.GetDestinationDetail(r.Context(), planID, destinationID)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, item)
}

func RecommendDestination(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w, "destination recommendation is scaffolded but not implemented yet")
}

func SelectDestination(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w, "destination selection is scaffolded but not implemented yet")
}
