package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type ReferenceRepository interface {
	ListRegions(ctx context.Context) ([]models.Region, error)
	ListCountries(ctx context.Context) ([]models.Country, error)
	ListAirports(ctx context.Context, countryID int, city string) ([]models.Airport, error)
	ListAirlines(ctx context.Context) ([]models.Airline, error)
	ListDestinations(ctx context.Context) ([]models.Location, error)
	GetDestination(ctx context.Context, destinationID int) (models.Location, error)
	SearchDestinations(ctx context.Context, query string) ([]models.Location, error)
}

type MySQLReferenceRepository struct {
	db *sql.DB
}

func NewMySQLReferenceRepository(db *sql.DB) *MySQLReferenceRepository {
	return &MySQLReferenceRepository{db: db}
}

func (r *MySQLReferenceRepository) ListRegions(ctx context.Context) ([]models.Region, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name FROM regions ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Region, 0)
	for rows.Next() {
		var item models.Region
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *MySQLReferenceRepository) ListCountries(ctx context.Context) ([]models.Country, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, iso_code, alt_code FROM countries ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Country, 0)
	for rows.Next() {
		var item models.Country
		if err := rows.Scan(&item.ID, &item.Name, &item.ISOCode, &item.AltCode); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *MySQLReferenceRepository) ListAirports(
	ctx context.Context,
	countryID int,
	city string,
) ([]models.Airport, error) {
	query, args := buildAirportSearchQuery(countryID, city)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Airport, 0)
	for rows.Next() {
		var item models.Airport
		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.City,
			&item.CountryID,
			&item.IATACode,
			&item.ICAOCode,
			&item.Latitude,
			&item.Longitude,
			&item.Altitude,
			&item.TimezoneOffset,
			&item.TimezoneCode,
			&item.Type,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func buildAirportSearchQuery(countryID int, searchTerm string) (string, []any) {
	query := `
		SELECT DISTINCT
			a.id,
			a.name,
			a.city,
			a.country_id,
			a.iata_code,
			a.icao_code,
			a.latitude,
			a.longitude,
			a.altitude,
			a.timezone_offset,
			a.timezone_code,
			a.type
		FROM airports a
		LEFT JOIN locations_airport la
			ON la.airport_id = a.id
			AND la.is_active = true
		LEFT JOIN locations l
			ON l.id = la.location_id
			AND l.is_active = true
	`

	clauses := make([]string, 0, 3)
	args := make([]any, 0, 5)

	if countryID > 0 {
		clauses = append(clauses, "a.country_id = ?")
		args = append(args, countryID)
	}

	trimmedTerm := strings.TrimSpace(searchTerm)
	if trimmedTerm != "" {
		textPattern := "%" + trimmedTerm + "%"
		iataPattern := strings.ToUpper(trimmedTerm) + "%"

		clauses = append(
			clauses,
			`(
				a.city COLLATE utf8mb4_0900_ai_ci LIKE ?
				OR a.name COLLATE utf8mb4_0900_ai_ci LIKE ?
				OR COALESCE(l.name, '') COLLATE utf8mb4_0900_ai_ci LIKE ?
				OR a.iata_code LIKE ?
			)`,
		)
		args = append(args, textPattern, textPattern, textPattern, iataPattern)
	}

	if len(clauses) > 0 {
		query += " WHERE " + strings.Join(clauses, " AND ")
	}

	query += `
		ORDER BY
			a.city,
			a.name
		LIMIT 200
	`

	return query, args
}

func (r *MySQLReferenceRepository) ListAirlines(ctx context.Context) ([]models.Airline, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, code, country_id FROM airlines ORDER BY name LIMIT 500`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Airline, 0)
	for rows.Next() {
		var item models.Airline
		if err := rows.Scan(&item.ID, &item.Name, &item.Code, &item.CountryID); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *MySQLReferenceRepository) ListDestinations(ctx context.Context) ([]models.Location, error) {
	rows, err := r.db.QueryContext(ctx, locationSelectQuery()+" WHERE is_active = true ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanLocations(rows)
}

func (r *MySQLReferenceRepository) GetDestination(
	ctx context.Context,
	destinationID int,
) (models.Location, error) {
	row := r.db.QueryRowContext(
		ctx,
		locationSelectQuery()+" WHERE id = ? LIMIT 1",
		destinationID,
	)

	item, err := scanLocation(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.Location{}, ErrNotFound
		}
		return models.Location{}, err
	}

	return item, nil
}

func (r *MySQLReferenceRepository) SearchDestinations(
	ctx context.Context,
	query string,
) ([]models.Location, error) {
	rows, err := r.db.QueryContext(
		ctx,
		locationSelectQuery()+` WHERE is_active = true AND LOWER(name) LIKE ? ORDER BY name`,
		fmt.Sprintf("%%%s%%", strings.ToLower(query)),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanLocations(rows)
}

type locationScanner interface {
	Scan(dest ...any) error
}

func locationSelectQuery() string {
	return `SELECT id, name, country_id, region_id, latitude, longitude, timezone, is_active FROM locations`
}

func scanLocations(rows *sql.Rows) ([]models.Location, error) {
	items := make([]models.Location, 0)
	for rows.Next() {
		item, err := scanLocation(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func scanLocation(scanner locationScanner) (models.Location, error) {
	var item models.Location
	err := scanner.Scan(
		&item.ID,
		&item.Name,
		&item.CountryID,
		&item.RegionID,
		&item.Latitude,
		&item.Longitude,
		&item.Timezone,
		&item.IsActive,
	)
	return item, err
}
