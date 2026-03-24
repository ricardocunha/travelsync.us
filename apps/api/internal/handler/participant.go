package handler

import (
	"bytes"
	"encoding/json"
	"net/http"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
	"github.com/ricardocunha/travelsync/apps/api/internal/service"
)

func (a *API) AddParticipants(w http.ResponseWriter, r *http.Request) {
	planID, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	rawBody := new(bytes.Buffer)
	if _, err := rawBody.ReadFrom(r.Body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body must be readable")
		return
	}

	participants, err := decodeParticipantPayload(rawBody.Bytes(), planID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	items, err := a.participantService.AddParticipants(r.Context(), participants)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, items)
}

func (a *API) ListParticipants(w http.ResponseWriter, r *http.Request) {
	planID, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}

	items, err := a.participantService.ListParticipants(r.Context(), planID)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) UpdateParticipant(w http.ResponseWriter, r *http.Request) {
	planID, err := parsePathID(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "plan id must be an integer")
		return
	}
	participantID, err := parsePathID(r, "pid")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "participant id must be an integer")
		return
	}

	var request models.PlanParticipant
	if err := decodeJSON(r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body must be valid JSON")
		return
	}
	request.ID = participantID
	request.PlanID = planID

	item, err := a.participantService.UpdateParticipant(r.Context(), request)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (a *API) DeleteParticipant(w http.ResponseWriter, r *http.Request) {
	participantID, err := parsePathID(r, "pid")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "participant id must be an integer")
		return
	}

	if err := a.participantService.DeleteParticipant(r.Context(), participantID); err != nil {
		handleError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func decodeParticipantPayload(payload []byte, planID int) ([]models.PlanParticipant, error) {
	trimmed := bytes.TrimSpace(payload)
	if len(trimmed) == 0 {
		return nil, service.ValidationError{Message: "request body is required"}
	}

	if trimmed[0] == '[' {
		var participants []models.PlanParticipant
		decoder := json.NewDecoder(bytes.NewReader(trimmed))
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&participants); err != nil {
			return nil, err
		}
		for index := range participants {
			participants[index].PlanID = planID
			if participants[index].Status == "" {
				participants[index].Status = "pending"
			}
		}
		return participants, nil
	}

	var participant models.PlanParticipant
	decoder := json.NewDecoder(bytes.NewReader(trimmed))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&participant); err != nil {
		return nil, err
	}
	participant.PlanID = planID
	if participant.Status == "" {
		participant.Status = "pending"
	}
	return []models.PlanParticipant{participant}, nil
}
