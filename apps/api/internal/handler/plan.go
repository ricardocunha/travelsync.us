package handler

import (
	"net/http"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

func (a *API) CreatePlan(w http.ResponseWriter, r *http.Request) {
	var request models.Plan
	if err := decodeJSON(r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body must be valid JSON")
		return
	}

	item, err := a.planService.CreatePlan(r.Context(), request)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (a *API) ListPlans(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("org_id") == "" {
		writeError(w, http.StatusBadRequest, "invalid_request", "org_id is required")
		return
	}

	orgID, err := parseOptionalQueryInt(r, "org_id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "org_id must be an integer")
		return
	}

	items, err := a.planService.ListPlans(r.Context(), orgID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) GetPlan(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	item, err := a.planService.GetPlan(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (a *API) UpdatePlan(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	var request models.Plan
	if err := decodeJSON(r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body must be valid JSON")
		return
	}
	request.ID = id

	item, err := a.planService.UpdatePlan(r.Context(), request)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (a *API) DeletePlan(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	if err := a.planService.DeletePlan(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
