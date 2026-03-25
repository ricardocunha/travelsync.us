export type Plan = {
  id: number;
  organization_id: number;
  created_by_user_id: number;
  name: string;
  description: string;
  event_start: string;
  event_end: string;
  event_timezone: string;
  arrival_buffer_hours: number;
  departure_buffer_hours: number;
  max_budget_per_person: number | null;
  currency: string;
  cabin_class: string;
  search_mode: string;
  status: string;
  chosen_destination_id: number | null;
  region_filter_ids: number[];
  created_at: string;
  updated_at: string;
};

export type PlanParticipant = {
  id: number;
  plan_id: number;
  user_id: number | null;
  guest_name: string;
  guest_email: string;
  departure_city: string;
  departure_airport_id: number;
  departure_country_id: number | null;
  status: string;
  added_at: string;
};

export type PlanInput = {
  organization_id: number;
  created_by_user_id: number;
  name: string;
  description: string;
  event_start: string;
  event_end: string;
  event_timezone: string;
  arrival_buffer_hours: number;
  departure_buffer_hours: number;
  max_budget_per_person: number | null;
  currency: string;
  cabin_class: string;
  search_mode: string;
  status?: string;
  chosen_destination_id?: number | null;
  region_filter_ids: number[];
};

export type ParticipantInput = {
  guest_name: string;
  guest_email: string;
  departure_city: string;
  departure_airport_id: number;
  departure_country_id: number | null;
  status?: string;
};

export type PlanSearchStatus = {
  plan_id: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  destinations: number;
  participants: number;
};

export type PlanDestinationMetrics = {
  id: number;
  plan_id: number;
  destination_id: number;
  total_outbound_cost: number;
  total_return_cost: number;
  total_cost: number;
  avg_cost_per_person: number;
  total_flight_hours: number;
  avg_flight_hours: number;
  max_flight_hours: number;
  min_flight_hours: number;
  arrival_spread_hours: number;
  departure_spread_hours: number;
  rank_by_cost: number;
  rank_by_time: number;
  rank_by_balance: number;
  overall_rank: number;
  ai_summary: string;
  searched_at: string;
};

export type PlanDestinationResult = {
  result: PlanDestinationMetrics;
  destination: {
    id: number;
    name: string;
    country_id: number;
    region_id: number;
    latitude: number;
    longitude: number;
    timezone: string;
    is_active: boolean;
  };
};

export type DestinationFlightDetail = {
  flight: {
    id: number;
    plan_id: number;
    plan_destination_id: number;
    participant_id: number;
    direction: string;
    origin_airport: string;
    dest_airport: string;
    departure_time: string;
    arrival_time: string;
    duration_minutes: number;
    stops: number;
    price: number;
    currency: string;
    main_carrier: string;
    carrier_code: string;
    is_selected: boolean;
    filter_type: string;
    amadeus_offer_id: string;
    searched_at: string;
  };
  participant: PlanParticipant;
  display_name: string;
  departure_tag: string;
};

export type PlanDestinationDetail = {
  result: PlanDestinationResult;
  flights: DestinationFlightDetail[];
};
