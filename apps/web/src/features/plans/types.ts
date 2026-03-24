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
