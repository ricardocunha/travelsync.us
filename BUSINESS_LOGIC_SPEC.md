# Product Requirements Document (PRD)

# Travel Sync

**Purpose:** Given a distributed team (people in different cities/countries), find the optimal meeting destination that minimizes total flight cost, total travel time, and maximizes "time together" by synchronizing arrival/departure times.

**Key differentiator:** You don't pick a destination first. The system evaluates all curated destinations against your team's locations and tells you where to go.

---

## 1. Executive Summary

This document defines the requirements for **Travel Sync**, a travel planning optimization system that helps distributed teams find the best meeting destination based on real flight data.

The system supports:

- Multi-origin team composition (participants from different cities/countries)
- Curated destination catalog (70+ cities across 7 regions)
- Real-time flight search via Amadeus API for all origin-destination combinations
- Round-trip flight optimization (outbound and return)
- Arrival time synchronization (backward scheduling from event start)
- Destination ranking by cost, travel time, and arrival spread
- AI-powered destination recommendation backed by a source-aware agent layer
- AI-powered itinerary drafting for selected or shortlisted destinations
- Per-participant airport flexibility (same city, different airport preferences)
- Detailed plan summaries grouped by departure origin
- Organization and team management

The goal is to find where a distributed team should meet so that total cost is minimized, total travel burden is fair, and everyone arrives together — replacing the guesswork of "let's go to Greece" with data-driven decisions.

---

## 2. Problem Statement

When a distributed team needs to meet in person, organizers face:

- **Destination bias** — people pick "cool" places without considering cost/time for the full group
- **Cost asymmetry** — a destination cheap for US-based members may be expensive for Brazil-based ones
- **Travel time unfairness** — some members fly 5 hours while others fly 20+ hours with connections
- **Arrival fragmentation** — members arrive at wildly different times, wasting the first day waiting
- **Manual comparison** — checking flights from 10 origins to 15 destinations across multiple dates is impractical (150+ searches)
- **No holistic view** — existing tools (Google Flights, Kayak) optimize for one traveler, not a group

Manual planning is time-consuming, biased toward the organizer's location, and impossible to optimize across all participants simultaneously.

This system automates the process by searching all combinations, scoring destinations holistically, and presenting the best options with full transparency.

---

## 3. Goals

### 3.1 Primary Goals

- Automatically search flights for all participants across all curated destinations.
- Rank destinations by total cost, total travel time, and arrival synchronization.
- Synchronize arrival times so the team maximizes time together.
- Support round-trip planning (outbound + return flights).
- Provide per-participant flight details (airline, duration, stops, price).
- Generate a comprehensive plan summary grouped by departure origin.
- Allow per-participant airport flexibility (e.g., JFK vs EWR for New York).

### 3.2 Secondary Goals

- AI-powered recommendation explaining why a destination is the best fit.
- Source-backed itinerary drafts for a chosen destination and date range.
- Region-based destination filtering (e.g., "only search Americas").
- Support both strict scheduling (must arrive before target) and flexible mode (show all, report spread).
- Cost equity awareness (flag when one participant pays disproportionately more).
- Organization-level plan management.

---

## 4. Non-Goals (V1)

- No authentication system (added later as JWT or Cognito).
- No hotel booking or accommodation search (future enhancement).
- No visa/passport requirement checking.
- No ground transportation planning.
- No calendar integration.
- No payment processing or split-cost functionality.
- No real-time flight price tracking or alerts.
- No mobile application (web only).

---

## 5. User Roles

### 5.1 Organizer (Plan Creator)

Responsibilities:

- Create plans with event dates, timing constraints, and budget limits
- Add participants to the plan (from organization users or external guests)
- Configure search parameters (cabin class, search mode, region filters)
- Trigger destination search
- Review ranked destination results
- Request AI recommendations
- Request a source-backed itinerary draft for a selected destination
- Select the final destination
- Share the plan summary with the team

### 5.2 Participant

Characteristics:

- Belongs to an organization (or is an external guest)
- Has a departure city and preferred departure airport
- May have a default airport in their profile (overridable per plan)
- Can confirm or decline participation
- Views the final plan summary with their personal flight details

