package database

import "github.com/ricardocunha/travelsync/apps/api/internal/config"

// Connection captures the minimum database configuration needed by the API
// foundation slice. GORM wiring will replace this in a later implementation pass.
type Connection struct {
	DSN string
}

func Open(cfg config.Config) *Connection {
	return &Connection{DSN: cfg.Database.DSN()}
}
