# Trip Planner v2 — Complete Rewrite Plan

## 1. Project Identity

**Purpose:** Given a distributed team (people in different cities/countries), find the optimal meeting destination that minimizes total flight cost, total travel time, and maximizes "time together" by synchronizing arrival/departure times.

**Key differentiator:** You don't pick a destination first. The system evaluates all curated destinations against your team's locations and tells you where to go.

---

## 2. SQL Files to Copy (unchanged)

| Source File | Table | Records | Copy as |
|---|---|---|---|
| `0_region.sql` | `regions` | 7 regions | `001_regions.sql` |
| `1_countries.sql` | `countries` | 56 countries | `002_countries.sql` |
| `airports.sql` | `airports` | ~7000 airports | `003_airports.sql` |
| `airlines.sql` | `airlines` | ~6000 airlines | `004_airlines.sql` |
| `destinations.sql` | `locations` | 70+ cities | `005_destinations.sql` |
| `destinations_airport.sql` | `locations_airport` | junction | `006_destinations_airport.sql` |

---

## 3. New SQL Files

### `007_organization.sql`

```sql
CREATE TABLE organization (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO organization (org_name) VALUES
('OpenAI'), ('TechCorp'), ('EcoSolutions'), ('HealthPlus');
```

### `008_users.sql`

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    level ENUM('owner','manager','user') NOT NULL,
    organization_id INT,
    city VARCHAR(255),
    default_airport_id INT,
    country_id INT,
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organization(id),
    FOREIGN KEY (default_airport_id) REFERENCES airports(id),
    FOREIGN KEY (country_id) REFERENCES countries(id)
);
```

### `009_plans.sql`

```sql
CREATE TABLE plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    created_by_user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_start DATETIME NOT NULL,
    event_end DATETIME NOT NULL,
    event_timezone VARCHAR(50) NOT NULL,
    arrival_buffer_hours INT DEFAULT 12,
    departure_buffer_hours INT DEFAULT 4,
    max_budget_per_person DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    cabin_class ENUM('ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST') DEFAULT 'ECONOMY',
    search_mode ENUM('strict','flexible') DEFAULT 'strict',
    status ENUM('draft','searching','reviewed','booked','completed','cancelled') DEFAULT 'draft',
    chosen_destination_id INT,
    region_filter_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    FOREIGN KEY (chosen_destination_id) REFERENCES locations(id)
);
```

- `search_mode = 'strict'`: only flights arriving before target time
- `search_mode = 'flexible'`: all flights, report spread
- `region_filter_ids`: optional JSON array like `[1,2,3]` to restrict search to certain regions

### `010_plan_participants.sql`

```sql
CREATE TABLE plan_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    user_id INT,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    departure_city VARCHAR(255) NOT NULL,
    departure_airport_id INT NOT NULL,
    departure_country_id INT,
    status ENUM('pending','confirmed','declined') DEFAULT 'pending',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (departure_airport_id) REFERENCES airports(id),
    FOREIGN KEY (departure_country_id) REFERENCES countries(id)
);
```

### `011_plan_destinations.sql`

```sql
CREATE TABLE plan_destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    destination_id INT NOT NULL,
    total_outbound_cost DECIMAL(12,2),
    total_return_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    avg_cost_per_person DECIMAL(10,2),
    total_flight_hours DECIMAL(8,2),
    avg_flight_hours DECIMAL(6,2),
    max_flight_hours DECIMAL(6,2),
    min_flight_hours DECIMAL(6,2),
    arrival_spread_hours DECIMAL(6,2),
    departure_spread_hours DECIMAL(6,2),
    rank_by_cost INT,
    rank_by_time INT,
    rank_by_balance INT,
    overall_rank INT,
    ai_summary TEXT,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES locations(id)
);
```

### `012_plan_flights.sql`

```sql
CREATE TABLE plan_flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    plan_destination_id INT NOT NULL,
    participant_id INT NOT NULL,
    direction ENUM('outbound','return') NOT NULL,
    origin_airport VARCHAR(10) NOT NULL,
    dest_airport VARCHAR(10) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    stops INT DEFAULT 0,
    segments JSON,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    main_carrier VARCHAR(100),
    carrier_code VARCHAR(3),
    is_selected BOOLEAN DEFAULT false,
    filter_type ENUM('cheapest','shortest','best_arrival','recommended'),
    amadeus_offer_id VARCHAR(255),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_destination_id) REFERENCES plan_destinations(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES plan_participants(id) ON DELETE CASCADE
);
```

---

## 4. Backend Structure (Go)

```
trip-planner/
├── cmd/server/main.go
├── internal/
│   ├── config/config.go              # env, keys, DB DSN
│   ├── database/db.go                # GORM MySQL connection
│   ├── models/
│   │   ├── region.go
│   │   ├── country.go
│   │   ├── airport.go
│   │   ├── airline.go
│   │   ├── location.go
│   │   ├── organization.go
│   │   ├── user.go
│   │   ├── plan.go
│   │   ├── participant.go
│   │   ├── plan_destination.go
│   │   └── plan_flight.go
│   ├── repository/
│   │   ├── reference.go              # read-only: regions, countries, airports, airlines, locations
│   │   ├── plan.go                   # plan CRUD
│   │   ├── participant.go            # participant CRUD
│   │   └── search.go                 # write search results (destinations, flights)
│   ├── service/
│   │   ├── plan.go                   # plan business logic
│   │   ├── search.go                 # orchestrate: for each dest × each participant, search flights
│   │   ├── ranking.go                # score destinations, compute ranks
│   │   ├── recommendation.go         # AI recommendation (Claude or OpenAI, configurable)
│   │   └── summary.go               # generate plan summary grouped by origin
│   ├── amadeus/
│   │   ├── client.go                 # HTTP client + OAuth2 token cache
│   │   ├── flights.go                # flight offer search
│   │   └── types.go                  # Amadeus req/resp types
│   ├── ai/
│   │   ├── provider.go               # interface: Recommend(context, data) → string
│   │   ├── claude.go                 # Anthropic Claude implementation
│   │   └── openai.go                 # OpenAI implementation
│   ├── handler/
│   │   ├── middleware.go             # CORS, logging, org context (no auth yet)
│   │   ├── reference.go             # reference data endpoints
│   │   ├── plan.go                  # plan CRUD handlers
│   │   ├── participant.go           # participant handlers
│   │   ├── search.go               # trigger search, get results
│   │   └── summary.go              # summary endpoint
│   └── router/router.go
├── data/
│   ├── docker-compose.yaml
│   └── sql/                          # 001 through 012
├── go.mod
└── .env.example
```

---

## 5. API Endpoints

### Reference Data (no auth)

```
GET  /api/v1/regions
GET  /api/v1/countries
GET  /api/v1/airports?country_id=&city=
GET  /api/v1/airlines
GET  /api/v1/destinations
GET  /api/v1/destinations/:id
GET  /api/v1/destinations/search?q=
```

### Plans

```
POST   /api/v1/plans
GET    /api/v1/plans?org_id=
GET    /api/v1/plans/:id
PUT    /api/v1/plans/:id
DELETE /api/v1/plans/:id
```

### Participants

```
POST   /api/v1/plans/:id/participants
GET    /api/v1/plans/:id/participants
PUT    /api/v1/plans/:id/participants/:pid
DELETE /api/v1/plans/:id/participants/:pid
```

### Search & Recommend

```
POST   /api/v1/plans/:id/search               # trigger the full search
GET    /api/v1/plans/:id/search/status         # polling for search progress
GET    /api/v1/plans/:id/destinations          # ranked results
GET    /api/v1/plans/:id/destinations/:did     # detail with per-person flights
POST   /api/v1/plans/:id/recommend             # AI recommendation
POST   /api/v1/plans/:id/select                # choose destination
GET    /api/v1/plans/:id/summary               # full breakdown
```

---

## 6. Core Search Algorithm

**Input:** plan with N participants and their airports, M active destinations, event timing

### Phase 1 — Outbound Flight Search

```
target_arrival = event_start - arrival_buffer_hours (in destination timezone)

