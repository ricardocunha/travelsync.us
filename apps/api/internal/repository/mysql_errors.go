package repository

import (
	"errors"

	mysqlDriver "github.com/go-sql-driver/mysql"
)

func mapMySQLError(err error) error {
	var mysqlErr *mysqlDriver.MySQLError
	if !errors.As(err, &mysqlErr) {
		return err
	}

	switch mysqlErr.Number {
	case 1452:
		return ConstraintError{
			Message: "referenced organization_id, created_by_user_id, or chosen_destination_id does not exist",
		}
	case 1062:
		return ConstraintError{
			Message: "duplicate value violates a unique constraint",
		}
	default:
		return err
	}
}
