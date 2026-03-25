import { config } from "@/lib/config";
import type { Airport, Country, Destination, Region } from "@/features/reference/types";
import type {
  DestinationFlightDetail,
  ParticipantInput,
  Plan,
  PlanDestinationDetail,
  PlanDestinationMetrics,
  PlanDestinationResult,
  PlanInput,
  PlanParticipant,
  PlanSearchStatus,
} from "@/features/plans/types";

type MockState = {
  plans: Plan[];
  participants: PlanParticipant[];
  searchStatuses: Record<number, PlanSearchStatus>;
  destinationResults: Record<number, PlanDestinationResult[]>;
  destinationDetails: Record<string, PlanDestinationDetail>;
  planCounter: number;
  participantCounter: number;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
}

const mockRegions: Region[] = [
  { id: 1, name: "North America" },
  { id: 2, name: "Central America & Caribbean" },
  { id: 3, name: "South America" },
  { id: 4, name: "Europe" },
  { id: 5, name: "Asia" },
  { id: 6, name: "Africa" },
  { id: 7, name: "Oceania" },
];

const mockCountries: Country[] = [
  { id: 1, name: "United States", iso_code: "US", alt_code: "US" },
  { id: 2, name: "Canada", iso_code: "CA", alt_code: "CA" },
  { id: 3, name: "Brazil", iso_code: "BR", alt_code: "BR" },
  { id: 4, name: "Panama", iso_code: "PA", alt_code: "PA" },
  { id: 5, name: "Spain", iso_code: "ES", alt_code: "ES" },
];

const mockAirports: Airport[] = [
  { id: 101, name: "John F. Kennedy International Airport", city: "New York", country_id: 1, iata_code: "JFK", icao_code: "KJFK", latitude: 40.6413, longitude: -73.7781, altitude: 13, timezone_offset: -300, timezone_code: "America/New_York", type: "airport" },
  { id: 102, name: "Newark Liberty International Airport", city: "Newark", country_id: 1, iata_code: "EWR", icao_code: "KEWR", latitude: 40.6895, longitude: -74.1745, altitude: 18, timezone_offset: -300, timezone_code: "America/New_York", type: "airport" },
  { id: 103, name: "Miami International Airport", city: "Miami", country_id: 1, iata_code: "MIA", icao_code: "KMIA", latitude: 25.7959, longitude: -80.287, altitude: 8, timezone_offset: -300, timezone_code: "America/New_York", type: "airport" },
  { id: 104, name: "San Francisco International Airport", city: "San Francisco", country_id: 1, iata_code: "SFO", icao_code: "KSFO", latitude: 37.6213, longitude: -122.379, altitude: 13, timezone_offset: -480, timezone_code: "America/Los_Angeles", type: "airport" },
  { id: 201, name: "Toronto Pearson International Airport", city: "Toronto", country_id: 2, iata_code: "YYZ", icao_code: "CYYZ", latitude: 43.6777, longitude: -79.6248, altitude: 569, timezone_offset: -300, timezone_code: "America/Toronto", type: "airport" },
  { id: 301, name: "Brasilia International Airport", city: "Brasilia", country_id: 3, iata_code: "BSB", icao_code: "SBBR", latitude: -15.8697, longitude: -47.9208, altitude: 3497, timezone_offset: -180, timezone_code: "America/Sao_Paulo", type: "airport" },
  { id: 302, name: "Sao Paulo Guarulhos International Airport", city: "Sao Paulo", country_id: 3, iata_code: "GRU", icao_code: "SBGR", latitude: -23.4356, longitude: -46.4731, altitude: 2459, timezone_offset: -180, timezone_code: "America/Sao_Paulo", type: "airport" },
  { id: 303, name: "Florianopolis International Airport", city: "Florianopolis", country_id: 3, iata_code: "FLN", icao_code: "SBFL", latitude: -27.6703, longitude: -48.5525, altitude: 16, timezone_offset: -180, timezone_code: "America/Sao_Paulo", type: "airport" },
  { id: 401, name: "Tocumen International Airport", city: "Panama City", country_id: 4, iata_code: "PTY", icao_code: "MPTO", latitude: 9.0714, longitude: -79.3835, altitude: 135, timezone_offset: -300, timezone_code: "America/Panama", type: "airport" },
  { id: 501, name: "Adolfo Suarez Madrid-Barajas Airport", city: "Madrid", country_id: 5, iata_code: "MAD", icao_code: "LEMD", latitude: 40.4722, longitude: -3.5608, altitude: 2000, timezone_offset: 60, timezone_code: "Europe/Madrid", type: "airport" },
];

