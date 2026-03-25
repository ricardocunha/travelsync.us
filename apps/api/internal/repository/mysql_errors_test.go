package repository

import (
	"testing"

	mysqlDriver "github.com/go-sql-driver/mysql"
)

func TestMapMySQLErrorForeignKeyViolation(t *testing.T) {
	mapped := mapMySQLError(&mysqlDriver.MySQLError{
		Number:  1452,
		Message: "Cannot add or update a child row: a foreign key constraint fails",
	})

	constraintErr, ok := mapped.(ConstraintError)
	if !ok {
		t.Fatalf("expected ConstraintError, got %T", mapped)
	}

	if constraintErr.Message == "" {
		t.Fatalf("expected non-empty constraint error message")
	}
}