### 5.3 Organization Admin

Responsibilities:

- Manage organization settings
- Manage organization members
- View all plans within the organization

---

## 6. Core Concepts

### 6.1 Organization

- Plans belong to an organization.
- Users belong to one organization.
- All plans are scoped to an organization.

### 6.2 Curated Destinations

The system does **not** search all airports worldwide. Destinations are restricted to a curated catalog of ~70 major cities across 7 regions:

| Region | Example Cities |
|---|---|
| North America | New York, Toronto, Miami, Los Angeles, Chicago, Vancouver |
| Central America & Caribbean | Panama City, Cancun, Santo Domingo, San Jose, San Juan |
| South America | Sao Paulo, Bogota, Lima, Buenos Aires, Brasilia, Medellin |
| Europe | London, Paris, Frankfurt, Madrid, Rome, Amsterdam, Istanbul |
| Asia | Dubai, Tokyo, Singapore, Bangkok, Seoul, Hong Kong |
| Africa | Johannesburg, Cairo, Nairobi, Casablanca, Cape Town |
| Oceania | Sydney, Melbourne, Auckland, Brisbane |

Each destination maps to one or more airports (e.g., New York maps to JFK, EWR, LGA; Tokyo maps to NRT, HND).

### 6.3 Plan

The central entity. A plan represents a team get-together with:

- **Event window** — start datetime, end datetime, timezone
- **Arrival buffer** — how many hours before event start everyone should arrive (default 12h)
- **Departure buffer** — how many hours after event end before return flights (default 4h)
- **Search mode** — strict (discard late arrivals) or flexible (show all, report spread)
- **Constraints** — cabin class, max budget per person, currency
- **Region filters** — optional restriction to specific regions
- **Participants** — the people travelling, each with their departure airport

### 6.4 Participant Departure Flexibility

A participant's departure airport is independent of other participants from the same city. For example:

```
5 US participants:
  2 from New York:
    - John → departs from JFK
    - Jane → departs from EWR (Newark)
  1 from Miami:
    - Carlos → departs from MIA
  2 from San Francisco:
    - Alice → departs from SFO
    - Bob → departs from SFO

1 Canada:
  1 from Toronto:
    - David → departs from YYZ

4 Brazil:
  1 from Brasilia:
    - Ana → departs from BSB
  2 from Sao Paulo:
    - Pedro → departs from GRU
    - Maria → departs from GRU
  1 from Florianopolis:
    - Lucas → departs from FLN
```

Each participant independently selects their preferred departure airport from the airports available in their city.

### 6.5 Arrival Time Synchronization

The core innovation. The system does **not** optimize for departure time — it optimizes for **arrival time**.

Given an event starting Monday at 09:00 local time with a 12-hour buffer:

- **Target arrival:** Sunday 21:00 destination local time
- A participant from Brasilia with a 6h direct flight departing Sunday 02:00 → arrives Sunday 08:00 ✓
- A participant from Toronto with a 36h journey and 2 connections → must depart Saturday ~09:00 → arrives Sunday ~21:00 ✓
- Both arrive within the same window despite vastly different travel times

The system measures **arrival spread** — the time difference between the first and last person to arrive. Lower spread = more time together.

### 6.6 Search Modes

| Mode | Behavior |
|---|---|
| **Strict** | Only flights arriving before `event_start - arrival_buffer` are considered. Flights arriving late are discarded. This guarantees everyone is there on time. |
| **Flexible** | All available flights are searched and ranked. Arrival times are reported but not filtered. The organizer decides if the spread is acceptable. |

Both modes are available. Default is strict.

---

## 7. Destination Scoring & Ranking

### 7.1 Metrics Computed Per Destination

For each candidate destination, using the cheapest viable flight per participant:

| Metric | Formula | Purpose |
|---|---|---|
| `total_cost` | Sum of (outbound + return) cheapest price for all participants | Overall trip cost |
| `avg_cost_per_person` | `total_cost / N` | Per-person affordability |
| `total_flight_hours` | Sum of (outbound + return) duration for all participants | Total travel burden |
| `avg_flight_hours` | `total_flight_hours / N` | Average travel burden |
| `max_flight_hours` | Longest individual round-trip | Worst-case burden |
| `min_flight_hours` | Shortest individual round-trip | Best-case burden |
| `arrival_spread_hours` | Latest arrival - Earliest arrival (outbound) | Arrival synchronization |
| `departure_spread_hours` | Latest departure - Earliest departure (return) | Departure synchronization |