const mockDestinations: Destination[] = [
  { id: 1, name: "Panama City", country_id: 4, region_id: 2, latitude: 8.9824, longitude: -79.5199, timezone: "America/Panama", is_active: true },
  { id: 2, name: "Madrid", country_id: 5, region_id: 4, latitude: 40.4168, longitude: -3.7038, timezone: "Europe/Madrid", is_active: true },
  { id: 3, name: "Toronto", country_id: 2, region_id: 1, latitude: 43.6532, longitude: -79.3832, timezone: "America/Toronto", is_active: true },
];

function buildInitialMockState(): MockState {
  return {
    plans: [
      {
        id: 1,
        organization_id: config.organizationId,
        created_by_user_id: 1,
        name: "Q2 Engineering Offsite",
        description: "Baseline planning pass for a distributed product and engineering team.",
        event_start: "2026-04-06T14:00:00.000Z",
        event_end: "2026-04-10T20:00:00.000Z",
        event_timezone: "America/Panama",
        arrival_buffer_hours: 12,
        departure_buffer_hours: 4,
        max_budget_per_person: 1200,
        currency: "USD",
        cabin_class: "ECONOMY",
        search_mode: "strict",
        status: "draft",
        chosen_destination_id: null,
        region_filter_ids: [1, 2, 3],
        created_at: "2026-03-01T15:00:00.000Z",
        updated_at: "2026-03-01T15:00:00.000Z",
      },
    ],
    participants: [
      {
        id: 1,
        plan_id: 1,
        user_id: null,
        guest_name: "Ana",
        guest_email: "ana@example.com",
        departure_city: "Brasilia",
        departure_airport_id: 301,
        departure_country_id: 3,
        status: "confirmed",
        added_at: "2026-03-01T15:20:00.000Z",
      },
      {
        id: 2,
        plan_id: 1,
        user_id: null,
        guest_name: "John",
        guest_email: "john@example.com",
        departure_city: "New York",
        departure_airport_id: 101,
        departure_country_id: 1,
        status: "pending",
        added_at: "2026-03-01T15:30:00.000Z",
      },
    ],
    searchStatuses: {},
    destinationResults: {},
    destinationDetails: {},
    planCounter: 2,
    participantCounter: 3,
  };
}

let mockState = buildInitialMockState();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function waitForMock() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 90);
  });
}

function parseRegionFilters(input: unknown): number[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  return [];
}

function normalizePlan(raw: Record<string, unknown>): Plan {
  return {
    id: Number(raw.id ?? 0),
    organization_id: Number(raw.organization_id ?? 0),
    created_by_user_id: Number(raw.created_by_user_id ?? 0),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    event_start: String(raw.event_start ?? ""),
    event_end: String(raw.event_end ?? ""),
    event_timezone: String(raw.event_timezone ?? "UTC"),
    arrival_buffer_hours: Number(raw.arrival_buffer_hours ?? 12),
    departure_buffer_hours: Number(raw.departure_buffer_hours ?? 4),
    max_budget_per_person:
      raw.max_budget_per_person === null || raw.max_budget_per_person === undefined
        ? null
        : Number(raw.max_budget_per_person),
    currency: String(raw.currency ?? "USD"),
    cabin_class: String(raw.cabin_class ?? "ECONOMY"),
    search_mode: String(raw.search_mode ?? "strict"),
    status: String(raw.status ?? "draft"),
    chosen_destination_id:
      raw.chosen_destination_id === null || raw.chosen_destination_id === undefined
        ? null
        : Number(raw.chosen_destination_id),
    region_filter_ids: parseRegionFilters(raw.region_filter_ids),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  };
}

