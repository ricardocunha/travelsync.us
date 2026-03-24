package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ricardocunha/travelsync/apps/api/internal/handler"
)

func TestHealthRoute(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	recorder := httptest.NewRecorder()

	New(handler.NewAPI(nil, nil, nil), nil).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}
