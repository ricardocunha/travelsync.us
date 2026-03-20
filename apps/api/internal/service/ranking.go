package service

type DestinationMetrics struct {
	TotalCost            float64
	AvgCostPerPerson     float64
	TotalFlightHours     float64
	AvgFlightHours       float64
	MaxFlightHours       float64
	MinFlightHours       float64
	ArrivalSpreadHours   float64
	DepartureSpreadHours float64
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