function normalizeParticipant(raw: Record<string, unknown>): PlanParticipant {
  return {
    id: Number(raw.id ?? 0),
    plan_id: Number(raw.plan_id ?? 0),
    user_id:
      raw.user_id === null || raw.user_id === undefined
        ? null
        : Number(raw.user_id),
    guest_name: String(raw.guest_name ?? ""),
    guest_email: String(raw.guest_email ?? ""),
    departure_city: String(raw.departure_city ?? ""),
    departure_airport_id: Number(raw.departure_airport_id ?? 0),
    departure_country_id:
      raw.departure_country_id === null || raw.departure_country_id === undefined
        ? null
        : Number(raw.departure_country_id),
    status: String(raw.status ?? "pending"),
    added_at: String(raw.added_at ?? new Date().toISOString()),
  };
}

function normalizeSearchStatus(raw: Record<string, unknown>): PlanSearchStatus {
  return {
    plan_id: Number(raw.plan_id ?? 0),
    status: String(raw.status ?? "draft"),
    started_at: raw.started_at ? String(raw.started_at) : undefined,
    completed_at: raw.completed_at ? String(raw.completed_at) : undefined,
    destinations: Number(raw.destinations ?? 0),
    participants: Number(raw.participants ?? 0),
  };
}

function normalizeDestinationMetrics(raw: Record<string, unknown>): PlanDestinationMetrics {
  return {
    id: Number(raw.id ?? 0),
    plan_id: Number(raw.plan_id ?? 0),
    destination_id: Number(raw.destination_id ?? 0),
    total_outbound_cost: Number(raw.total_outbound_cost ?? 0),
    total_return_cost: Number(raw.total_return_cost ?? 0),
    total_cost: Number(raw.total_cost ?? 0),
    avg_cost_per_person: Number(raw.avg_cost_per_person ?? 0),
    total_flight_hours: Number(raw.total_flight_hours ?? 0),
    avg_flight_hours: Number(raw.avg_flight_hours ?? 0),
    max_flight_hours: Number(raw.max_flight_hours ?? 0),
    min_flight_hours: Number(raw.min_flight_hours ?? 0),
    arrival_spread_hours: Number(raw.arrival_spread_hours ?? 0),
    departure_spread_hours: Number(raw.departure_spread_hours ?? 0),
    rank_by_cost: Number(raw.rank_by_cost ?? 0),
    rank_by_time: Number(raw.rank_by_time ?? 0),
    rank_by_balance: Number(raw.rank_by_balance ?? 0),
    overall_rank: Number(raw.overall_rank ?? 0),
    ai_summary: String(raw.ai_summary ?? ""),
    searched_at: String(raw.searched_at ?? new Date().toISOString()),
  };
}

function normalizeDestinationResult(raw: Record<string, unknown>): PlanDestinationResult {
  return {
    result: normalizeDestinationMetrics(raw.result as Record<string, unknown>),
    destination: {
      id: Number((raw.destination as Record<string, unknown>)?.id ?? 0),
      name: String((raw.destination as Record<string, unknown>)?.name ?? ""),
      country_id: Number((raw.destination as Record<string, unknown>)?.country_id ?? 0),
      region_id: Number((raw.destination as Record<string, unknown>)?.region_id ?? 0),
      latitude: Number((raw.destination as Record<string, unknown>)?.latitude ?? 0),
      longitude: Number((raw.destination as Record<string, unknown>)?.longitude ?? 0),
      timezone: String((raw.destination as Record<string, unknown>)?.timezone ?? "UTC"),
      is_active: Boolean((raw.destination as Record<string, unknown>)?.is_active ?? true),
    },
  };
}

