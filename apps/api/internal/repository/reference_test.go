package repository

import (
	"strings"
	"testing"
)

func TestBuildAirportSearchQueryIncludesLocationAliasMatching(t *testing.T) {
	query, args := buildAirportSearchQuery(0, "New York")

	if !strings.Contains(query, "LEFT JOIN locations_airport") {
		t.Fatalf("expected airport search query to join locations_airport")
	}

	if !strings.Contains(query, "COALESCE(l.name, '') COLLATE utf8mb4_0900_ai_ci LIKE ?") {
		t.Fatalf("expected airport search query to match related location names")
	}

	if len(args) != 4 {
		t.Fatalf("expected 4 args for text search, got %d", len(args))
	}

	if args[0] != "%New York%" || args[3] != "NEW YORK%" {
		t.Fatalf("unexpected args: %#v", args)
	}
}

func TestBuildAirportSearchQueryIncludesCountryFilter(t *testing.T) {
	query, args := buildAirportSearchQuery(3, "Sao Paulo")

	if !strings.Contains(query, "a.country_id = ?") {
		t.Fatalf("expected airport search query to include country filter")
	}

	if len(args) != 5 {
		t.Fatalf("expected 5 args with country filter, got %d", len(args))
	}

	if args[0] != 3 {
		t.Fatalf("expected first arg to be the country id, got %#v", args[0])
	}
}
