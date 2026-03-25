package service

import (
	"math"
	"sort"

	"github.com/ricardocunha/travelsync/apps/api/internal/repository"
)

type DestinationMetrics struct {
	TotalCost          float64
	TotalFlightHours   float64
	ArrivalSpreadHours float64
	MaxFlightHours     float64
}

type BalanceScoreWeights struct {
	Cost          float64
	Time          float64
	ArrivalSpread float64
	MaxHours      float64
}

func DefaultBalanceScoreWeights() BalanceScoreWeights {
	return BalanceScoreWeights{
		Cost:          0.40,
		Time:          0.30,
		ArrivalSpread: 0.20,
		MaxHours:      0.10,
	}
}

func applyDestinationRanks(results []repository.SearchResultRecord) {
	if len(results) == 0 {
		return
	}

	assignRank(results, func(left repository.SearchResultRecord, right repository.SearchResultRecord) bool {
		if !floatEquals(left.Destination.TotalCost, right.Destination.TotalCost) {
			return left.Destination.TotalCost < right.Destination.TotalCost
		}
		return left.Destination.DestinationID < right.Destination.DestinationID
	}, func(item *repository.SearchResultRecord, rank int) {
		item.Destination.RankByCost = rank
	})

	assignRank(results, func(left repository.SearchResultRecord, right repository.SearchResultRecord) bool {
		if !floatEquals(left.Destination.TotalFlightHours, right.Destination.TotalFlightHours) {
			return left.Destination.TotalFlightHours < right.Destination.TotalFlightHours
		}
		return left.Destination.DestinationID < right.Destination.DestinationID
	}, func(item *repository.SearchResultRecord, rank int) {
		item.Destination.RankByTime = rank
	})

	bounds := metricBounds{
		costMin:     math.MaxFloat64,
		timeMin:     math.MaxFloat64,
		arrivalMin:  math.MaxFloat64,
		maxHoursMin: math.MaxFloat64,
		costMax:     -math.MaxFloat64,
		timeMax:     -math.MaxFloat64,
		arrivalMax:  -math.MaxFloat64,
		maxHoursMax: -math.MaxFloat64,
	}

	for _, item := range results {
		bounds.include(item)
	}

	weights := DefaultBalanceScoreWeights()
	type scoreEntry struct {
		index int
		score float64
	}
	scores := make([]scoreEntry, 0, len(results))
	for index, item := range results {
		score := weights.Cost*normalizeMetric(item.Destination.TotalCost, bounds.costMin, bounds.costMax) +
			weights.Time*normalizeMetric(item.Destination.TotalFlightHours, bounds.timeMin, bounds.timeMax) +
			weights.ArrivalSpread*normalizeMetric(item.Destination.ArrivalSpreadHours, bounds.arrivalMin, bounds.arrivalMax) +
			weights.MaxHours*normalizeMetric(item.Destination.MaxFlightHours, bounds.maxHoursMin, bounds.maxHoursMax)
		scores = append(scores, scoreEntry{index: index, score: score})
	}

	sort.Slice(scores, func(i int, j int) bool {
		if !floatEquals(scores[i].score, scores[j].score) {
			return scores[i].score < scores[j].score
		}
		left := results[scores[i].index].Destination
		right := results[scores[j].index].Destination
		if !floatEquals(left.TotalCost, right.TotalCost) {
			return left.TotalCost < right.TotalCost
		}
		return left.DestinationID < right.DestinationID
	})

	for rank, item := range scores {
		results[item.index].Destination.RankByBalance = rank + 1
		results[item.index].Destination.OverallRank = rank + 1
	}
}

type metricBounds struct {
	costMin     float64
	costMax     float64
	timeMin     float64
	timeMax     float64
	arrivalMin  float64
	arrivalMax  float64
	maxHoursMin float64
	maxHoursMax float64
}

func (b *metricBounds) include(item repository.SearchResultRecord) {
	b.costMin = math.Min(b.costMin, item.Destination.TotalCost)
	b.costMax = math.Max(b.costMax, item.Destination.TotalCost)
	b.timeMin = math.Min(b.timeMin, item.Destination.TotalFlightHours)
	b.timeMax = math.Max(b.timeMax, item.Destination.TotalFlightHours)
	b.arrivalMin = math.Min(b.arrivalMin, item.Destination.ArrivalSpreadHours)
	b.arrivalMax = math.Max(b.arrivalMax, item.Destination.ArrivalSpreadHours)
	b.maxHoursMin = math.Min(b.maxHoursMin, item.Destination.MaxFlightHours)
	b.maxHoursMax = math.Max(b.maxHoursMax, item.Destination.MaxFlightHours)
}

func assignRank(
	results []repository.SearchResultRecord,
	less func(left repository.SearchResultRecord, right repository.SearchResultRecord) bool,
	assign func(item *repository.SearchResultRecord, rank int),
) {
	indexes := make([]int, len(results))
	for index := range results {
		indexes[index] = index
	}

	sort.Slice(indexes, func(i int, j int) bool {
		return less(results[indexes[i]], results[indexes[j]])
	})

	for rank, index := range indexes {
		assign(&results[index], rank+1)
	}
}

func normalizeMetric(value float64, min float64, max float64) float64 {
	if floatEquals(min, max) {
		return 0
	}
	return (value - min) / (max - min)
}

func floatEquals(left float64, right float64) bool {
	return math.Abs(left-right) < 0.00001
}
