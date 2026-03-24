package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
)

type ParticipantRepository interface {
	AddParticipants(ctx context.Context, participants []models.PlanParticipant) ([]models.PlanParticipant, error)
	ListParticipants(ctx context.Context, planID int) ([]models.PlanParticipant, error)
	GetParticipant(ctx context.Context, participantID int) (models.PlanParticipant, error)
	UpdateParticipant(ctx context.Context, participant models.PlanParticipant) (models.PlanParticipant, error)
	DeleteParticipant(ctx context.Context, participantID int) error
}

type MySQLParticipantRepository struct {
	db *sql.DB
}

func NewMySQLParticipantRepository(db *sql.DB) *MySQLParticipantRepository {
	return &MySQLParticipantRepository{db: db}
}

func (r *MySQLParticipantRepository) AddParticipants(
	ctx context.Context,
	participants []models.PlanParticipant,
) ([]models.PlanParticipant, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	created := make([]models.PlanParticipant, 0, len(participants))
	for _, participant := range participants {
		result, err := tx.ExecContext(
			ctx,
			`INSERT INTO plan_participants (
				plan_id, user_id, guest_name, guest_email, departure_city, departure_airport_id,
				departure_country_id, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			participant.PlanID,
			nullableInt(participant.UserID),
			nullableString(participant.GuestName),
			nullableString(participant.GuestEmail),
			participant.DepartureCity,
			participant.DepartureAirportID,
			nullableInt(participant.DepartureCountryID),
			participant.Status,
		)
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}

		id, err := result.LastInsertId()
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}

		item, err := getParticipantByID(ctx, tx, int(id))
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
		created = append(created, item)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return created, nil
}

func (r *MySQLParticipantRepository) ListParticipants(
	ctx context.Context,
	planID int,
) ([]models.PlanParticipant, error) {
	rows, err := r.db.QueryContext(
		ctx,
		participantSelectQuery()+` WHERE plan_id = ? ORDER BY added_at, id`,
		planID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.PlanParticipant, 0)
	for rows.Next() {
		item, err := scanParticipant(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *MySQLParticipantRepository) GetParticipant(
	ctx context.Context,
	participantID int,
) (models.PlanParticipant, error) {
	return getParticipantByID(ctx, r.db, participantID)
}

func (r *MySQLParticipantRepository) UpdateParticipant(
	ctx context.Context,
	participant models.PlanParticipant,
) (models.PlanParticipant, error) {
	result, err := r.db.ExecContext(
		ctx,
		`UPDATE plan_participants
		 SET plan_id = ?, user_id = ?, guest_name = ?, guest_email = ?, departure_city = ?,
		     departure_airport_id = ?, departure_country_id = ?, status = ?
		 WHERE id = ?`,
		participant.PlanID,
		nullableInt(participant.UserID),
		nullableString(participant.GuestName),
		nullableString(participant.GuestEmail),
		participant.DepartureCity,
		participant.DepartureAirportID,
		nullableInt(participant.DepartureCountryID),
		participant.Status,
		participant.ID,
	)
	if err != nil {
		return models.PlanParticipant{}, err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return models.PlanParticipant{}, err
	}
	if affected == 0 {
		return models.PlanParticipant{}, ErrNotFound
	}

	return r.GetParticipant(ctx, participant.ID)
}

func (r *MySQLParticipantRepository) DeleteParticipant(ctx context.Context, participantID int) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM plan_participants WHERE id = ?`, participantID)
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

type participantScanner interface {
	Scan(dest ...any) error
}

type queryRower interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

func participantSelectQuery() string {
	return `SELECT id, plan_id, user_id, guest_name, guest_email, departure_city,
		departure_airport_id, departure_country_id, status, added_at
		FROM plan_participants`
}

func getParticipantByID(
	ctx context.Context,
	queryable queryRower,
	participantID int,
) (models.PlanParticipant, error) {
	row := queryable.QueryRowContext(ctx, participantSelectQuery()+` WHERE id = ? LIMIT 1`, participantID)
	item, err := scanParticipant(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.PlanParticipant{}, ErrNotFound
		}
		return models.PlanParticipant{}, err
	}
	return item, nil
}

func scanParticipant(scanner participantScanner) (models.PlanParticipant, error) {
	var item models.PlanParticipant
	var userID sql.NullInt64
	var guestName sql.NullString
	var guestEmail sql.NullString
	var departureCountryID sql.NullInt64

	err := scanner.Scan(
		&item.ID,
		&item.PlanID,
		&userID,
		&guestName,
		&guestEmail,
		&item.DepartureCity,
		&item.DepartureAirportID,
		&departureCountryID,
		&item.Status,
		&item.AddedAt,
	)
	if err != nil {
		return models.PlanParticipant{}, err
	}

	if userID.Valid {
		value := int(userID.Int64)
		item.UserID = &value
	}
	item.GuestName = guestName.String
	item.GuestEmail = guestEmail.String
	if departureCountryID.Valid {
		value := int(departureCountryID.Int64)
		item.DepartureCountryID = &value
	}

	return item, nil
}
