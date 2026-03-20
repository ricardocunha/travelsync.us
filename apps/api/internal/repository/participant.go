package repository

import (
	"context"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type ParticipantRepository interface {
	AddParticipants(ctx context.Context, participants []models.PlanParticipant) ([]models.PlanParticipant, error)
	ListParticipants(ctx context.Context, planID int) ([]models.PlanParticipant, error)
	UpdateParticipant(ctx context.Context, participant models.PlanParticipant) (models.PlanParticipant, error)
	DeleteParticipant(ctx context.Context, participantID int) error
}
