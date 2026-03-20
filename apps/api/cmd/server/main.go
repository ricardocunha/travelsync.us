package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/ricardocunha/travelsync/apps/api/internal/config"
	"github.com/ricardocunha/travelsync/apps/api/internal/router"
)

func main() {
	cfg := config.Load()

	server := &http.Server{
		Addr:         cfg.Server.Addr(),
		Handler:      router.New(),
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	log.Printf("travel sync api listening on %s", cfg.Server.Addr())

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