For each destination D (concurrently, with rate limiter):
    For each participant P (concurrently):
        search_date = target_arrival minus 2 days  (search window)

        Call Amadeus: P.airport → D.airports[]

        If search_mode == 'strict':
            Filter: only flights arriving <= target_arrival

        Store: cheapest, shortest, best_arrival_time options
```

### Phase 2 — Return Flight Search

```
earliest_departure = event_end + departure_buffer_hours (in destination timezone)

For each destination D:
    For each participant P:
        Call Amadeus: D.airports[] → P.airport
        departure_date = date(earliest_departure)

        Store: cheapest, shortest options
```

### Phase 3 — Score Each Destination

```
For each destination D:
    Using cheapest outbound + cheapest return per participant:

    total_cost         = Σ (outbound_price + return_price) for all P
    avg_cost           = total_cost / N
    total_hours        = Σ (outbound_duration + return_duration) for all P
    avg_hours          = total_hours / N
    max_hours          = max individual total travel time
    arrival_spread     = latest_arrival - earliest_arrival (outbound)
    departure_spread   = latest_departure - earliest_departure (return)
```

### Phase 4 — Rank

```
Normalize each metric to 0-1 range across all destinations

balance_score = 0.40 * norm_cost
              + 0.30 * norm_time
              + 0.20 * norm_arrival_spread
              + 0.10 * norm_max_hours    (penalize destinations where someone flies 20h+)

