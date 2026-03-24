package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type PlanRepository interface {
	CreatePlan(ctx context.Context, plan models.Plan) (models.Plan, error)
	ListPlans(ctx context.Context, organizationID int) ([]models.Plan, error)
	GetPlan(ctx context.Context, planID int) (models.Plan, error)
	UpdatePlan(ctx context.Context, plan models.Plan) (models.Plan, error)
	DeletePlan(ctx context.Context, planID int) error
}

type MySQLPlanRepository struct {
	db *sql.DB
}

func NewMySQLPlanRepository(db *sql.DB) *MySQLPlanRepository {
	return &MySQLPlanRepository{db: db}
}

func (r *MySQLPlanRepository) CreatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	result, err := r.db.ExecContext(
		ctx,
		`INSERT INTO plans (
			organization_id, created_by_user_id, name, description, event_start, event_end,
			event_timezone, arrival_buffer_hours, departure_buffer_hours, max_budget_per_person,
			currency, cabin_class, search_mode, status, chosen_destination_id, region_filter_ids
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		plan.OrganizationID,
		plan.CreatedByUserID,
		plan.Name,
		nullableString(plan.Description),
		plan.EventStart,
		plan.EventEnd,
		plan.EventTimezone,
		plan.ArrivalBufferHours,
		plan.DepartureBufferHours,
		nullableFloat(plan.MaxBudgetPerPerson),
		plan.Currency,
		plan.CabinClass,
		plan.SearchMode,
		plan.Status,
		nullableInt(plan.ChosenDestinationID),
		nullableJSON(plan.RegionFilterIDs),
	)
	if err != nil {
		return models.Plan{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Plan{}, err
	}

	return r.GetPlan(ctx, int(id))
}

func (r *MySQLPlanRepository) ListPlans(ctx context.Context, organizationID int) ([]models.Plan, error) {
	rows, err := r.db.QueryContext(ctx, planSelectQuery()+` WHERE organization_id = ? ORDER BY created_at DESC`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Plan, 0)
	for rows.Next() {
		item, err := scanPlan(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *MySQLPlanRepository) GetPlan(ctx context.Context, planID int) (models.Plan, error) {
	row := r.db.QueryRowContext(ctx, planSelectQuery()+` WHERE id = ? LIMIT 1`, planID)
	item, err := scanPlan(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Plan{}, ErrNotFound
		}
		return models.Plan{}, err
	}
	return item, nil
}

func (r *MySQLPlanRepository) UpdatePlan(ctx context.Context, plan models.Plan) (models.Plan, error) {
	result, err := r.db.ExecContext(
		ctx,
		`UPDATE plans
		 SET organization_id = ?, created_by_user_id = ?, name = ?, description = ?,
		     event_start = ?, event_end = ?, event_timezone = ?, arrival_buffer_hours = ?,
		     departure_buffer_hours = ?, max_budget_per_person = ?, currency = ?, cabin_class = ?,
		     search_mode = ?, status = ?, chosen_destination_id = ?, region_filter_ids = ?,
		     updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
		plan.OrganizationID,
		plan.CreatedByUserID,
		plan.Name,
		nullableString(plan.Description),
		plan.EventStart,
		plan.EventEnd,
		plan.EventTimezone,
		plan.ArrivalBufferHours,
		plan.DepartureBufferHours,
		nullableFloat(plan.MaxBudgetPerPerson),
		plan.Currency,
		plan.CabinClass,
		plan.SearchMode,
		plan.Status,
		nullableInt(plan.ChosenDestinationID),
		nullableJSON(plan.RegionFilterIDs),
		plan.ID,
	)
	if err != nil {
		return models.Plan{}, err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return models.Plan{}, err
	}
	if affected == 0 {
		return models.Plan{}, ErrNotFound
	}

	return r.GetPlan(ctx, plan.ID)
}

func (r *MySQLPlanRepository) DeletePlan(ctx context.Context, planID int) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM plans WHERE id = ?`, planID)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrNotFound
	}

	return nil
}

type planScanner interface {
	Scan(dest ...any) error
}

func planSelectQuery() string {
	return `SELECT id, organization_id, created_by_user_id, name, description, event_start, event_end,
		event_timezone, arrival_buffer_hours, departure_buffer_hours, max_budget_per_person, currency,
		cabin_class, search_mode, status, chosen_destination_id, region_filter_ids, created_at, updated_at
		FROM plans`
}

func scanPlan(scanner planScanner) (models.Plan, error) {
	var item models.Plan
	var description sql.NullString
	var maxBudget sql.NullFloat64
	var chosenDestinationID sql.NullInt64
	var regionFilterRaw []byte
	var createdAt time.Time
	var updatedAt time.Time

	err := scanner.Scan(
		&item.ID,
		&item.OrganizationID,
		&item.CreatedByUserID,
		&item.Name,
		&description,
		&item.EventStart,
		&item.EventEnd,
		&item.EventTimezone,
		&item.ArrivalBufferHours,
		&item.DepartureBufferHours,
		&maxBudget,
		&item.Currency,
		&item.CabinClass,
		&item.SearchMode,
		&item.Status,
		&chosenDestinationID,
		&regionFilterRaw,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return models.Plan{}, err
	}

	item.Description = description.String
	if maxBudget.Valid {
		value := maxBudget.Float64
		item.MaxBudgetPerPerson = &value
	}
	if chosenDestinationID.Valid {
		value := int(chosenDestinationID.Int64)
		item.ChosenDestinationID = &value
	}
	if len(regionFilterRaw) > 0 {
		item.RegionFilterIDs = append(json.RawMessage(nil), regionFilterRaw...)
	}
	item.CreatedAt = createdAt
	item.UpdatedAt = updatedAt

	return item, nil
}

func nullableString(value string) any {
	if value == "" {
		return nil
	}
	return value
}

func nullableFloat(value *float64) any {
	if value == nil {
		return nil
	}
	return *value
}

func nullableInt(value *int) any {
	if value == nil {
		return nil
	}
	return *value
}

func nullableJSON(value json.RawMessage) any {
	if len(value) == 0 {
		return nil
	}
	return []byte(value)
}