### 7.2 Ranking Dimensions

Each destination is ranked in three dimensions:

| Rank | Sorted By | Best For |
|---|---|---|
| `rank_by_cost` | `total_cost` ASC | Budget-conscious teams |
| `rank_by_time` | `total_flight_hours` ASC | Time-sensitive teams |
| `rank_by_balance` | Weighted composite score | Default recommendation |

### 7.3 Balanced Score Formula

```
Normalize each metric to 0–1 range across all candidate destinations.

balance_score = 0.40 * normalized_cost
              + 0.30 * normalized_time
              + 0.20 * normalized_arrival_spread
              + 0.10 * normalized_max_hours
```

- Cost has the highest weight (40%) — money matters most.
- Time has significant weight (30%) — nobody wants to fly 20 hours.
- Arrival spread (20%) — the core differentiator of this product.
- Max individual hours (10%) — penalizes destinations where one person has an extreme journey.

`overall_rank` defaults to `rank_by_balance` but can be overridden by the organizer.

---

## 8. Flight Search

### 8.1 Search Provider

Amadeus API (test sandbox for development, production for live data).

- Authentication: OAuth2 Client Credentials flow
- Flight search: `GET /v2/shopping/flight-offers`
- Token caching with expiration handling

### 8.2 Search Strategy

**Outbound flights:**

```
target_arrival = event_start - arrival_buffer_hours (in destination timezone)

For each destination D (concurrently, rate-limited):
    For each participant P (concurrently):
        For each airport A in D.airports:
            Search: P.departure_airport → A
            Date window: target_arrival - 2 days to target_arrival date
            If strict mode: filter flights arriving after target_arrival
            Store: cheapest, shortest, best-arrival-time options
```

**Return flights:**

```
earliest_return = event_end + departure_buffer_hours (in destination timezone)

For each destination D:
    For each participant P:
        For each airport A in D.airports:
            Search: A → P.departure_airport
            Date: earliest_return date
            Store: cheapest, shortest options
```

### 8.3 Concurrency & Rate Limiting

- Use goroutines with `sync.WaitGroup` for concurrent searches
- Rate limiter to respect Amadeus API limits (test: ~10 req/sec)
- Example scale: 10 participants x 15 destinations x 2 airports avg x 2 directions = ~600 API calls
- Batch with controlled concurrency (e.g., 5 concurrent requests)

### 8.4 Flight Data Stored Per Result

For each flight option found:

- Direction (outbound/return)
- Origin and destination airport IATA codes
- Departure and arrival datetimes (with timezone)
- Duration in minutes
- Number of stops
- Segments (JSON array: carrier, flight number, departure, arrival, aircraft per leg)
- Price and currency
- Main carrier name and code
- Filter type (cheapest/shortest/best_arrival/recommended)
- Amadeus offer ID (for potential future booking)

---

## 9. AI-Powered Recommendation and Itinerary Drafting

### 9.1 Recommendation Provider

Destination recommendation should support a configurable AI provider.

Shared interface:

```
Recommend(teamComposition, topDestinations, scores) -> RecommendationResult
```

The product requirement is that recommendation logic can be fulfilled by either Claude or OpenAI, as selected by environment configuration.

### 9.2 Input to AI

- Team composition: N people, from which cities/countries, departure airports
- Top 5 ranked destinations with their full scoring metrics
- Event dates and constraints

### 9.3 Expected Structured Output

```json
{
  "recommended_destination_id": 42,
  "reasoning": "Panama City offers the best balance...",
  "pros": [
    "Direct flights from Brasilia (6h) and Miami (3h)",
    "Affordable for all origins (avg $845/person)",
    "Everyone arrives within 5.5 hours of each other"
  ],
  "cons": [
    "Toronto participant has a 7h flight with 1 connection",
    "Slightly more expensive than Bogota for US participants"
  ],
  "tips": [
    "The Brasilia traveler should book early — only 1 direct flight per day",
    "Consider Sunday evening arrivals to maximize Monday morning start"
  ]
}
```

