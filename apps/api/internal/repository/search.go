package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type SearchResultRecord struct {
	Destination models.PlanDestination
	Flights     []models.PlanFlight
}

type SearchMetadata struct {
	Destinations int
	StartedAt    *time.Time
	CompletedAt  *time.Time
}

type SearchRepository interface {
	ReplaceSearchResults(ctx context.Context, planID int, results []SearchResultRecord) error
	GetSearchMetadata(ctx context.Context, planID int) (SearchMetadata, error)
	ListDestinationResults(ctx context.Context, planID int) ([]models.PlanDestination, error)
	GetDestinationResult(ctx context.Context, planID int, destinationID int) (models.PlanDestination, error)
	ListDestinationFlights(ctx context.Context, planDestinationID int) ([]models.PlanFlight, error)
}

type MySQLSearchRepository struct {
	db *sql.DB
}

func NewMySQLSearchRepository(db *sql.DB) *MySQLSearchRepository {
	return &MySQLSearchRepository{db: db}
}

func (r *MySQLSearchRepository) ReplaceSearchResults(
	ctx context.Context,
	planID int,
	results []SearchResultRecord,
) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM plan_destinations WHERE plan_id = ?`, planID); err != nil {
		_ = tx.Rollback()
		return err
	}

	for _, result := range results {
		insertedID, err := insertPlanDestination(ctx, tx, result.Destination)
		if err != nil {
			_ = tx.Rollback()
			return err
		}

		for _, flight := range result.Flights {
			flight.PlanID = planID
			flight.PlanDestinationID = insertedID
			if err := insertPlanFlight(ctx, tx, flight); err != nil {
				_ = tx.Rollback()
				return err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (r *MySQLSearchRepository) GetSearchMetadata(
	ctx context.Context,
	planID int,
) (SearchMetadata, error) {
	var metadata SearchMetadata
	var startedAt sql.NullTime
	var completedAt sql.NullTime

	err := r.db.QueryRowContext(
		ctx,
		`SELECT COUNT(*), MIN(searched_at), MAX(searched_at)
		 FROM plan_destinations
		 WHERE plan_id = ?`,
		planID,
	).Scan(&metadata.Destinations, &startedAt, &completedAt)
	if err != nil {
		return SearchMetadata{}, err
	}

	if startedAt.Valid {
		value := startedAt.Time
		metadata.StartedAt = &value
	}
	if completedAt.Valid {
		value := completedAt.Time
		metadata.CompletedAt = &value
	}

	return metadata, nil
}

func (r *MySQLSearchRepository) ListDestinationResults(
	ctx context.Context,
	planID int,
) ([]models.PlanDestination, error) {
	rows, err := r.db.QueryContext(
		ctx,
		planDestinationSelectQuery()+` WHERE plan_id = ? ORDER BY overall_rank, total_cost, destination_id`,
		planID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.PlanDestination, 0)
	for rows.Next() {
		item, err := scanPlanDestination(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *MySQLSearchRepository) GetDestinationResult(
	ctx context.Context,
	planID int,
	destinationID int,
) (models.PlanDestination, error) {
	row := r.db.QueryRowContext(
		ctx,
		planDestinationSelectQuery()+` WHERE plan_id = ? AND destination_id = ? LIMIT 1`,
		planID,
		destinationID,
	)

	item, err := scanPlanDestination(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.PlanDestination{}, ErrNotFound
		}
		return models.PlanDestination{}, err
	}

	return item, nil
}

func (r *MySQLSearchRepository) ListDestinationFlights(
	ctx context.Context,
	planDestinationID int,
) ([]models.PlanFlight, error) {
	rows, err := r.db.QueryContext(
		ctx,
		planFlightSelectQuery()+` WHERE plan_destination_id = ? ORDER BY participant_id, FIELD(direction, 'outbound', 'return'), id`,
		planDestinationID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.PlanFlight, 0)
	for rows.Next() {
		item, err := scanPlanFlight(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

type execContexter interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

type planDestinationScanner interface {
	Scan(dest ...any) error
}

type planFlightScanner interface {
	Scan(dest ...any) error
}

func insertPlanDestination(
	ctx context.Context,
	execer execContexter,
	item models.PlanDestination,
) (int, error) {
	result, err := execer.ExecContext(
		ctx,
		`INSERT INTO plan_destinations (
			plan_id, destination_id, total_outbound_cost, total_return_cost, total_cost,
			avg_cost_per_person, total_flight_hours, avg_flight_hours, max_flight_hours,
			min_flight_hours, arrival_spread_hours, departure_spread_hours, rank_by_cost,
			rank_by_time, rank_by_balance, overall_rank, ai_summary
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		item.PlanID,
		item.DestinationID,
		item.TotalOutboundCost,
		item.TotalReturnCost,
		item.TotalCost,
		item.AvgCostPerPerson,
		item.TotalFlightHours,
		item.AvgFlightHours,
		item.MaxFlightHours,
		item.MinFlightHours,
		item.ArrivalSpreadHours,
		item.DepartureSpreadHours,
		item.RankByCost,
		item.RankByTime,
		item.RankByBalance,
		item.OverallRank,
		nullableString(item.AISummary),
	)
	if err != nil {
		return 0, err
	}

	insertedID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(insertedID), nil
}

