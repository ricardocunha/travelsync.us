import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { FormField } from "@/components/FormField";
import { SectionCard } from "@/components/SectionCard";
import { StatusPill } from "@/components/StatusPill";
import { ParticipantDraftForm } from "@/features/plans/components/ParticipantDraftForm";
import type {
  ParticipantInput,
  Plan,
  PlanDestinationDetail,
  PlanDestinationResult,
  PlanInput,
  PlanParticipant,
  PlanSearchStatus,
} from "@/features/plans/types";
import type { Country, Region } from "@/features/reference/types";
import {
  addParticipants,
  getPlan,
  getPlanDestinationDetail,
  getPlanSearchStatus,
  listCountries,
  listParticipants,
  listPlanDestinationResults,
  listRegions,
  startPlanSearch,
  updatePlan,
} from "@/lib/api";
import { formatCurrency, formatDateTime, toDateTimeLocalValue } from "@/lib/format";

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export function PlanDetailPage() {
  const params = useParams();
  const planId = Number(params.planId);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [participants, setParticipants] = useState<PlanParticipant[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [searchStatus, setSearchStatus] = useState<PlanSearchStatus | null>(null);
  const [destinationResults, setDestinationResults] = useState<PlanDestinationResult[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [destinationDetail, setDestinationDetail] = useState<PlanDestinationDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningSearch, setRunningSearch] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editor, setEditor] = useState({
    name: "",
    description: "",
    event_start: "",
    event_end: "",
    event_timezone: "UTC",
    arrival_buffer_hours: 12,
    departure_buffer_hours: 4,
    max_budget_per_person: "",
    currency: "USD",
    cabin_class: "ECONOMY",
    search_mode: "strict",
  });

  useEffect(() => {
    if (!Number.isFinite(planId) || planId <= 0) {
      setLoading(false);
      setMessage("Invalid plan id.");
      return;
    }

    void Promise.all([getPlan(planId), listParticipants(planId), listRegions(), listCountries()])
      .then(async ([planItem, participantItems, regionItems, countryItems]) => {
        setPlan(planItem);
        setParticipants(participantItems);
        setRegions(regionItems);
        setCountries(countryItems);
        setEditor({
          name: planItem.name,
          description: planItem.description,
          event_start: toDateTimeLocalValue(planItem.event_start),
          event_end: toDateTimeLocalValue(planItem.event_end),
          event_timezone: planItem.event_timezone,
          arrival_buffer_hours: planItem.arrival_buffer_hours,
          departure_buffer_hours: planItem.departure_buffer_hours,
          max_budget_per_person:
            planItem.max_budget_per_person === null ? "" : String(planItem.max_budget_per_person),
          currency: planItem.currency,
          cabin_class: planItem.cabin_class,
          search_mode: planItem.search_mode,
        });

        try {
          const [status, results] = await Promise.all([
            getPlanSearchStatus(planId),
            listPlanDestinationResults(planId),
          ]);
          setSearchStatus(status);
          setDestinationResults(results);
          if (results.length > 0) {
            void loadDestinationDetail(results[0].destination.id, planItem);
          }
        } catch {
          setMessage("Plan loaded, but ranked destination data could not be loaded.");
        }
      })
      .catch(() => {
        setMessage("This plan could not be loaded.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [planId]);

  async function loadDestinationDetail(destinationId: number, activePlan: Plan | null = plan) {
    if (!activePlan) {
      return;
    }

    setLoadingDetail(true);
    setSelectedDestinationId(destinationId);

    try {
      const detail = await getPlanDestinationDetail(activePlan.id, destinationId);
      setDestinationDetail(detail);
    } catch {
      setMessage("Destination detail could not be loaded.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSaveBasics() {
    if (!plan) {
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload: PlanInput = {
      organization_id: plan.organization_id,
      created_by_user_id: plan.created_by_user_id,
      name: editor.name.trim(),
      description: editor.description.trim(),
      event_start: new Date(editor.event_start).toISOString(),
      event_end: new Date(editor.event_end).toISOString(),
      event_timezone: editor.event_timezone,
      arrival_buffer_hours: Number(editor.arrival_buffer_hours),
      departure_buffer_hours: Number(editor.departure_buffer_hours),
      max_budget_per_person: editor.max_budget_per_person ? Number(editor.max_budget_per_person) : null,
      currency: editor.currency,
      cabin_class: editor.cabin_class,
      search_mode: editor.search_mode,
      region_filter_ids: plan.region_filter_ids,
      chosen_destination_id: plan.chosen_destination_id,
      status: plan.status,
    };

    try {
      const updatedPlan = await updatePlan(plan.id, payload);
      setPlan(updatedPlan);
      setMessage("Plan basics saved.");
    } catch {
      setMessage("Unable to save plan basics.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAppendParticipant(participant: ParticipantInput) {
    if (!plan) {
      return;
    }

    try {
      const createdItems = await addParticipants(plan.id, [participant]);
      setParticipants((current) => [...current, ...createdItems]);
      setSearchStatus((current) =>
        current
          ? {
              ...current,
              participants: current.participants + createdItems.length,
            }
          : current,
      );
      setMessage("Participant added.");
    } catch {
      setMessage("Unable to add participant.");
    }
  }

  async function handleRunSearch() {
    if (!plan) {
      return;
    }

    setRunningSearch(true);
    setMessage(null);

    try {
      const status = await startPlanSearch(plan.id);
      const results = await listPlanDestinationResults(plan.id);

      setSearchStatus(status);
      setDestinationResults(results);
      setPlan((current) => (current ? { ...current, status: status.status } : current));

      if (results.length > 0) {
        await loadDestinationDetail(results[0].destination.id, plan);
      } else {
        setSelectedDestinationId(null);
        setDestinationDetail(null);
      }

      setMessage(
        results.length > 0
          ? "Destination search completed."
          : "Search completed, but no viable destinations were scored for the current constraints.",
      );
    } catch {
      setMessage("Unable to run destination search.");
    } finally {
      setRunningSearch(false);
    }
  }

  if (loading) {
    return (
      <SectionCard className="rounded-[2.4rem]">
        <p className="text-sm font-semibold text-[color:var(--ink-600)]">Loading plan...</p>
      </SectionCard>
    );
  }

  if (!plan) {
    return (
      <SectionCard className="rounded-[2.4rem]">
        <p className="text-sm font-semibold text-[color:var(--signal-coral)]">{message ?? "Plan not found."}</p>
      </SectionCard>
    );
  }

  const regionNames = regions
    .filter((region) => plan.region_filter_ids.includes(region.id))
    .map((region) => region.name);

  const selectedDestinationName =
    destinationResults.find((item) => item.destination.id === selectedDestinationId)?.destination.name ?? null;

  return (
    <div className="space-y-6">
      <SectionCard className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="signal-surface rounded-[2.6rem] p-6 sm:p-7">
          <div className="radar-dots" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">Plan #{plan.id}</p>
              <StatusPill status={plan.status} />
            </div>
            <h1 className="section-title mt-4 max-w-4xl text-6xl font-semibold">{plan.name}</h1>
            <p className="muted-copy mt-5 max-w-3xl text-base leading-8">
              {plan.description || "No planning description captured yet."}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <SectionCard className="rounded-[2.2rem] p-5">
            <div className="eyebrow">Current readiness</div>
            <div className="mt-5 space-y-4 text-sm leading-8 text-[color:var(--ink-700)]">
              <p>
                <strong>Window:</strong> {formatDateTime(plan.event_start, plan.event_timezone)} to{" "}
                {formatDateTime(plan.event_end, plan.event_timezone)}
              </p>
              <p>
                <strong>Budget:</strong> {formatCurrency(plan.max_budget_per_person, plan.currency)}
              </p>
              <p>
                <strong>Filters:</strong> {regionNames.length === 0 ? "All regions" : regionNames.join(", ")}
              </p>
              <p>
                <strong>Participants:</strong> {participants.length}
              </p>
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="route-chip rounded-[1.8rem] px-4 py-4">
              <div className="eyebrow">Search status</div>
              <div className="mt-2 text-xl font-semibold text-[color:var(--ink-900)]">
                {searchStatus?.status ?? plan.status}
              </div>
            </div>
            <div className="route-chip rounded-[1.8rem] px-4 py-4">
              <div className="eyebrow">Latest completion</div>
              <div className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                {searchStatus?.completed_at ? formatDateTime(searchStatus.completed_at, plan.event_timezone) : "Not run yet"}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <SectionCard className="rounded-[2.5rem] p-6 sm:p-7">
          <p className="eyebrow">Basics editor</p>
          <h2 className="section-title mt-4 text-5xl font-semibold">Tighten the planning brief.</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <FormField label="Plan name">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                  value={editor.name}
                />
              </div>
            </FormField>
            <FormField label="Event timezone">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_timezone: event.target.value }))}
                  value={editor.event_timezone}
                />
              </div>
            </FormField>
            <FormField label="Event start">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_start: event.target.value }))}
                  type="datetime-local"
                  value={editor.event_start}
                />
              </div>
            </FormField>
            <FormField label="Event end">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_end: event.target.value }))}
                  type="datetime-local"
                  value={editor.event_end}
                />
              </div>
            </FormField>
            <FormField label="Arrival buffer">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  min={0}
                  onChange={(event) =>
                    setEditor((current) => ({ ...current, arrival_buffer_hours: Number(event.target.value) }))
                  }
                  type="number"
                  value={editor.arrival_buffer_hours}
                />
              </div>
            </FormField>
            <FormField label="Departure buffer">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  min={0}
                  onChange={(event) =>
                    setEditor((current) => ({ ...current, departure_buffer_hours: Number(event.target.value) }))
                  }
                  type="number"
                  value={editor.departure_buffer_hours}
                />
              </div>
            </FormField>
            <FormField label="Budget per traveler">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) =>
                    setEditor((current) => ({ ...current, max_budget_per_person: event.target.value }))
                  }
                  type="number"
                  value={editor.max_budget_per_person}
                />
              </div>
            </FormField>
            <FormField label="Search mode">
              <div className="field-shell rounded-[1.5rem] px-4 py-3">
                <select
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, search_mode: event.target.value }))}
                  value={editor.search_mode}
                >
                  <option value="strict">Strict</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </FormField>
          </div>

          <FormField
            hint="Optional"
            label="Description"
          >
            <div className="field-shell mt-5 rounded-[1.8rem] px-4 py-3">
              <textarea
                className="min-h-32 w-full resize-y bg-transparent outline-none"
                onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))}
                value={editor.description}
              />
            </div>
          </FormField>

          <div className="mt-6 flex justify-end">
            <button
              className="button-primary"
              disabled={saving}
              onClick={() => void handleSaveBasics()}
              type="button"
            >
              {saving ? "Saving..." : "Save basics"}
            </button>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard className="rounded-[2.5rem] p-6 sm:p-7">
            <p className="eyebrow">Participants</p>
            <h2 className="section-title mt-4 text-5xl font-semibold">Departure map</h2>
            <div className="mt-6 space-y-3">
              {participants.map((participant) => (
                <div
                  className="route-chip rounded-[1.8rem] px-4 py-4"
                  key={participant.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[color:var(--ink-900)]">{participant.guest_name}</div>
                      <div className="text-sm text-[color:var(--ink-600)]">
                        {participant.departure_city} · airport #{participant.departure_airport_id}
                      </div>
                    </div>
                    <StatusPill status={participant.status} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="rounded-[2.5rem] p-6 sm:p-7">
            <p className="eyebrow">Add participant</p>
            <h2 className="section-title mt-4 text-5xl font-semibold">Extend the team map.</h2>
            <div className="mt-6">
              <ParticipantDraftForm
                countries={countries}
                onAdd={(participant) => {
                  void handleAppendParticipant(participant);
                }}
              />
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard className="rounded-[2.6rem] p-6 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">Search orchestration</p>
            <h2 className="section-title mt-4 text-5xl font-semibold">Run the destination comparison.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--ink-600)]">
              This slice scores curated destinations across cost, travel burden, and arrival synchronization using the current participant map and plan constraints.
            </p>
          </div>
          <button
            className="button-primary"
            disabled={participants.length === 0 || runningSearch}
            onClick={() => void handleRunSearch()}
            type="button"
          >
            {runningSearch ? "Running search..." : "Run destination search"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="command-surface rounded-[1.8rem] px-4 py-4 text-sm">
            <div className="eyebrow">State</div>
            <div className="mt-2 text-xl font-semibold">{searchStatus?.status ?? plan.status}</div>
          </div>
          <div className="command-surface rounded-[1.8rem] px-4 py-4 text-sm">
            <div className="eyebrow">Travelers</div>
            <div className="mt-2 text-xl font-semibold">{searchStatus?.participants ?? participants.length}</div>
          </div>
          <div className="command-surface rounded-[1.8rem] px-4 py-4 text-sm">
            <div className="eyebrow">Destinations scored</div>
            <div className="mt-2 text-xl font-semibold">{searchStatus?.destinations ?? destinationResults.length}</div>
          </div>
          <div className="command-surface rounded-[1.8rem] px-4 py-4 text-sm">
            <div className="eyebrow">Latest completion</div>
            <div className="mt-2 text-sm font-semibold">
              {searchStatus?.completed_at ? formatDateTime(searchStatus.completed_at, plan.event_timezone) : "Not run yet"}
            </div>
          </div>
        </div>

        {destinationResults.length === 0 ? (
          <div className="route-chip mt-6 rounded-[1.8rem] px-5 py-5 text-sm leading-8 text-[color:var(--ink-600)]">
            No scored destinations yet. Add participants, tighten the plan constraints, and run the search when you are ready.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-4">
              {destinationResults.map((item) => {
                const isSelected = item.destination.id === selectedDestinationId;
                const regionName = regions.find((region) => region.id === item.destination.region_id)?.name ?? "Curated region";

                return (
                  <button
                    className={`rounded-[2rem] border p-5 text-left transition ${
                      isSelected ? "signal-surface" : "command-surface"
                    }`}
                    key={item.destination.id}
                    onClick={() => void loadDestinationDetail(item.destination.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`eyebrow ${isSelected ? "text-[rgba(248,243,235,0.7)]" : "text-[color:var(--ink-600)]"}`}>
                          Rank #{item.result.overall_rank}
                        </div>
                        <h3 className="section-title mt-3 text-4xl font-semibold">{item.destination.name}</h3>
                        <p className={`mt-2 text-sm ${isSelected ? "text-[color:rgba(248,243,235,0.72)]" : "text-[color:var(--ink-600)]"}`}>
                          {regionName}
                        </p>
                      </div>
                      <div className="rounded-full border border-current/15 px-3 py-2 font-[var(--font-mono)] text-[0.68rem] uppercase tracking-[0.16em]">
                        balance #{item.result.rank_by_balance}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className={`rounded-[1.4rem] px-4 py-4 ${isSelected ? "bg-white/8" : "route-chip"}`}>
                        <div className={`eyebrow ${isSelected ? "text-[rgba(248,243,235,0.7)]" : "text-[color:var(--ink-600)]"}`}>Total trip cost</div>
                        <div className="mt-2 text-lg font-semibold">
                          {formatCurrency(item.result.total_cost, plan.currency)}
                        </div>
                      </div>
                      <div className={`rounded-[1.4rem] px-4 py-4 ${isSelected ? "bg-white/8" : "route-chip"}`}>
                        <div className={`eyebrow ${isSelected ? "text-[rgba(248,243,235,0.7)]" : "text-[color:var(--ink-600)]"}`}>Avg flight hours</div>
                        <div className="mt-2 text-lg font-semibold">{formatHours(item.result.avg_flight_hours)}</div>
                      </div>
                      <div className={`rounded-[1.4rem] px-4 py-4 ${isSelected ? "bg-white/8" : "route-chip"}`}>
                        <div className={`eyebrow ${isSelected ? "text-[rgba(248,243,235,0.7)]" : "text-[color:var(--ink-600)]"}`}>Arrival spread</div>
                        <div className="mt-2 text-lg font-semibold">{formatHours(item.result.arrival_spread_hours)}</div>
                      </div>
                      <div className={`rounded-[1.4rem] px-4 py-4 ${isSelected ? "bg-white/8" : "route-chip"}`}>
                        <div className={`eyebrow ${isSelected ? "text-[rgba(248,243,235,0.7)]" : "text-[color:var(--ink-600)]"}`}>Max burden</div>
                        <div className="mt-2 text-lg font-semibold">{formatHours(item.result.max_flight_hours)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="paper-panel rounded-[2.2rem] p-5">
              <p className="eyebrow">Selected destination detail</p>
              <h3 className="section-title mt-4 text-4xl font-semibold">
                {selectedDestinationName ?? "Choose a destination card"}
              </h3>
              {destinationDetail ? (
                <p className="mt-3 text-sm leading-7 text-[color:var(--ink-600)]">
                  {formatCurrency(destinationDetail.result.result.total_cost, plan.currency)} total ·{" "}
                  {formatHours(destinationDetail.result.result.total_flight_hours)} total hours
                </p>
              ) : null}

              {loadingDetail ? (
                <p className="mt-6 text-sm font-semibold text-[color:var(--ink-600)]">Loading route detail...</p>
              ) : destinationDetail ? (
                <div className="mt-6 grid gap-3">
                  {destinationDetail.flights.map((item) => (
                    <div
                      className="command-surface rounded-[1.8rem] px-4 py-4"
                      key={item.flight.id}
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-lg font-semibold text-[color:var(--ink-900)]">{item.display_name}</div>
                          <div className="text-sm text-[color:var(--ink-600)]">
                            {item.departure_tag} · {item.flight.direction}
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="route-chip rounded-[1.4rem] px-3 py-3">
                            <div className="eyebrow">Route</div>
                            <div className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                              {item.flight.origin_airport} → {item.flight.dest_airport}
                            </div>
                            <div className="text-xs text-[color:var(--ink-600)]">{item.flight.main_carrier}</div>
                          </div>
                          <div className="route-chip rounded-[1.4rem] px-3 py-3">
                            <div className="eyebrow">Departure</div>
                            <div className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                              {formatDateTime(item.flight.departure_time, plan.event_timezone)}
                            </div>
                          </div>
                          <div className="route-chip rounded-[1.4rem] px-3 py-3">
                            <div className="eyebrow">Arrival</div>
                            <div className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                              {formatDateTime(item.flight.arrival_time, plan.event_timezone)}
                            </div>
                          </div>
                          <div className="route-chip rounded-[1.4rem] px-3 py-3">
                            <div className="eyebrow">Burden</div>
                            <div className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                              {formatCurrency(item.flight.price, item.flight.currency)} · {item.flight.stops} stops
                            </div>
                            <div className="text-xs text-[color:var(--ink-600)]">
                              {formatHours(item.flight.duration_minutes / 60)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm leading-8 text-[color:var(--ink-600)]">
                  Pick a ranked destination card to inspect the selected flight set per traveler.
                </p>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard className="rounded-[2.5rem] p-6 sm:p-7">
        <p className="eyebrow">Next milestones</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="signal-surface rounded-[1.9rem] p-4">
            Destination selection and booking confirmation still need their own backend slice.
          </div>
          <div className="command-surface rounded-[1.9rem] p-4">
            AI recommendation remains separate so the Go API can call the Python agent boundary cleanly.
          </div>
          <div className="command-surface rounded-[1.9rem] p-4">
            Final summary, grouped by departure origin, still lands after selection is implemented.
          </div>
        </div>
      </SectionCard>

      {message ? <p className="text-sm font-semibold text-[color:var(--ink-700)]">{message}</p> : null}
    </div>
  );
}