### 9.4 Storage

AI recommendation text is stored in `plan_destinations.ai_summary` for each evaluated destination, with the full structured recommendation available for the top-ranked results.

### 9.5 Source-Backed Itinerary Drafting

In addition to destination recommendation, Travel Sync can support a source-backed itinerary drafting workflow for a selected or shortlisted destination.

Inputs to the itinerary workflow:

- destination
- start date and end date
- traveler list and traveler types
- pace and budget style
- interests, priorities, and must-include items
- source dossier retrieved from Exa and Firecrawl

Expected response shape:

```json
{
  "summary": "Balanced 3-day Lisbon plan with walkable neighborhoods and restaurant buffers.",
  "data": {
    "destination": "Lisbon",
    "start_date": "2026-05-02",
    "end_date": "2026-05-04",
    "days": []
  },
  "sources": [
    {
      "title": "Visit Lisbon Official Guide",
      "url": "https://www.visitlisboa.com/en"
    }
  ],
  "assumptions": [
    "Specific reservation lead times should be confirmed directly with venues."
  ],
  "warnings": [
    "Some logistics were inferred because source coverage was limited."
  ]
}
```

Itinerary drafts are planning aids. They should remain transparent about sourced facts, assumptions, and missing verification details. They are not yet modeled as persisted records in the core data model.

---

## 10. Plan Summary

### 10.1 Summary Endpoint

`GET /plans/:id/summary` — available after a destination is selected.

### 10.2 Summary Structure

The summary provides three levels of detail:

**Level 1 — Plan overview:**
- Plan name, chosen destination, event dates, currency

**Level 2 — Aggregated totals:**
- Total cost (all participants, round-trip)
- Average cost per person
- Total flight hours (all participants)
- Average flight hours per person
- Participant count
- Arrival window (e.g., "Sun 18:00 – Sun 23:30, 5.5h spread")
- Departure window (e.g., "Fri 14:00 – Fri 20:00, 6h spread")

**Level 3 — Grouped by departure origin:**

For each departure city:
- City name, country, participant count
- Per participant:
    - Name
    - Departure airport
    - Outbound flight: flight number, departure time, arrival time, duration, stops, price, carrier
    - Return flight: flight number, departure time, arrival time, duration, stops, price, carrier
    - Total round-trip price

### 10.3 Example Output

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
            "departs": "2026-04-05T14:00:00-04:00",
            "arrives": "2026-04-05T19:30:00-05:00",
            "duration": "5h 30m",
            "stops": 0,
            "price": 420.00,
            "carrier": "American Airlines"
          },
          "return": {
            "flight": "AA 914",
            "departs": "2026-04-10T21:00:00-05:00",
            "arrives": "2026-04-11T02:30:00-04:00",
            "duration": "5h 30m",
            "stops": 0,
            "price": 390.00,
            "carrier": "American Airlines"
          },
          "total_price": 810.00
        }
      ]
    }
  ],
  "recommendation": "Panama City ranked #1 for your team..."
}
```

---

## 11. Plan Lifecycle

### 11.1 Status Flow

```
draft → searching → reviewed → booked → completed
                                  ↓
                              cancelled
