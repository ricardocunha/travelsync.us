package service

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
	"github.com/ricardocunha/travelsync/apps/api/internal/repository"
)

type PlanService interface {
	CreatePlan(ctx context.Context, plan models.Plan) (models.Plan, error)
	ListPlans(ctx context.Context, organizationID int) ([]models.Plan, error)
	GetPlan(ctx context.Context, planID int) (models.Plan, error)
	UpdatePlan(ctx context.Context, plan models.Plan) (models.Plan, error)
	DeletePlan(ctx context.Context, planID int) error
}

type planService struct {
	repo repository.PlanRepository
}

func NewPlanService(repo repository.PlanRepository) PlanService {
	return &planService{repo: repo}
}

func (s *planService) CreatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	normalized, err := normalizePlan(plan)
	if err != nil {
		return models.Plan{}, err
	}
	return s.repo.CreatePlan(ctx, normalized)
}

func (s *planService) ListPlans(ctx context.Context, organizationID int) ([]models.Plan, error) {
	if organizationID <= 0 {
		return nil, ValidationError{Message: "org_id must be positive"}
	}
	return s.repo.ListPlans(ctx, organizationID)
}

func (s *planService) GetPlan(ctx context.Context, planID int) (models.Plan, error) {
	if planID <= 0 {
		return models.Plan{}, ValidationError{Message: "plan id must be positive"}
	}
	return s.repo.GetPlan(ctx, planID)
}

func (s *planService) UpdatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	if plan.ID <= 0 {
		return models.Plan{}, ValidationError{Message: "plan id must be positive"}
	}
	normalized, err := normalizePlan(plan)
	if err != nil {
		return models.Plan{}, err
	}
	normalized.ID = plan.ID
	return s.repo.UpdatePlan(ctx, normalized)
}

func (s *planService) DeletePlan(ctx context.Context, planID int) error {
	if planID <= 0 {
		return ValidationError{Message: "plan id must be positive"}
	}
	return s.repo.DeletePlan(ctx, planID)
}

func normalizePlan(plan models.Plan) (models.Plan, error) {
	if plan.OrganizationID <= 0 {
		return models.Plan{}, ValidationError{Message: "organization_id must be positive"}
	}
	if plan.CreatedByUserID <= 0 {
		return models.Plan{}, ValidationError{Message: "created_by_user_id must be positive"}
	}
	if strings.TrimSpace(plan.Name) == "" {
		return models.Plan{}, ValidationError{Message: "name is required"}
	}
	if strings.TrimSpace(plan.EventTimezone) == "" {
		return models.Plan{}, ValidationError{Message: "event_timezone is required"}
	}
	if !plan.EventEnd.After(plan.EventStart) {
		return models.Plan{}, ValidationError{Message: "event_end must be after event_start"}
	}
	if plan.ArrivalBufferHours < 0 {
		return models.Plan{}, ValidationError{Message: "arrival_buffer_hours must be >= 0"}
	}
	if plan.DepartureBufferHours < 0 {
		return models.Plan{}, ValidationError{Message: "departure_buffer_hours must be >= 0"}
	}

	if plan.Currency == "" {
		plan.Currency = "USD"
	}
	if len(plan.Currency) != 3 {
		return models.Plan{}, ValidationError{Message: "currency must be a valid 3-letter ISO code"}
	}
	plan.Currency = strings.ToUpper(plan.Currency)

	if plan.CabinClass == "" {
		plan.CabinClass = "ECONOMY"
	}
	switch plan.CabinClass {
	case "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST":
	default:
		return models.Plan{}, ValidationError{Message: "cabin_class is invalid"}
	}

	if plan.SearchMode == "" {
		plan.SearchMode = "strict"
	}
	switch plan.SearchMode {
	case "strict", "flexible":
	default:
		return models.Plan{}, ValidationError{Message: "search_mode must be strict or flexible"}
	}

	if plan.Status == "" {
		plan.Status = "draft"
	}
	switch plan.Status {
	case "draft", "searching", "reviewed", "booked", "completed", "cancelled":
	default:
		return models.Plan{}, ValidationError{Message: "status is invalid"}
	}

	if len(plan.RegionFilterIDs) > 0 && !json.Valid(plan.RegionFilterIDs) {
		return models.Plan{}, ValidationError{Message: "region_filter_ids must be valid JSON"}
	}

	return plan, nil
}
