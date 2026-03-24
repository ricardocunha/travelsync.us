package service

import (
	"context"
	"strings"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
	"github.com/ricardocunha/travelsync/apps/api/internal/repository"
)

type ParticipantService interface {
	AddParticipants(ctx context.Context, participants []models.PlanParticipant) ([]models.PlanParticipant, error)
	ListParticipants(ctx context.Context, planID int) ([]models.PlanParticipant, error)
	UpdateParticipant(ctx context.Context, participant models.PlanParticipant) (models.PlanParticipant, error)
	DeleteParticipant(ctx context.Context, participantID int) error
}

type participantService struct {
	planRepo        repository.PlanRepository
	participantRepo repository.ParticipantRepository
}

func NewParticipantService(
	planRepo repository.PlanRepository,
	participantRepo repository.ParticipantRepository,
) ParticipantService {
	return &participantService{
		planRepo:        planRepo,
		participantRepo: participantRepo,
	}
}

func (s *participantService) AddParticipants(
	ctx context.Context,
	participants []models.PlanParticipant,
) ([]models.PlanParticipant, error) {
	if len(participants) == 0 {
		return nil, ValidationError{Message: "at least one participant is required"}
	}

	for _, participant := range participants {
		if _, err := s.planRepo.GetPlan(ctx, participant.PlanID); err != nil {
			return nil, err
		}
	}

	for index, participant := range participants {
		normalized, err := normalizeParticipant(participant)
		if err != nil {
			return nil, err
		}
		participants[index] = normalized
	}

	return s.participantRepo.AddParticipants(ctx, participants)
}

func (s *participantService) ListParticipants(
	ctx context.Context,
	planID int,
) ([]models.PlanParticipant, error) {
	if planID <= 0 {
		return nil, ValidationError{Message: "plan id must be positive"}
	}
	return s.participantRepo.ListParticipants(ctx, planID)
}

func (s *participantService) UpdateParticipant(
	ctx context.Context,
	participant models.PlanParticipant,
) (models.PlanParticipant, error) {
	if participant.ID <= 0 {
		return models.PlanParticipant{}, ValidationError{Message: "participant id must be positive"}
	}
	if _, err := s.planRepo.GetPlan(ctx, participant.PlanID); err != nil {
		return models.PlanParticipant{}, err
	}
	normalized, err := normalizeParticipant(participant)
	if err != nil {
		return models.PlanParticipant{}, err
	}

	return s.participantRepo.UpdateParticipant(ctx, normalized)
}

func (s *participantService) DeleteParticipant(ctx context.Context, participantID int) error {
	if participantID <= 0 {
		return ValidationError{Message: "participant id must be positive"}
	}
	return s.participantRepo.DeleteParticipant(ctx, participantID)
}

func normalizeParticipant(participant models.PlanParticipant) (models.PlanParticipant, error) {
	if participant.PlanID <= 0 {
		return models.PlanParticipant{}, ValidationError{Message: "plan_id must be positive"}
	}
	if participant.DepartureAirportID <= 0 {
		return models.PlanParticipant{}, ValidationError{Message: "departure_airport_id must be positive"}
	}
	if strings.TrimSpace(participant.DepartureCity) == "" {
		return models.PlanParticipant{}, ValidationError{Message: "departure_city is required"}
	}
	if participant.UserID == nil && strings.TrimSpace(participant.GuestName) == "" {
		return models.PlanParticipant{}, ValidationError{Message: "either user_id or guest_name is required"}
	}
	if participant.Status == "" {
		participant.Status = "pending"
	}

	switch participant.Status {
	case "pending", "confirmed", "declined":
		return participant, nil
	default:
		return models.PlanParticipant{}, ValidationError{Message: "status must be one of pending, confirmed, or declined"}
	}
}