```

| Status | Description |
|---|---|
| `draft` | Plan created, participants being added |
| `searching` | Flight search in progress across all destinations |
| `reviewed` | Search complete, results available for review |
| `booked` | Destination selected, flights confirmed |
| `completed` | Event has occurred |
| `cancelled` | Plan was cancelled |

### 11.2 Workflow

1. **Create plan** — organizer sets name, event dates, timezone, constraints → status: `draft`
2. **Add participants** — organizer adds team members with departure airports → status: `draft`
3. **Optional: filter regions** — restrict search to specific regions
4. **Trigger search** → status: `searching`
5. **Search completes** → status: `reviewed`
6. **Review results** — organizer views ranked destinations, AI recommendation
7. **Select destination** → status: `booked`
8. **View summary** — share with team
9. **Event occurs** → status: `completed`

---

## 12. Data Model

### 12.1 Reference Data (seeded, read-only)

**Region**
- ID, name
- 7 records: North America, Central America & Caribbean, South America, Europe, Asia, Africa, Oceania

**Country**
- ID, name, iso_code (2-char), alt_code (2-char)
- 56 countries

**Airport**
- ID, name, city, country_id (FK), iata_code, icao_code, latitude, longitude, altitude, timezone_offset, timezone_code, type
- ~7000 airports

**Airline**
- ID, name, code, country_id (FK)
- ~6000 airlines

**Location** (curated destination)
- ID, name, country_id (FK), region_id (FK), latitude, longitude, timezone, is_active
- ~70 cities

**Location_Airport** (junction)
- ID, location_id (FK), airport_id (FK), is_active
- Maps cities to their airports (handles multi-airport cities like NYC, London, Tokyo, Sao Paulo)

### 12.2 Application Data

**Organization**
- ID, org_name, created_at, updated_at

**User**
- ID, username, email, password_hash, level (owner/manager/user)
- organization_id (FK)
- city, default_airport_id (FK), country_id (FK), timezone
- created_at, updated_at

**Plan**
- ID, organization_id (FK), created_by_user_id (FK)
- name, description
- event_start, event_end, event_timezone
- arrival_buffer_hours, departure_buffer_hours
- max_budget_per_person, currency, cabin_class
- search_mode (strict/flexible)
- status (draft/searching/reviewed/booked/completed/cancelled)
- chosen_destination_id (FK, nullable)
- region_filter_ids (JSON array, nullable)
- created_at, updated_at

**Plan Participant**
- ID, plan_id (FK)
- user_id (FK, nullable — null for external guests)
- guest_name, guest_email (for non-registered participants)
- departure_city, departure_airport_id (FK), departure_country_id (FK)
- status (pending/confirmed/declined)
- added_at

**Plan Destination** (search results per destination)
- ID, plan_id (FK), destination_id (FK)
- total_outbound_cost, total_return_cost, total_cost
- avg_cost_per_person
- total_flight_hours, avg_flight_hours, max_flight_hours, min_flight_hours
- arrival_spread_hours, departure_spread_hours
- rank_by_cost, rank_by_time, rank_by_balance, overall_rank
- ai_summary (text)
- searched_at

**Plan Flight** (individual flight options per participant per destination)
- ID, plan_id (FK), plan_destination_id (FK), participant_id (FK)
- direction (outbound/return)
- origin_airport, dest_airport (IATA codes)
- departure_time, arrival_time (datetime with timezone)
- duration_minutes, stops
- segments (JSON array of flight legs)
- price, currency
- main_carrier, carrier_code
- is_selected (boolean)
- filter_type (cheapest/shortest/best_arrival/recommended)
- amadeus_offer_id
- searched_at

---

## 13. API Endpoints

### 13.1 Reference Data (no auth, cacheable)

```
GET  /api/v1/regions
GET  /api/v1/countries
GET  /api/v1/airports?country_id=&city=
GET  /api/v1/airlines
GET  /api/v1/destinations
GET  /api/v1/destinations/:id
GET  /api/v1/destinations/search?q=
```

### 13.2 Plans

```
POST   /api/v1/plans                              # create plan
GET    /api/v1/plans?org_id=                       # list org plans
GET    /api/v1/plans/:id                           # plan detail
PUT    /api/v1/plans/:id                           # update plan settings
DELETE /api/v1/plans/:id                           # delete plan
```

### 13.3 Participants

```
POST   /api/v1/plans/:id/participants              # add participant(s)
GET    /api/v1/plans/:id/participants               # list participants
PUT    /api/v1/plans/:id/participants/:pid          # update departure info
DELETE /api/v1/plans/:id/participants/:pid          # remove participant
```

### 13.4 Search & Recommend

```
POST   /api/v1/plans/:id/search                    # trigger full search
GET    /api/v1/plans/:id/search/status              # search progress
GET    /api/v1/plans/:id/destinations               # ranked destination results
GET    /api/v1/plans/:id/destinations/:did          # destination detail + per-person flights
POST   /api/v1/plans/:id/recommend                  # AI recommendation
POST   /api/v1/agents/itinerary                     # source-backed itinerary draft
POST   /api/v1/plans/:id/select                     # choose destination + confirm flights
GET    /api/v1/plans/:id/summary                    # full plan summary
```

---

## 14. Hard Constraints

Never violated:

- A destination must have at least one active airport in the `locations_airport` table.
- Every participant must have a valid departure airport.
- In strict mode, flights arriving after `event_start - arrival_buffer_hours` are excluded.
- Flight search requires at least 1 participant.
- Flight search requires at least 1 active destination (after region filtering).
- Event end must be after event start.
- Arrival buffer must be >= 0 hours.
- Departure buffer must be >= 0 hours.
- A participant's departure airport must exist in the airports table.
- Currency must be a valid 3-letter ISO code.
- Cabin class must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST.

---

## 15. Soft Constraints / Optimization Preferences

Applied during ranking and recommendation:

- Minimize total cost across all participants.
- Minimize total travel time across all participants.
- Minimize arrival spread (everyone arrives close together).
- Minimize departure spread for return flights.
- Penalize destinations where one participant's travel time is disproportionately higher than others (max_hours penalty).
- Prefer destinations where cost distribution is more equitable across participants.
- Prefer direct flights over connections when price difference is small.
- Prefer destinations in regions accessible to all participants without visa complications (future enhancement).

---

## 16. Frontend

### 16.1 Technology

React with TypeScript.

### 16.2 Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page explaining the concept |
| `/plans` | Plan List | All plans for the organization |
| `/plans/new` | Create Plan Wizard | 4-step guided creation |
| `/plans/:id` | Plan Detail | Status, participants, actions |
| `/plans/:id/results` | Destination Results | Ranked cards, map, AI recommendation |
| `/plans/:id/destination/:did` | Destination Detail | Per-person flight breakdown |
| `/plans/:id/summary` | Final Summary | Grouped by origin, totals, export |

### 16.3 Create Plan Wizard

| Step | Content |
|---|---|
| 1. Plan Basics | Name, description, event start/end dates, timezone, arrival/departure buffer, budget, cabin class, search mode |
| 2. Participants | Add from org users or invite guests; each selects departure city and airport (autocomplete); participant list with departure summary |
| 3. Region Filter | Optional: select which regions to search (checkboxes for 7 regions) |
| 4. Review & Launch | Summary of plan config, participant map, launch search button |

### 16.4 Results Page

- **Top banner:** AI recommendation summary
- **Destination cards:** ranked list with cost, time, spread scores; sortable by different ranking dimensions
- **Map view:** Leaflet map showing all participant origins with lines to the selected/hovered destination
- **Comparison mode:** side-by-side compare of 2-3 destinations

### 16.5 Summary Page

- **Grouped by departure city:** collapsible sections
- **Per-person flight cards:** outbound and return details
- **Totals panel:** aggregate cost, time, spreads
- **Export:** PDF or share link

---

## 17. External Integrations

### 17.1 Amadeus API

| Endpoint | Usage |
|---|---|
| `POST /v1/security/oauth2/token` | OAuth2 token (client credentials) |
| `GET /v2/shopping/flight-offers` | Flight search |

- Test sandbox: `https://test.api.amadeus.com`
- Production: `https://api.amadeus.com`
- Rate limits: test ~10 req/sec, production higher with agreement