Rank by: cost, time, balance → store all three rankings
overall_rank = rank_by_balance (default)
```

### Phase 5 — AI Recommendation

```
Send to Claude/OpenAI:
- Team composition (N people, from which cities/countries)
- Top 5 destinations with their scores
- Ask for structured JSON output:
  {
    "recommended_destination_id": int,
    "reasoning": string,
    "pros": [string],
    "cons": [string],
    "tips": [string]  // e.g., "The Brasília traveler should book early, only 1 direct flight/day"
  }
```

---

## 7. Summary Output Format

`GET /plans/:id/summary` (after destination selected):

```json
{
  "plan": {
    "name": "Eng Team Offsite Q2",
    "destination": "Panama City",
    "event_start": "2026-04-06T09:00:00-05:00",
    "event_end": "2026-04-10T17:00:00-05:00",
    "currency": "USD"
  },
  "totals": {
    "total_cost": 8450.00,
    "avg_cost_per_person": 845.00,
    "total_flight_hours": 62.5,
    "avg_flight_hours": 6.25,
    "participants_count": 10,
    "arrival_window": "Sun 18:00 – Sun 23:30 (5.5h spread)",
    "departure_window": "Fri 14:00 – Fri 20:00 (6h spread)"
  },
  "by_origin": [
    {
      "city": "New York",
      "country": "United States",
      "count": 2,
      "participants": [
        {
          "name": "John Doe",
          "airport": "JFK",
          "outbound": {
            "flight": "AA 913",
            "departs": "2026-04-05 14:00 EST",
            "arrives": "2026-04-05 19:30 EST-5",
            "duration": "5h 30m",
            "stops": 0,
            "price": 420.00,
            "carrier": "American Airlines"
          },
          "return": {
            "flight": "AA 914",
            "departs": "2026-04-10 21:00 EST-5",
            "arrives": "2026-04-11 02:30 EST",
            "duration": "5h 30m",
            "stops": 0,
            "price": 390.00,
            "carrier": "American Airlines"
          },
          "total_price": 810.00
        },
        {
          "name": "Jane Doe",
          "airport": "EWR",
          "outbound": {
            "flight": "UA 1201",
            "departs": "2026-04-05 15:15 EST",
            "arrives": "2026-04-05 20:45 EST-5",
            "duration": "5h 30m",
            "stops": 0,
            "price": 385.00,
            "carrier": "United Airlines"
          },
          "return": {
            "flight": "UA 1202",
            "departs": "2026-04-10 22:00 EST-5",
            "arrives": "2026-04-11 03:30 EST",
            "duration": "5h 30m",
            "stops": 0,
            "price": 370.00,
            "carrier": "United Airlines"
          },
          "total_price": 755.00
        }
      ]
    },
    {
      "city": "São Paulo",
      "country": "Brazil",
      "count": 2,
      "participants": ["..."]
    },
    {
      "city": "Brasília",
      "country": "Brazil",
      "count": 1,
      "participants": ["..."]
    },
    {
      "city": "Toronto",
      "country": "Canada",
      "count": 1,
      "participants": ["..."]
    }
  ],
  "recommendation": "Panama City ranked #1 for your team. Total cost is $8,450 (avg $845/person). The São Paulo and Brasília travelers benefit from direct 6h flights, while US-based participants have 5-6h flights with costs under $500. Toronto has a 7h direct option. Everyone arrives within a 5.5 hour window on Sunday evening, giving the team the full day Monday together."
}
```

---

## 8. Frontend (React) — Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing, explain concept |
| `/plans` | Plan List | All plans for the org |
| `/plans/new` | Create Plan Wizard | 4-step wizard |
| `/plans/:id` | Plan Detail | Status, participants, search |
| `/plans/:id/results` | Destination Results | Ranked cards, map, AI recommendation |
| `/plans/:id/destination/:did` | Destination Detail | Per-person flight breakdown |
| `/plans/:id/summary` | Final Summary | Grouped by origin, totals, export |

### Wizard Steps

1. **Plan basics** — name, event dates, timezone, budget, cabin class, search mode (strict/flexible)
2. **Add participants** — select from org users or add guests; each picks city + airport with autocomplete
3. **Filter regions** — optional: "only search Americas", "only Europe"
4. **Review & launch search**

---

## 9. Implementation Order

| Phase | What | Priority |
|---|---|---|
| **Phase 1** | SQL files + Docker + DB setup | Foundation |
| **Phase 2** | Go project scaffold, config, GORM models, reference data endpoints | Foundation |
| **Phase 3** | Plan CRUD + Participant CRUD endpoints | Core |
| **Phase 4** | Amadeus client (reuse OAuth2 flow from current project) | Core |
| **Phase 5** | Search orchestrator (concurrent, rate-limited) | Core |
| **Phase 6** | Ranking algorithm | Core |
| **Phase 7** | Summary endpoint | Core |
| **Phase 8** | AI recommendation (Claude + OpenAI, configurable) | Enhancement |
| **Phase 9** | React frontend — wizard + results + summary | Frontend |
| **Phase 10** | Auth (JWT or Cognito) | Polish |
| **Phase 11** | Hotels integration | Future |

---

## 10. Environment Variables

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3336
DB_USER=root
DB_PASS=root
DB_NAME=trip

# Amadeus
AMADEUS_API_KEY=
AMADEUS_API_SECRET=
AMADEUS_BASE_URL=https://test.api.amadeus.com

# AI (configurable provider)
AI_PROVIDER=claude  # or "openai"
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Server
PORT=9081
```

---

## 11. Design Decisions

- **No auth initially** — skip auth to focus on core search/ranking logic first, add JWT or Cognito later
- **Both search modes** — `strict` (backward from target arrival, discard late flights) and `flexible` (show all, report spread)
- **Round-trip search** — both outbound and return flights included in cost/time calculations
- **AI provider configurable** — support both Claude and OpenAI via env var, deployer chooses
- **Amadeus API** — keep using it, has a test sandbox for development
- **Curated destinations only** — search restricted to the `locations` table (~70 cities), not all airports worldwide