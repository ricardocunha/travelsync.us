package service

import (
	"context"
	"encoding/json"
	"hash/fnv"
	"math"
	"sort"
	"strconv"
	"time"

	"github.com/ricardocunha/travelsync/apps/api/internal/models"
	"github.com/ricardocunha/travelsync/apps/api/internal/repository"
)

type SearchStatus struct {
	PlanID       int        `json:"plan_id"`
	Status       string     `json:"status"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	Destinations int        `json:"destinations"`
	Participants int        `json:"participants"`
}

type DestinationResult struct {
	Result      models.PlanDestination `json:"result"`
	Destination models.Location        `json:"destination"`
}

type DestinationFlightDetail struct {
	Flight       models.PlanFlight      `json:"flight"`
	Participant  models.PlanParticipant `json:"participant"`
	DisplayName  string                 `json:"display_name"`
	DepartureTag string                 `json:"departure_tag"`
}

type DestinationDetail struct {
	Result  DestinationResult         `json:"result"`
	Flights []DestinationFlightDetail `json:"flights"`
}

type SearchService interface {
	StartSearch(ctx context.Context, planID int) (SearchStatus, error)
	GetSearchStatus(ctx context.Context, planID int) (SearchStatus, error)
	ListDestinationResults(ctx context.Context, planID int) ([]DestinationResult, error)
	GetDestinationDetail(ctx context.Context, planID int, destinationID int) (DestinationDetail, error)
}

type searchService struct {
	planRepo        repository.PlanRepository
	participantRepo repository.ParticipantRepository
	referenceRepo   repository.ReferenceRepository
	searchRepo      repository.SearchRepository
}

func NewSearchService(
	planRepo repository.PlanRepository,
	participantRepo repository.ParticipantRepository,
	referenceRepo repository.ReferenceRepository,
	searchRepo repository.SearchRepository,
) SearchService {
	return &searchService{
		planRepo:        planRepo,
		participantRepo: participantRepo,
		referenceRepo:   referenceRepo,
		searchRepo:      searchRepo,
	}
}

func (s *searchService) StartSearch(ctx context.Context, planID int) (SearchStatus, error) {
	if planID <= 0 {
		return SearchStatus{}, ValidationError{Message: "plan id must be positive"}
	}

	plan, err := s.planRepo.GetPlan(ctx, planID)
	if err != nil {
		return SearchStatus{}, err
	}

	switch plan.Status {
	case "booked":
		return SearchStatus{}, ValidationError{Message: "cannot rerun search on a booked plan yet"}
	case "completed", "cancelled":
		return SearchStatus{}, ValidationError{Message: "search is not available for completed or cancelled plans"}
	}

	participants, err := s.participantRepo.ListParticipants(ctx, planID)
	if err != nil {
		return SearchStatus{}, err
	}
	if len(participants) == 0 {
		return SearchStatus{}, ValidationError{Message: "flight search requires at least 1 participant"}
	}

	destinations, err := s.loadCandidateDestinations(ctx, plan.RegionFilterIDs)
	if err != nil {
		return SearchStatus{}, err
	}
	if len(destinations) == 0 {
		return SearchStatus{}, ValidationError{Message: "flight search requires at least 1 active destination"}
	}

	originalStatus := plan.Status
	plan.Status = "searching"
	plan, err = s.planRepo.UpdatePlan(ctx, plan)
	if err != nil {
		return SearchStatus{}, err
	}

	revertStatus := true
	defer func() {
		if !revertStatus {
			return
		}
		plan.Status = originalStatus
		_, _ = s.planRepo.UpdatePlan(context.Background(), plan)
	}()

	results := make([]repository.SearchResultRecord, 0, len(destinations))
	for _, destination := range destinations {
		record, ok, err := s.buildDestinationRecord(ctx, plan, participants, destination)
		if err != nil {
			return SearchStatus{}, err
		}
		if ok {
			results = append(results, record)
		}
	}

	applyDestinationRanks(results)

	if err := s.searchRepo.ReplaceSearchResults(ctx, planID, results); err != nil {
		return SearchStatus{}, err
	}

	plan.Status = "reviewed"
	if _, err := s.planRepo.UpdatePlan(ctx, plan); err != nil {
		return SearchStatus{}, err
	}

	revertStatus = false
	return s.buildSearchStatus(ctx, planID, plan.Status, len(participants))
}

func (s *searchService) GetSearchStatus(ctx context.Context, planID int) (SearchStatus, error) {
	if planID <= 0 {
		return SearchStatus{}, ValidationError{Message: "plan id must be positive"}
	}

	plan, err := s.planRepo.GetPlan(ctx, planID)
	if err != nil {
		return SearchStatus{}, err
	}

	participants, err := s.participantRepo.ListParticipants(ctx, planID)
	if err != nil {
		return SearchStatus{}, err
	}

	return s.buildSearchStatus(ctx, planID, plan.Status, len(participants))
}

func (s *searchService) ListDestinationResults(
	ctx context.Context,
	planID int,
) ([]DestinationResult, error) {
	if planID <= 0 {
		return nil, ValidationError{Message: "plan id must be positive"}
	}

	if _, err := s.planRepo.GetPlan(ctx, planID); err != nil {
		return nil, err
	}

	items, err := s.searchRepo.ListDestinationResults(ctx, planID)
	if err != nil {
		return nil, err
	}

	results := make([]DestinationResult, 0, len(items))
	for _, item := range items {
		destination, err := s.referenceRepo.GetDestination(ctx, item.DestinationID)
		if err != nil {
			return nil, err
		}

		results = append(results, DestinationResult{
			Result:      item,
			Destination: destination,
		})
	}

	return results, nil
}

func (s *searchService) GetDestinationDetail(
	ctx context.Context,
	planID int,
	destinationID int,
) (DestinationDetail, error) {
	if planID <= 0 {
		return DestinationDetail{}, ValidationError{Message: "plan id must be positive"}
	}
	if destinationID <= 0 {
		return DestinationDetail{}, ValidationError{Message: "destination id must be positive"}
	}

	if _, err := s.planRepo.GetPlan(ctx, planID); err != nil {
		return DestinationDetail{}, err
	}

	result, err := s.searchRepo.GetDestinationResult(ctx, planID, destinationID)
	if err != nil {
		return DestinationDetail{}, err
	}

	destination, err := s.referenceRepo.GetDestination(ctx, destinationID)
	if err != nil {
		return DestinationDetail{}, err
	}

	flights, err := s.searchRepo.ListDestinationFlights(ctx, result.ID)
	if err != nil {
		return DestinationDetail{}, err
	}

	participants, err := s.participantRepo.ListParticipants(ctx, planID)
	if err != nil {
		return DestinationDetail{}, err
	}
	participantByID := make(map[int]models.PlanParticipant, len(participants))
	for _, participant := range participants {
		participantByID[participant.ID] = participant
	}

	details := make([]DestinationFlightDetail, 0, len(flights))
	for _, flight := range flights {
		participant := participantByID[flight.ParticipantID]
		details = append(details, DestinationFlightDetail{
			Flight:       flight,
			Participant:  participant,
			DisplayName:  participantDisplayName(participant),
			DepartureTag: participant.DepartureCity + " · " + flight.OriginAirport,
		})
	}

	return DestinationDetail{
		Result: DestinationResult{
			Result:      result,
			Destination: destination,
		},
		Flights: details,
	}, nil
}

func (s *searchService) buildSearchStatus(
	ctx context.Context,
	planID int,
	status string,
	participantCount int,
) (SearchStatus, error) {
	metadata, err := s.searchRepo.GetSearchMetadata(ctx, planID)
	if err != nil {
		return SearchStatus{}, err
	}

	return SearchStatus{
		PlanID:       planID,
		Status:       status,
		StartedAt:    metadata.StartedAt,
		CompletedAt:  metadata.CompletedAt,
		Destinations: metadata.Destinations,
		Participants: participantCount,
	}, nil
}

func (s *searchService) loadCandidateDestinations(
	ctx context.Context,
	rawRegionFilter json.RawMessage,
) ([]models.Location, error) {
	destinations, err := s.referenceRepo.ListDestinations(ctx)
	if err != nil {
		return nil, err
	}

	regionFilter := parseRegionFilterIDs(rawRegionFilter)
	if len(regionFilter) == 0 {
		return destinations, nil
	}

	allowedRegions := make(map[int]struct{}, len(regionFilter))
	for _, item := range regionFilter {
		allowedRegions[item] = struct{}{}
	}

	filtered := make([]models.Location, 0, len(destinations))
	for _, destination := range destinations {
		if _, ok := allowedRegions[destination.RegionID]; ok {
			filtered = append(filtered, destination)
		}
	}

	return filtered, nil
}

func (s *searchService) buildDestinationRecord(
	ctx context.Context,
	plan models.Plan,
	participants []models.PlanParticipant,
	destination models.Location,
) (repository.SearchResultRecord, bool, error) {
	destinationAirports, err := s.referenceRepo.ListDestinationAirports(ctx, destination.ID)
	if err != nil {
		return repository.SearchResultRecord{}, false, err
	}
	if len(destinationAirports) == 0 {
		return repository.SearchResultRecord{}, false, nil
	}

	flights := make([]models.PlanFlight, 0, len(participants)*2)
	for _, participant := range participants {
		originAirport, err := s.referenceRepo.GetAirport(ctx, participant.DepartureAirportID)
		if err != nil {
			return repository.SearchResultRecord{}, false, err
		}

		outbound, inbound, ok := s.selectBestRoundTrip(plan, participant, originAirport, destination, destinationAirports)
		if !ok {
			return repository.SearchResultRecord{}, false, nil
		}

		flights = append(flights, outbound, inbound)
	}

	metrics := calculateDestinationMetrics(flights, len(participants))
	return repository.SearchResultRecord{
		Destination: models.PlanDestination{
			PlanID:               plan.ID,
			DestinationID:        destination.ID,
			TotalOutboundCost:    metrics.TotalOutboundCost,
			TotalReturnCost:      metrics.TotalReturnCost,
			TotalCost:            metrics.TotalCost,
			AvgCostPerPerson:     metrics.AvgCostPerPerson,
			TotalFlightHours:     metrics.TotalFlightHours,
			AvgFlightHours:       metrics.AvgFlightHours,
			MaxFlightHours:       metrics.MaxFlightHours,
			MinFlightHours:       metrics.MinFlightHours,
			ArrivalSpreadHours:   metrics.ArrivalSpreadHours,
			DepartureSpreadHours: metrics.DepartureSpreadHours,
		},
		Flights: flights,
	}, true, nil
}

func (s *searchService) selectBestRoundTrip(
	plan models.Plan,
	participant models.PlanParticipant,
	originAirport models.Airport,
	destination models.Location,
	destinationAirports []models.Airport,
) (models.PlanFlight, models.PlanFlight, bool) {
	bestScore := math.MaxFloat64
	var bestOutbound models.PlanFlight
	var bestInbound models.PlanFlight
	var found bool

	for _, destinationAirport := range destinationAirports {
		outbound, inbound, ok := estimateRoundTrip(plan, participant, originAirport, destinationAirport, destination)
		if !ok {
			continue
		}

		score := outbound.Price + inbound.Price + float64(outbound.Stops+inbound.Stops)*18 + float64(outbound.DurationMinutes+inbound.DurationMinutes)/45
		if outbound.ArrivalTime.After(plan.EventStart) {
			score += 200
		}

		if score < bestScore {
			bestScore = score
			bestOutbound = outbound
			bestInbound = inbound
			found = true
		}
	}

	return bestOutbound, bestInbound, found
}

func estimateRoundTrip(
	plan models.Plan,
	participant models.PlanParticipant,
	originAirport models.Airport,
	destinationAirport models.Airport,
	destination models.Location,
) (models.PlanFlight, models.PlanFlight, bool) {
	targetArrival := inLocation(plan.EventStart, destination.Timezone).Add(-time.Duration(plan.ArrivalBufferHours) * time.Hour)
	earliestReturn := inLocation(plan.EventEnd, destination.Timezone).Add(time.Duration(plan.DepartureBufferHours) * time.Hour)

	carrierCode, carrierName := estimateCarrier(originAirport.IATACode, destinationAirport.IATACode)

	if originAirport.IATACode == destinationAirport.IATACode {
		arrivalLeadHours := float64(stableInt(originAirport.IATACode+destinationAirport.IATACode+"local")%4 + 1)
		outboundArrival := targetArrival.Add(-time.Duration(arrivalLeadHours * float64(time.Hour))).UTC()
		returnDeparture := earliestReturn.Add(2 * time.Hour).UTC()

		outbound := models.PlanFlight{
			ParticipantID:   participant.ID,
			Direction:       "outbound",
			OriginAirport:   originAirport.IATACode,
			DestAirport:     destinationAirport.IATACode,
			DepartureTime:   outboundArrival,
			ArrivalTime:     outboundArrival,
			DurationMinutes: 0,
			Stops:           0,
			Segments:        json.RawMessage("[]"),
			Price:           0,
			Currency:        plan.Currency,
			MainCarrier:     "Local arrival",
			CarrierCode:     "LOC",
			IsSelected:      true,
			FilterType:      "recommended",
			AmadeusOfferID:  buildOfferID(participant.ID, originAirport.IATACode, destinationAirport.IATACode, "outbound"),
		}
		inbound := models.PlanFlight{
			ParticipantID:   participant.ID,
			Direction:       "return",
			OriginAirport:   destinationAirport.IATACode,
			DestAirport:     originAirport.IATACode,
			DepartureTime:   returnDeparture,
			ArrivalTime:     returnDeparture,
			DurationMinutes: 0,
			Stops:           0,
			Segments:        json.RawMessage("[]"),
			Price:           0,
			Currency:        plan.Currency,
			MainCarrier:     "Local arrival",
			CarrierCode:     "LOC",
			IsSelected:      true,
			FilterType:      "recommended",
			AmadeusOfferID:  buildOfferID(participant.ID, destinationAirport.IATACode, originAirport.IATACode, "return"),
		}
		return outbound, inbound, true
	}

	distanceKM := haversineKM(
		originAirport.Latitude,
		originAirport.Longitude,
		destinationAirport.Latitude,
		destinationAirport.Longitude,
	)
	if distanceKM > 17500 {
		return models.PlanFlight{}, models.PlanFlight{}, false
	}

	stops := estimateStops(distanceKM)
	durationMinutes := estimateDurationMinutes(distanceKM, stops)
	outboundArrivalOffsetHours := estimateArrivalOffsetHours(distanceKM, originAirport.IATACode, destinationAirport.IATACode)
	outboundArrival := targetArrival.Add(time.Duration(outboundArrivalOffsetHours * float64(time.Hour)))

	if plan.SearchMode == "strict" && outboundArrival.After(targetArrival) {
		return models.PlanFlight{}, models.PlanFlight{}, false
	}

	outboundDeparture := outboundArrival.Add(-time.Duration(durationMinutes) * time.Minute)
	outboundPrice := estimateOneWayPrice(distanceKM, plan.CabinClass, stops, originAirport.IATACode, destinationAirport.IATACode)
	returnPrice := estimateReturnPrice(outboundPrice, destinationAirport.IATACode, originAirport.IATACode)

	if plan.MaxBudgetPerPerson != nil && outboundPrice+returnPrice > *plan.MaxBudgetPerPerson {
		return models.PlanFlight{}, models.PlanFlight{}, false
	}

	returnDepartureOffsetHours := float64(stableInt(destinationAirport.IATACode+originAirport.IATACode+"return")%10 + 1)
	returnDeparture := earliestReturn.Add(time.Duration(returnDepartureOffsetHours * float64(time.Hour)))
	returnArrival := returnDeparture.Add(time.Duration(durationMinutes) * time.Minute)

	outboundSegments := buildSegments(
		originAirport.IATACode,
		destinationAirport.IATACode,
		outboundDeparture,
		outboundArrival,
		stops,
		carrierCode,
	)
	returnSegments := buildSegments(
		destinationAirport.IATACode,
		originAirport.IATACode,
		returnDeparture,
		returnArrival,
		stops,
		carrierCode,
	)

	outbound := models.PlanFlight{
		ParticipantID:   participant.ID,
		Direction:       "outbound",
		OriginAirport:   originAirport.IATACode,
		DestAirport:     destinationAirport.IATACode,
		DepartureTime:   outboundDeparture.UTC(),
		ArrivalTime:     outboundArrival.UTC(),
		DurationMinutes: durationMinutes,
		Stops:           stops,
		Segments:        outboundSegments,
		Price:           outboundPrice,
		Currency:        plan.Currency,
		MainCarrier:     carrierName,
		CarrierCode:     carrierCode,
		IsSelected:      true,
		FilterType:      "recommended",
		AmadeusOfferID:  buildOfferID(participant.ID, originAirport.IATACode, destinationAirport.IATACode, "outbound"),
	}
	inbound := models.PlanFlight{
		ParticipantID:   participant.ID,
		Direction:       "return",
		OriginAirport:   destinationAirport.IATACode,
		DestAirport:     originAirport.IATACode,
		DepartureTime:   returnDeparture.UTC(),
		ArrivalTime:     returnArrival.UTC(),
		DurationMinutes: durationMinutes,
		Stops:           stops,
		Segments:        returnSegments,
		Price:           returnPrice,
		Currency:        plan.Currency,
		MainCarrier:     carrierName,
		CarrierCode:     carrierCode,
		IsSelected:      true,
		FilterType:      "recommended",
		AmadeusOfferID:  buildOfferID(participant.ID, destinationAirport.IATACode, originAirport.IATACode, "return"),
	}
	return outbound, inbound, true
}

type aggregatedDestinationMetrics struct {
	TotalOutboundCost    float64
	TotalReturnCost      float64
	TotalCost            float64
	AvgCostPerPerson     float64
	TotalFlightHours     float64
	AvgFlightHours       float64
	MaxFlightHours       float64
	MinFlightHours       float64
	ArrivalSpreadHours   float64
	DepartureSpreadHours float64
}

func calculateDestinationMetrics(
	flights []models.PlanFlight,
	participantCount int,
) aggregatedDestinationMetrics {
	arrivalTimes := make([]time.Time, 0, participantCount)
	departureTimes := make([]time.Time, 0, participantCount)
	flightHoursByParticipant := make(map[int]float64, participantCount)
	outboundCost := 0.0
	returnCost := 0.0

	for _, flight := range flights {
		durationHours := float64(flight.DurationMinutes) / 60
		flightHoursByParticipant[flight.ParticipantID] += durationHours

		if flight.Direction == "outbound" {
			arrivalTimes = append(arrivalTimes, flight.ArrivalTime)
			outboundCost += flight.Price
			continue
		}

		departureTimes = append(departureTimes, flight.DepartureTime)
		returnCost += flight.Price
	}

	totalCost := outboundCost + returnCost
	totalFlightHours := 0.0
	maxFlightHours := 0.0
	minFlightHours := 0.0

	values := make([]float64, 0, len(flightHoursByParticipant))
	for _, item := range flightHoursByParticipant {
		values = append(values, item)
		totalFlightHours += item
	}
	sort.Float64s(values)
	if len(values) > 0 {
		minFlightHours = values[0]
		maxFlightHours = values[len(values)-1]
	}

	return aggregatedDestinationMetrics{
		TotalOutboundCost:    roundCurrency(outboundCost),
		TotalReturnCost:      roundCurrency(returnCost),
		TotalCost:            roundCurrency(totalCost),
		AvgCostPerPerson:     safeDivide(totalCost, float64(participantCount)),
		TotalFlightHours:     roundMetric(totalFlightHours),
		AvgFlightHours:       safeDivide(totalFlightHours, float64(participantCount)),
		MaxFlightHours:       roundMetric(maxFlightHours),
		MinFlightHours:       roundMetric(minFlightHours),
		ArrivalSpreadHours:   spreadHours(arrivalTimes),
		DepartureSpreadHours: spreadHours(departureTimes),
	}
}

func parseRegionFilterIDs(raw json.RawMessage) []int {
	if len(raw) == 0 {
		return nil
	}

	var items []int
	if err := json.Unmarshal(raw, &items); err != nil {
		return nil
	}
	return items
}

func participantDisplayName(participant models.PlanParticipant) string {
	if participant.GuestName != "" {
		return participant.GuestName
	}
	if participant.UserID != nil {
		return "User #" + intToString(*participant.UserID)
	}
	return "Participant"
}

func buildOfferID(participantID int, origin string, destination string, direction string) string {
	return direction + "-" + intToString(participantID) + "-" + origin + "-" + destination
}

func estimateCarrier(origin string, destination string) (string, string) {
	carriers := []struct {
		Code string
		Name string
	}{
		{Code: "AA", Name: "American Airlines"},
		{Code: "UA", Name: "United Airlines"},
		{Code: "DL", Name: "Delta Air Lines"},
		{Code: "CM", Name: "Copa Airlines"},
		{Code: "LA", Name: "LATAM Airlines"},
		{Code: "IB", Name: "Iberia"},
		{Code: "AC", Name: "Air Canada"},
		{Code: "BA", Name: "British Airways"},
		{Code: "AF", Name: "Air France"},
		{Code: "EK", Name: "Emirates"},
	}

	index := stableInt(origin+destination) % len(carriers)
	item := carriers[index]
	return item.Code, item.Name
}

func estimateArrivalOffsetHours(distanceKM float64, origin string, destination string) float64 {
	base := float64(stableInt(origin+destination)%9) - 6
	switch {
	case distanceKM > 12000:
		base += 4.5
	case distanceKM > 8500:
		base += 2.5
	case distanceKM > 5000:
		base += 1
	}
	return base
}

func estimateStops(distanceKM float64) int {
	switch {
	case distanceKM < 900:
		return 0
	case distanceKM < 4200:
		return 1
	case distanceKM < 9500:
		return 1
	default:
		return 2
	}
}

func estimateDurationMinutes(distanceKM float64, stops int) int {
	flightMinutes := int(math.Round((distanceKM / 780) * 60))
	layoverMinutes := stops * 85
	blockMinutes := 35
	return flightMinutes + layoverMinutes + blockMinutes
}

func estimateOneWayPrice(
	distanceKM float64,
	cabinClass string,
	stops int,
	origin string,
	destination string,
) float64 {
	multiplier := 1.0
	switch cabinClass {
	case "PREMIUM_ECONOMY":
		multiplier = 1.35
	case "BUSINESS":
		multiplier = 2.2
	case "FIRST":
		multiplier = 3.1
	}

	hashFactor := float64(stableInt(origin+destination)%12) / 100
	base := 95 + (distanceKM * 0.085) + float64(stops*28)
	return roundCurrency(base * (multiplier + hashFactor))
}

func estimateReturnPrice(outboundPrice float64, origin string, destination string) float64 {
	adjustment := 0.88 + (float64(stableInt(origin+destination)%10) / 100)
	return roundCurrency(outboundPrice * adjustment)
}

func buildSegments(
	origin string,
	destination string,
	departure time.Time,
	arrival time.Time,
	stops int,
	carrierCode string,
) json.RawMessage {
	if stops == 0 {
		return marshalSegments([]map[string]any{
			{
				"carrier_code":      carrierCode,
				"flight_number":     carrierCode + intToString(100+stableInt(origin+destination)%800),
				"departure_airport": origin,
				"arrival_airport":   destination,
				"departure_time":    departure.UTC(),
				"arrival_time":      arrival.UTC(),
			},
		})
	}

	hubs := []string{"PTY", "MIA", "MAD", "GRU", "LHR", "YYZ", "BOG", "DXB"}
	path := make([]string, 0, stops+2)
	path = append(path, origin)
	for index := 0; index < stops; index++ {
		hub := hubs[(stableInt(origin+destination+intToString(index))+index)%len(hubs)]
		if hub == origin || hub == destination {
			hub = hubs[(index+2)%len(hubs)]
		}
		path = append(path, hub)
	}
	path = append(path, destination)

	totalFlightMinutes := int(arrival.Sub(departure).Minutes()) - stops*75
	legs := len(path) - 1
	if totalFlightMinutes < legs {
		totalFlightMinutes = legs
	}
	perLeg := totalFlightMinutes / legs

	segments := make([]map[string]any, 0, legs)
	currentDeparture := departure
	for index := 0; index < legs; index++ {
		currentArrival := currentDeparture.Add(time.Duration(perLeg) * time.Minute)
		if index == legs-1 {
			currentArrival = arrival
		}
		segments = append(segments, map[string]any{
			"carrier_code":      carrierCode,
			"flight_number":     carrierCode + intToString(100+stableInt(origin+destination+intToString(index))%800),
			"departure_airport": path[index],
			"arrival_airport":   path[index+1],
			"departure_time":    currentDeparture.UTC(),
			"arrival_time":      currentArrival.UTC(),
		})

		currentDeparture = currentArrival.Add(75 * time.Minute)
	}

	return marshalSegments(segments)
}

func marshalSegments(segments []map[string]any) json.RawMessage {
	payload, err := json.Marshal(segments)
	if err != nil {
		return json.RawMessage("[]")
	}
	return payload
}

func spreadHours(values []time.Time) float64 {
	if len(values) < 2 {
		return 0
	}

	sort.Slice(values, func(i int, j int) bool {
		return values[i].Before(values[j])
	})

	return roundMetric(values[len(values)-1].Sub(values[0]).Hours())
}

func haversineKM(lat1 float64, lon1 float64, lat2 float64, lon2 float64) float64 {
	const earthRadiusKM = 6371.0

	latDistance := degreesToRadians(lat2 - lat1)
	lonDistance := degreesToRadians(lon2 - lon1)
	a := math.Sin(latDistance/2)*math.Sin(latDistance/2) +
		math.Cos(degreesToRadians(lat1))*math.Cos(degreesToRadians(lat2))*
			math.Sin(lonDistance/2)*math.Sin(lonDistance/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadiusKM * c
}

func degreesToRadians(value float64) float64 {
	return value * math.Pi / 180
}

func inLocation(value time.Time, timezone string) time.Time {
	location, err := time.LoadLocation(timezone)
	if err != nil {
		return value.UTC()
	}
	return value.In(location)
}

func stableInt(value string) int {
	hasher := fnv.New32a()
	_, _ = hasher.Write([]byte(value))
	return int(hasher.Sum32())
}

func safeDivide(total float64, divisor float64) float64 {
	if divisor == 0 {
		return 0
	}
	return roundMetric(total / divisor)
}

func roundCurrency(value float64) float64 {
	return math.Round(value*100) / 100
}

func roundMetric(value float64) float64 {
	return math.Round(value*100) / 100
}

func intToString(value int) string {
	return strconv.Itoa(value)
}