function normalizeDestinationDetail(raw: Record<string, unknown>): PlanDestinationDetail {
  const flights = Array.isArray(raw.flights)
    ? raw.flights.map<DestinationFlightDetail>((item) => {
        const record = item as Record<string, unknown>;
        const flight = record.flight as Record<string, unknown>;
        return {
          flight: {
            id: Number(flight?.id ?? 0),
            plan_id: Number(flight?.plan_id ?? 0),
            plan_destination_id: Number(flight?.plan_destination_id ?? 0),
            participant_id: Number(flight?.participant_id ?? 0),
            direction: String(flight?.direction ?? ""),
            origin_airport: String(flight?.origin_airport ?? ""),
            dest_airport: String(flight?.dest_airport ?? ""),
            departure_time: String(flight?.departure_time ?? ""),
            arrival_time: String(flight?.arrival_time ?? ""),
            duration_minutes: Number(flight?.duration_minutes ?? 0),
            stops: Number(flight?.stops ?? 0),
            price: Number(flight?.price ?? 0),
            currency: String(flight?.currency ?? "USD"),
            main_carrier: String(flight?.main_carrier ?? ""),
            carrier_code: String(flight?.carrier_code ?? ""),
            is_selected: Boolean(flight?.is_selected ?? false),
            filter_type: String(flight?.filter_type ?? ""),
            amadeus_offer_id: String(flight?.amadeus_offer_id ?? ""),
            searched_at: String(flight?.searched_at ?? ""),
          },
          participant: normalizeParticipant(record.participant as Record<string, unknown>),
          display_name: String(record.display_name ?? ""),
          departure_tag: String(record.departure_tag ?? ""),
        };
      })
    : [];

  return {
    result: normalizeDestinationResult(raw.result as Record<string, unknown>),
    flights,
  };
}

function participantDisplayName(participant: PlanParticipant) {
  return participant.guest_name || `Traveler ${participant.id}`;
}