### 17.2 AI Providers and Agent Tooling

#### Recommendation Providers

| Provider | SDK/API | Usage |
|---|---|---|
| Anthropic Claude | Messages API | Structured destination recommendation |
| OpenAI | Chat Completions API | Structured destination recommendation |

Selected via `AI_PROVIDER` env var. Only one recommendation provider is active at a time.

#### Source-Backed Planning Tooling

| Component | SDK/API | Usage |
|---|---|---|
| LangChain | Python SDK | orchestration, prompt wiring, structured output |
| OpenAI | Chat API | itinerary synthesis and related planning outputs |
| Exa | Python SDK | search and source discovery |
| Firecrawl | Python SDK | webpage retrieval and extraction |

This tooling is used to support source-backed planning workflows and should not override the core product rules defined in this document.

---

## 18. Configuration

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

# AI Recommendation Provider
AI_PROVIDER=claude          # or "openai"
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Optional source-backed itinerary tooling
OPENAI_MODEL=gpt-4.1-mini
EXA_API_KEY=
FIRECRAWL_API_KEY=
EXA_NUM_RESULTS=6
MAX_SCRAPED_SOURCES=4
FIRECRAWL_TIMEOUT_MS=15000

# Server
API_HOST=127.0.0.1
API_PORT=3001
```

---

## 19. Failure Handling

### 19.1 Search Failures

- If Amadeus returns no results for a specific origin-destination pair: mark that participant-destination combination as "no flights found" and exclude from scoring.
- If a destination has no viable flights for any participant: exclude from ranking entirely.
- If Amadeus API is rate-limited: queue and retry with exponential backoff.
- If Amadeus API is down: return error, plan stays in `draft` status, organizer can retry.

### 19.2 Partial Results

- A destination is scored only if flights are found for **all** participants.
- If no destination has flights for all participants, return partial results with clear indication of which participants are missing flights per destination.
- Search does not fully fail due to a single unfound route.

### 19.3 AI Recommendation and Itinerary Failures

- If the selected AI recommendation provider is unavailable: ranking still works, and recommendation text is marked as unavailable.
- AI recommendation is optional and does not block the core ranking workflow.
- If Exa or Firecrawl partially fail during itinerary drafting: return partial itinerary output with clear `warnings` and transparent source coverage.
- If no sources are retrieved for itinerary drafting: a draft may still be returned, but it must clearly state that manual verification is required.

---

## 20. Implementation Phases

| Phase | Scope | Priority |
|---|---|---|
| **Phase 1** | SQL files, Docker, database setup | Foundation |
| **Phase 2** | Go project scaffold, config, GORM models, reference data endpoints | Foundation |
| **Phase 3** | Plan CRUD + Participant CRUD endpoints | Core |
| **Phase 4** | Amadeus client (OAuth2, flight search) | Core |
| **Phase 5** | Search orchestrator (concurrent, rate-limited, outbound + return) | Core |
| **Phase 6** | Destination scoring and ranking algorithm | Core |
| **Phase 7** | Plan summary endpoint | Core |
| **Phase 8** | AI recommendation and source-backed itinerary drafting | Enhancement |
| **Phase 9** | React frontend (wizard, results, summary) | Frontend |
| **Phase 10** | Authentication (JWT or AWS Cognito) | Polish |
| **Phase 11** | Hotel search integration | Future |

---

## 21. Future Enhancements

- Hotel search and recommendation per destination.
- Visa requirement checking per participant nationality.
- Ground transportation estimation (airport to venue).
- Calendar integration (Google Calendar, Outlook) for event blocking.
- Real-time price tracking and alerts ("prices dropped for Panama City").
- Historical price data for better timing suggestions.
- Multi-event planning (recurring team meetups with rotation).
- Budget split and expense tracking.
- Participant voting on destination shortlist.
- Mobile application (React Native).
- Webhook notifications for search completion and price changes.

---

## 22. Success Metrics

- Reduction in time spent planning team travel (target: from hours to minutes).
- Cost savings compared to organizer-picked destinations (measure: avg savings per trip).
- Arrival spread reduction (measure: avg hours between first and last arrival).
- Organizer satisfaction (qualitative feedback).
- Number of plans created and completed per organization.
- Search-to-selection conversion rate.

---

## 23. Conclusion

Travel Sync transforms team travel planning from a guesswork-driven, organizer-biased process into a data-driven optimization system. By searching all viable destinations simultaneously and scoring them across cost, time, and synchronization dimensions, it finds the objectively best meeting point for any distributed team.

The foundation supports:

- Structured flight search across all origin-destination combinations
- Multi-dimensional destination ranking
- Arrival time synchronization as a first-class metric
- AI-powered recommendation with full transparency
- Source-backed itinerary drafting with citations, assumptions, and warnings
- Per-participant flexibility and detailed summaries
- Scalable architecture for future hotel, visa, and transportation enhancements