func insertPlanFlight(
	ctx context.Context,
	execer execContexter,
	item models.PlanFlight,
) error {
	segments := item.Segments
	if len(segments) == 0 {
		segments = json.RawMessage("[]")
	}

	_, err := execer.ExecContext(
		ctx,
		`INSERT INTO plan_flights (
			plan_id, plan_destination_id, participant_id, direction, origin_airport,
			dest_airport, departure_time, arrival_time, duration_minutes, stops, segments,
			price, currency, main_carrier, carrier_code, is_selected, filter_type,
			amadeus_offer_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		item.PlanID,
		item.PlanDestinationID,
		item.ParticipantID,
		item.Direction,
		item.OriginAirport,
		item.DestAirport,
		item.DepartureTime,
		item.ArrivalTime,
		item.DurationMinutes,
		item.Stops,
		[]byte(segments),
		item.Price,
		item.Currency,
		nullableString(item.MainCarrier),
		nullableString(item.CarrierCode),
		item.IsSelected,
		nullableString(item.FilterType),
		nullableString(item.AmadeusOfferID),
	)
	return err
}

func planDestinationSelectQuery() string {
	return `SELECT id, plan_id, destination_id, total_outbound_cost, total_return_cost, total_cost,
		avg_cost_per_person, total_flight_hours, avg_flight_hours, max_flight_hours,
		min_flight_hours, arrival_spread_hours, departure_spread_hours, rank_by_cost,
		rank_by_time, rank_by_balance, overall_rank, ai_summary, searched_at
		FROM plan_destinations`
}

func planFlightSelectQuery() string {
	return `SELECT id, plan_id, plan_destination_id, participant_id, direction, origin_airport,
		dest_airport, departure_time, arrival_time, duration_minutes, stops, segments, price,
		currency, main_carrier, carrier_code, is_selected, filter_type, amadeus_offer_id,
		searched_at
		FROM plan_flights`
}

func scanPlanDestination(scanner planDestinationScanner) (models.PlanDestination, error) {
	var item models.PlanDestination
	var aiSummary sql.NullString

	err := scanner.Scan(
		&item.ID,
		&item.PlanID,
		&item.DestinationID,
		&item.TotalOutboundCost,
		&item.TotalReturnCost,
		&item.TotalCost,
		&item.AvgCostPerPerson,
		&item.TotalFlightHours,
		&item.AvgFlightHours,
		&item.MaxFlightHours,
		&item.MinFlightHours,
		&item.ArrivalSpreadHours,
		&item.DepartureSpreadHours,
		&item.RankByCost,
		&item.RankByTime,
		&item.RankByBalance,
		&item.OverallRank,
		&aiSummary,
		&item.SearchedAt,
	)
	if err != nil {
		return models.PlanDestination{}, err
	}

	item.AISummary = aiSummary.String
	return item, nil
}

func scanPlanFlight(scanner planFlightScanner) (models.PlanFlight, error) {
	var item models.PlanFlight
	var segments []byte
	var mainCarrier sql.NullString
	var carrierCode sql.NullString
	var filterType sql.NullString
	var amadeusOfferID sql.NullString

	err := scanner.Scan(
		&item.ID,
		&item.PlanID,
		&item.PlanDestinationID,
		&item.ParticipantID,
		&item.Direction,
		&item.OriginAirport,
		&item.DestAirport,
		&item.DepartureTime,
		&item.ArrivalTime,
		&item.DurationMinutes,
		&item.Stops,
		&segments,
		&item.Price,
		&item.Currency,
		&mainCarrier,
		&carrierCode,
		&item.IsSelected,
		&filterType,
		&amadeusOfferID,
		&item.SearchedAt,
	)
	if err != nil {
		return models.PlanFlight{}, err
	}

	item.Segments = append(json.RawMessage(nil), segments...)
	item.MainCarrier = mainCarrier.String
	item.CarrierCode = carrierCode.String
	item.FilterType = filterType.String
	item.AmadeusOfferID = amadeusOfferID.String
	return item, nil
}
