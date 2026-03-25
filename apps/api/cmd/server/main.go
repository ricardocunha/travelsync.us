package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/ricardocunha/travelsync/apps/api/internal/config"
	"github.com/ricardocunha/travelsync/apps/api/internal/database"
	"github.com/ricardocunha/travelsync/apps/api/internal/handler"
	"github.com/ricardocunha/travelsync/apps/api/internal/repository"
	"github.com/ricardocunha/travelsync/apps/api/internal/router"
	"github.com/ricardocunha/travelsync/apps/api/internal/service"
)

func main() {
	cfg := config.Load()
	db, err := database.Open(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	referenceRepo := repository.NewMySQLReferenceRepository(db)
	planRepo := repository.NewMySQLPlanRepository(db)
	participantRepo := repository.NewMySQLParticipantRepository(db)
	searchRepo := repository.NewMySQLSearchRepository(db)

	api := handler.NewAPI(
		service.NewReferenceService(referenceRepo),
		service.NewPlanService(planRepo),
		service.NewParticipantService(planRepo, participantRepo),
		service.NewSearchService(planRepo, participantRepo, referenceRepo, searchRepo),
	)

	server := &http.Server{
		Addr:         cfg.Server.Addr(),
		Handler:      router.New(api, cfg.Web.AllowedOrigins),
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	log.Printf("travel sync api listening on %s", cfg.Server.Addr())

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
