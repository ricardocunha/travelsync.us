package handler

import "github.com/ricardocunha/travelsync/apps/api/internal/service"

type API struct {
	referenceService   service.ReferenceService
	planService        service.PlanService
	participantService service.ParticipantService
}

func NewAPI(
	referenceService service.ReferenceService,
	planService service.PlanService,
	participantService service.ParticipantService,
) *API {
	return &API{
		referenceService:   referenceService,
		planService:        planService,
		participantService: participantService,
	}
}
