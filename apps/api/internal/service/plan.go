package service

import (
	"context"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type PlanService interface {
	CreatePlan(ctx context.Context, plan models.Plan) (models.Plan, error)
	ListPlans(ctx context.Context, organizationID int) ([]models.Plan, error)
	GetPlan(ctx context.Context, planID int) (models.Plan, error)
	UpdatePlan(ctx context.Context, plan models.Plan) (models.Plan, error)
	DeletePlan(ctx context.Context, planID int) error
}
