import { config } from "@/lib/config";
import type { Airport, Country, Destination, Region } from "@/features/reference/types";
import type { ParticipantInput, Plan, PlanInput, PlanParticipant } from "@/features/plans/types";

type MockState = {
  plans: Plan[];
  participants: PlanParticipant[];
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