function generateMockSearchArtifacts(planId: number) {
  const plan = mockState.plans.find((item) => item.id === planId);
  if (!plan) {
    throw new ApiError("Plan not found");
  }

  const participants = mockState.participants.filter((item) => item.plan_id === planId);
  const participantCount = participants.length;
  const searchedAt = new Date().toISOString();

  const results = mockDestinations.slice(0, 3).map<PlanDestinationResult>((destination, index) => {
    const totalCost = 540 + participantCount * 280 + index * 230;
    const totalFlightHours = 7.6 * participantCount + index * 4.1;
    return {
      result: {
        id: planId * 100 + index + 1,
        plan_id: planId,
        destination_id: destination.id,
        total_outbound_cost: Number((totalCost * 0.54).toFixed(2)),
        total_return_cost: Number((totalCost * 0.46).toFixed(2)),
        total_cost: Number(totalCost.toFixed(2)),
        avg_cost_per_person: Number((totalCost / Math.max(participantCount, 1)).toFixed(2)),
        total_flight_hours: Number(totalFlightHours.toFixed(2)),
        avg_flight_hours: Number((totalFlightHours / Math.max(participantCount, 1)).toFixed(2)),
        max_flight_hours: Number((8.4 + index * 1.3).toFixed(2)),
        min_flight_hours: Number((3.2 + index * 0.8).toFixed(2)),
        arrival_spread_hours: Number((2.1 + index * 1.4).toFixed(2)),
        departure_spread_hours: Number((2.8 + index * 1.2).toFixed(2)),
        rank_by_cost: index + 1,
        rank_by_time: index + 1,
        rank_by_balance: index + 1,
        overall_rank: index + 1,
        ai_summary: "",
        searched_at: searchedAt,
      },
      destination,
    };
  });

  const details = Object.fromEntries(
    results.map((result) => {
      const flights = participants.flatMap<DestinationFlightDetail>((participant, index) => {
        const airport = mockAirports.find((item) => item.id === participant.departure_airport_id);
        const baseDeparture = new Date(plan.event_start);
        baseDeparture.setUTCDate(baseDeparture.getUTCDate() - 1);
        baseDeparture.setUTCHours(baseDeparture.getUTCHours() - (8 - index * 2));

        const outboundDeparture = new Date(baseDeparture);
        const outboundArrival = new Date(baseDeparture);
        outboundArrival.setUTCHours(outboundArrival.getUTCHours() + 6 + index);

        const returnDeparture = new Date(plan.event_end);
        returnDeparture.setUTCHours(returnDeparture.getUTCHours() + 5 + index);
        const returnArrival = new Date(returnDeparture);
        returnArrival.setUTCHours(returnArrival.getUTCHours() + 6 + index);

        return [
          {
            flight: {
              id: result.result.id * 10 + index * 2 + 1,
              plan_id: planId,
              plan_destination_id: result.result.id,
              participant_id: participant.id,
              direction: "outbound",
              origin_airport: airport?.iata_code ?? "TBD",
              dest_airport: result.destination.name === "Panama City" ? "PTY" : result.destination.name === "Madrid" ? "MAD" : "YYZ",
              departure_time: outboundDeparture.toISOString(),
              arrival_time: outboundArrival.toISOString(),
              duration_minutes: (6 + index) * 60,
              stops: index % 2,
              price: Number((result.result.avg_cost_per_person * 0.52).toFixed(2)),
              currency: plan.currency,
              main_carrier: index % 2 === 0 ? "Copa Airlines" : "Air Canada",
              carrier_code: index % 2 === 0 ? "CM" : "AC",
              is_selected: true,
              filter_type: "recommended",
              amadeus_offer_id: `mock-out-${planId}-${participant.id}-${result.destination.id}`,
              searched_at: searchedAt,
            },
            participant,
            display_name: participantDisplayName(participant),
            departure_tag: `${participant.departure_city} · ${airport?.iata_code ?? "TBD"}`,
          },
          {
            flight: {
              id: result.result.id * 10 + index * 2 + 2,
              plan_id: planId,
              plan_destination_id: result.result.id,
              participant_id: participant.id,
              direction: "return",
              origin_airport: result.destination.name === "Panama City" ? "PTY" : result.destination.name === "Madrid" ? "MAD" : "YYZ",
              dest_airport: airport?.iata_code ?? "TBD",
              departure_time: returnDeparture.toISOString(),
              arrival_time: returnArrival.toISOString(),
              duration_minutes: (6 + index) * 60,
              stops: index % 2,
              price: Number((result.result.avg_cost_per_person * 0.48).toFixed(2)),
              currency: plan.currency,
              main_carrier: index % 2 === 0 ? "Copa Airlines" : "Air Canada",
              carrier_code: index % 2 === 0 ? "CM" : "AC",
              is_selected: true,
              filter_type: "recommended",
              amadeus_offer_id: `mock-ret-${planId}-${participant.id}-${result.destination.id}`,
              searched_at: searchedAt,
            },
            participant,
            display_name: participantDisplayName(participant),
            departure_tag: `${participant.departure_city} · ${airport?.iata_code ?? "TBD"}`,
          },
        ];
      });

      return [
        `${planId}:${result.destination.id}`,
        {
          result,
          flights,
        } satisfies PlanDestinationDetail,
      ];
    }),
  ) as Record<string, PlanDestinationDetail>;

  mockState.searchStatuses[planId] = {
    plan_id: planId,
    status: "reviewed",
    started_at: searchedAt,
    completed_at: searchedAt,
    destinations: results.length,
    participants: participantCount,
  };
  mockState.destinationResults[planId] = results;
  for (const [key, value] of Object.entries(details)) {
    mockState.destinationDetails[key] = value;
  }

  const planIndex = mockState.plans.findIndex((item) => item.id === planId);
  if (planIndex >= 0) {
    mockState.plans[planIndex] = {
      ...mockState.plans[planIndex],
      status: "reviewed",
      updated_at: searchedAt,
    };
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const error = new ApiError("Request failed");
    error.status = response.status;

    try {
      const payload = (await response.json()) as { error?: { code?: string; message?: string } };
      error.code = payload.error?.code;
      error.message = payload.error?.message ?? error.message;
    } catch {
      error.message = response.statusText || error.message;
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function resetMockState() {
  mockState = buildInitialMockState();
}

export async function listRegions() {
  if (config.useMock) {
    await waitForMock();
    return clone(mockRegions);
  }

  return requestJson<Region[]>("/regions");
}

export async function listCountries() {
  if (config.useMock) {
    await waitForMock();
    return clone(mockCountries);
  }

  return requestJson<Country[]>("/countries");
}

export async function listAirports(filters: { countryId?: number; city?: string }) {
  if (config.useMock) {
    await waitForMock();
    const city = filters.city?.trim().toLowerCase() ?? "";

    return clone(
      mockAirports.filter((airport) => {
        const matchesCountry = filters.countryId ? airport.country_id === filters.countryId : true;
        const matchesCity = city ? airport.city.toLowerCase().includes(city) : true;
        return matchesCountry && matchesCity;
      }),
    );
  }

  const params = new URLSearchParams();
  if (filters.countryId) {
    params.set("country_id", String(filters.countryId));
  }
  if (filters.city) {
    params.set("city", filters.city);
  }

  return requestJson<Airport[]>(`/airports?${params.toString()}`);
}

export async function listDestinations() {
  if (config.useMock) {
    await waitForMock();
    return clone(mockDestinations);
  }

  return requestJson<Destination[]>("/destinations");
}

export async function listPlans(orgId = config.organizationId) {
  if (config.useMock) {
    await waitForMock();
    return clone(mockState.plans.filter((plan) => plan.organization_id === orgId));
  }

  const payload = await requestJson<Record<string, unknown>[]>(`/plans?org_id=${orgId}`);
  return payload.map(normalizePlan);
}

export async function getPlan(planId: number) {
  if (config.useMock) {
    await waitForMock();
    const plan = mockState.plans.find((item) => item.id === planId);
    if (!plan) {
      throw new ApiError("Plan not found");
    }
    return clone(plan);
  }

  const payload = await requestJson<Record<string, unknown>>(`/plans/${planId}`);
  return normalizePlan(payload);
}

export async function createPlan(input: PlanInput) {
  if (config.useMock) {
    await waitForMock();
    const now = new Date().toISOString();
    const plan: Plan = {
      id: mockState.planCounter++,
      organization_id: input.organization_id,
      created_by_user_id: input.created_by_user_id,
      name: input.name,
      description: input.description,
      event_start: input.event_start,
      event_end: input.event_end,
      event_timezone: input.event_timezone,
      arrival_buffer_hours: input.arrival_buffer_hours,
      departure_buffer_hours: input.departure_buffer_hours,
      max_budget_per_person: input.max_budget_per_person,
      currency: input.currency,
      cabin_class: input.cabin_class,
      search_mode: input.search_mode,
      status: input.status ?? "draft",
      chosen_destination_id: input.chosen_destination_id ?? null,
      region_filter_ids: [...input.region_filter_ids],
      created_at: now,
      updated_at: now,
    };
    mockState.plans = [plan, ...mockState.plans];
    return clone(plan);
  }

  const payload = await requestJson<Record<string, unknown>>("/plans", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizePlan(payload);
}

export async function updatePlan(planId: number, input: PlanInput) {
  if (config.useMock) {
    await waitForMock();
    const index = mockState.plans.findIndex((plan) => plan.id === planId);
    if (index === -1) {
      throw new ApiError("Plan not found");
    }

    const nextPlan: Plan = {
      ...mockState.plans[index],
      ...input,
      id: planId,
      updated_at: new Date().toISOString(),
      chosen_destination_id: input.chosen_destination_id ?? null,
      region_filter_ids: [...input.region_filter_ids],
    };
    mockState.plans[index] = nextPlan;
    return clone(nextPlan);
  }

  const payload = await requestJson<Record<string, unknown>>(`/plans/${planId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return normalizePlan(payload);
}

export async function listParticipants(planId: number) {
  if (config.useMock) {
    await waitForMock();
    return clone(mockState.participants.filter((participant) => participant.plan_id === planId));
  }

  const payload = await requestJson<Record<string, unknown>[]>(`/plans/${planId}/participants`);
  return payload.map(normalizeParticipant);
}

export async function addParticipants(planId: number, participants: ParticipantInput[]) {
  if (config.useMock) {
    await waitForMock();
    const now = new Date().toISOString();
    const nextItems = participants.map<PlanParticipant>((participant) => ({
      id: mockState.participantCounter++,
      plan_id: planId,
      user_id: null,
      guest_name: participant.guest_name,
      guest_email: participant.guest_email,
      departure_city: participant.departure_city,
      departure_airport_id: participant.departure_airport_id,
      departure_country_id: participant.departure_country_id,
      status: participant.status ?? "pending",
      added_at: now,
    }));

    mockState.participants = [...mockState.participants, ...nextItems];
    return clone(nextItems);
  }

  const payload = await requestJson<Record<string, unknown>[]>(`/plans/${planId}/participants`, {
    method: "POST",
    body: JSON.stringify(participants),
  });
  return payload.map(normalizeParticipant);
}

export async function updateParticipant(planId: number, participant: PlanParticipant) {
  if (config.useMock) {
    await waitForMock();
    const index = mockState.participants.findIndex((item) => item.id === participant.id);
    if (index === -1) {
      throw new ApiError("Participant not found");
    }
    mockState.participants[index] = clone(participant);
    return clone(participant);
  }

  const payload = await requestJson<Record<string, unknown>>(
    `/plans/${planId}/participants/${participant.id}`,
    {
      method: "PUT",
      body: JSON.stringify(participant),
    },
  );
  return normalizeParticipant(payload);
}

export async function startPlanSearch(planId: number) {
  if (config.useMock) {
    await waitForMock();
    generateMockSearchArtifacts(planId);
    return clone(mockState.searchStatuses[planId]);
  }

  const payload = await requestJson<Record<string, unknown>>(`/plans/${planId}/search`, {
    method: "POST",
  });
  return normalizeSearchStatus(payload);
}

export async function getPlanSearchStatus(planId: number) {
  if (config.useMock) {
    await waitForMock();
    return clone(
      mockState.searchStatuses[planId] ?? {
        plan_id: planId,
        status: mockState.plans.find((item) => item.id === planId)?.status ?? "draft",
        destinations: mockState.destinationResults[planId]?.length ?? 0,
        participants: mockState.participants.filter((item) => item.plan_id === planId).length,
      },
    );
  }

  const payload = await requestJson<Record<string, unknown>>(`/plans/${planId}/search/status`);
  return normalizeSearchStatus(payload);
}

export async function listPlanDestinationResults(planId: number) {
  if (config.useMock) {
    await waitForMock();
    return clone(mockState.destinationResults[planId] ?? []);
  }

  const payload = await requestJson<Record<string, unknown>[]>(`/plans/${planId}/destinations`);
  return payload.map(normalizeDestinationResult);
}

export async function getPlanDestinationDetail(planId: number, destinationId: number) {
  if (config.useMock) {
    await waitForMock();
    const detail = mockState.destinationDetails[`${planId}:${destinationId}`];
    if (!detail) {
      throw new ApiError("Destination detail not found");
    }
    return clone(detail);
  }

  const payload = await requestJson<Record<string, unknown>>(
    `/plans/${planId}/destinations/${destinationId}`,
  );
  return normalizeDestinationDetail(payload);
}
