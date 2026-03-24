import { vi } from "vitest";

import { addParticipants, createPlan, listParticipants, listPlans, resetMockState } from "@/lib/api";

describe("mock plan api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_MOCK", "true");
    vi.stubEnv("VITE_ORGANIZATION_ID", "1");
    resetMockState();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a plan and lists it at the top of the plan board", async () => {
    const created = await createPlan({
      organization_id: 1,
      created_by_user_id: 1,
      name: "Leadership Summit",
      description: "Quarterly operating review.",
      event_start: "2026-05-10T14:00:00.000Z",
      event_end: "2026-05-12T20:00:00.000Z",
      event_timezone: "America/New_York",
      arrival_buffer_hours: 12,
      departure_buffer_hours: 4,
      max_budget_per_person: 900,
      currency: "USD",
      cabin_class: "ECONOMY",
      search_mode: "strict",
      region_filter_ids: [1, 4],
    });

    const plans = await listPlans(1);

    expect(created.id).toBeGreaterThan(1);
    expect(plans[0]?.name).toBe("Leadership Summit");
  });

  it("adds participants to a plan", async () => {
    const createdParticipants = await addParticipants(1, [
      {
        guest_name: "Maria",
        guest_email: "maria@example.com",
        departure_city: "Sao Paulo",
        departure_airport_id: 302,
        departure_country_id: 3,
      },
    ]);

    const participants = await listParticipants(1);

    expect(createdParticipants).toHaveLength(1);
    expect(participants.some((participant) => participant.guest_name === "Maria")).toBe(true);
  });
});
