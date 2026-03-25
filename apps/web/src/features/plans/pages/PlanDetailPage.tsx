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
  const [compareDestinationIds, setCompareDestinationIds] = useState<number[]>([]);
  const [compareDetailsByDestinationId, setCompareDetailsByDestinationId] = useState<
    Record<number, PlanDestinationDetail>
  >({});
  const [loadingComparisonDetails, setLoadingComparisonDetails] = useState(false);
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

  useEffect(() => {
    if (!plan || compareDestinationIds.length === 0) {
      return;
    }

    const missingDestinationIDs = compareDestinationIds.filter(
      (destinationID) => !compareDetailsByDestinationId[destinationID],
    );

    if (missingDestinationIDs.length === 0) {
      return;
    }

    let cancelled = false;
    setLoadingComparisonDetails(true);

    void Promise.all(
      missingDestinationIDs.map(async (destinationID) => {
        const detail = await getPlanDestinationDetail(plan.id, destinationID);
        return [destinationID, detail] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) {
          return;
        }
        setCompareDetailsByDestinationId((current) => {
          const next = { ...current };
          for (const [destinationID, detail] of entries) {
            next[destinationID] = detail;
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("Some comparison details could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingComparisonDetails(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [compareDestinationIds, compareDetailsByDestinationId, plan]);

  function toggleCompareDestination(destinationID: number) {
    setCompareDestinationIds((current) => {
      if (current.includes(destinationID)) {
        return current.filter((item) => item !== destinationID);
      }

      if (current.length >= 3) {
        setMessage("You can compare up to 3 destinations at a time.");
        return current;
      }

      return [...current, destinationID];
    });
  }

  function clearComparison() {
    setCompareDestinationIds([]);
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
      setCompareDestinationIds([]);
      setCompareDetailsByDestinationId({});
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
      <SectionCard>
        <p className="text-sm text-[color:var(--text-secondary)]">Loading plan...</p>
      </SectionCard>
    );
  }

  if (!plan) {
    return (
      <SectionCard>
        <p className="text-sm font-medium text-[color:var(--rose)]">{message ?? "Plan not found."}</p>
      </SectionCard>
    );
  }

  const regionNames = regions
    .filter((region) => plan.region_filter_ids.includes(region.id))
    .map((region) => region.name);

  const selectedDestinationName =
    destinationResults.find((item) => item.destination.id === selectedDestinationId)?.destination.name ?? null;

  const comparedResults = compareDestinationIds
    .map((destinationID) => destinationResults.find((item) => item.destination.id === destinationID))
    .filter((result): result is PlanDestinationResult => Boolean(result));

  const bestByCost = comparedResults.reduce<number | null>((winnerID, current) => {
    if (!winnerID) {
      return current.destination.id;
    }
    const winner = comparedResults.find((item) => item.destination.id === winnerID);
    if (!winner) {
      return current.destination.id;
    }
    return current.result.total_cost < winner.result.total_cost ? current.destination.id : winnerID;
  }, null);

  const bestByTime = comparedResults.reduce<number | null>((winnerID, current) => {
    if (!winnerID) {
      return current.destination.id;
    }
    const winner = comparedResults.find((item) => item.destination.id === winnerID);
    if (!winner) {
      return current.destination.id;
    }
    return current.result.total_flight_hours < winner.result.total_flight_hours
      ? current.destination.id
      : winnerID;
  }, null);

  const bestByArrivalSpread = comparedResults.reduce<number | null>((winnerID, current) => {
    if (!winnerID) {
      return current.destination.id;
    }
    const winner = comparedResults.find((item) => item.destination.id === winnerID);
    if (!winner) {
      return current.destination.id;
    }
    return current.result.arrival_spread_hours < winner.result.arrival_spread_hours
      ? current.destination.id
      : winnerID;
  }, null);

  const bestByMaxBurden = comparedResults.reduce<number | null>((winnerID, current) => {
    if (!winnerID) {
      return current.destination.id;
    }
    const winner = comparedResults.find((item) => item.destination.id === winnerID);
    if (!winner) {
      return current.destination.id;
    }
    return current.result.max_flight_hours < winner.result.max_flight_hours
      ? current.destination.id
      : winnerID;
  }, null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-accent p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="label-mono text-[color:var(--accent-hover)]">Plan #{plan.id}</p>
              <StatusPill status={plan.status} />
            </div>
            <h1 className="heading-display mt-3 max-w-3xl text-4xl sm:text-5xl">{plan.name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
              {plan.description || "No planning description captured yet."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="chip p-4">
              <div className="label-mono text-[0.6rem]">Event window</div>
              <div className="mt-2 text-sm font-semibold">
                {formatDateTime(plan.event_start, plan.event_timezone)}
              </div>
              <div className="mt-0.5 text-xs text-[color:var(--text-tertiary)]">
                to {formatDateTime(plan.event_end, plan.event_timezone)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="chip p-3.5">
                <div className="label-mono text-[0.6rem]">Budget</div>
                <div className="mt-1.5 text-sm font-semibold">
                  {formatCurrency(plan.max_budget_per_person, plan.currency)}
                </div>
              </div>
              <div className="chip p-3.5">
                <div className="label-mono text-[0.6rem]">Participants</div>
                <div className="mt-1.5 text-sm font-semibold">{participants.length}</div>
              </div>
            </div>
            <div className="chip p-3.5">
              <div className="label-mono text-[0.6rem]">Filters</div>
              <div className="mt-1.5 text-sm font-semibold">
                {regionNames.length === 0 ? "All regions" : regionNames.join(", ")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor + Participants */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard className="p-6">
          <p className="label-mono text-[color:var(--accent)]">Edit</p>
          <h2 className="heading-section mt-2 text-2xl">Plan basics</h2>

          <div className="mt-5 grid gap-3.5 md:grid-cols-2">
            <FormField label="Plan name">
              <div className="input-wrap px-3 py-2.5">
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                  value={editor.name}
                />
              </div>
            </FormField>
            <FormField label="Event timezone">
              <div className="input-wrap px-3 py-2.5">
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_timezone: event.target.value }))}
                  value={editor.event_timezone}
                />
              </div>
            </FormField>
            <FormField label="Event start">
              <div className="input-wrap px-3 py-2.5">
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_start: event.target.value }))}
                  type="datetime-local"
                  value={editor.event_start}
                />
              </div>
            </FormField>
            <FormField label="Event end">
              <div className="input-wrap px-3 py-2.5">
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_end: event.target.value }))}
                  type="datetime-local"
                  value={editor.event_end}
                />
              </div>
            </FormField>
            <FormField label="Arrival buffer">
              <div className="input-wrap px-3 py-2.5">
                <input
                  className="w-full bg-transparent text-sm outline-none"
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
              <div className="input-wrap px-3 py-2.5">
                <input
                  className="w-full bg-transparent text-sm outline-none"
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
              <div className="input-wrap px-3 py-2.5">
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  onChange={(event) =>
                    setEditor((current) => ({ ...current, max_budget_per_person: event.target.value }))
                  }
                  type="number"
                  value={editor.max_budget_per_person}
                />
              </div>
            </FormField>
            <FormField label="Search mode">
              <div className="input-wrap px-3 py-2.5">
                <select
                  className="w-full bg-transparent text-sm outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, search_mode: event.target.value }))}
                  value={editor.search_mode}
                >
                  <option value="strict">Strict</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </FormField>
          </div>

          <div className="mt-4">
            <FormField
              hint="Optional"
              label="Description"
            >
              <div className="input-wrap px-3 py-2.5">
                <textarea
                  className="min-h-24 w-full resize-y bg-transparent text-sm outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))}
                  value={editor.description}
                />
              </div>
            </FormField>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              className="btn-primary"
              disabled={saving}
              onClick={() => void handleSaveBasics()}
              type="button"
            >
              {saving ? "Saving..." : "Save basics"}
            </button>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard className="p-6">
            <p className="label-mono">Team</p>
            <h2 className="heading-section mt-2 text-2xl">Departure map</h2>
            <div className="mt-4 space-y-2">
              {participants.map((participant) => (
                <div
                  className="chip flex items-center justify-between gap-3 px-4 py-3"
                  key={participant.id}
                >
                  <div>
                    <div className="text-sm font-semibold">{participant.guest_name}</div>
                    <div className="mt-0.5 text-xs text-[color:var(--text-tertiary)]">
                      {participant.departure_city} · airport #{participant.departure_airport_id}
                    </div>
                  </div>
                  <StatusPill status={participant.status} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <p className="label-mono">Add</p>
            <h2 className="heading-section mt-2 text-2xl">New participant</h2>
            <div className="mt-4">
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

      {/* Search orchestration */}
      <SectionCard className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="label-mono text-[color:var(--accent)]">Search</p>
            <h2 className="heading-section mt-2 text-3xl">Destination comparison</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
              Score curated destinations across cost, travel burden, and arrival synchronization using the current participant map.
            </p>
          </div>
          <button
            className="btn-primary shrink-0"
            disabled={participants.length === 0 || runningSearch}
            onClick={() => void handleRunSearch()}
            type="button"
          >
            {runningSearch ? "Running..." : "Run destination search"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="chip px-4 py-3">
            <div className="label-mono text-[0.6rem]">State</div>
            <div className="mt-1.5 text-lg font-semibold">{searchStatus?.status ?? plan.status}</div>
          </div>
          <div className="chip px-4 py-3">
            <div className="label-mono text-[0.6rem]">Travelers</div>
            <div className="mt-1.5 text-lg font-semibold">{searchStatus?.participants ?? participants.length}</div>
          </div>
          <div className="chip px-4 py-3">
            <div className="label-mono text-[0.6rem]">Scored</div>
            <div className="mt-1.5 text-lg font-semibold">{searchStatus?.destinations ?? destinationResults.length}</div>
          </div>
          <div className="chip px-4 py-3">
            <div className="label-mono text-[0.6rem]">Completed</div>
            <div className="mt-1.5 text-sm font-semibold">
              {searchStatus?.completed_at ? formatDateTime(searchStatus.completed_at, plan.event_timezone) : "Not yet"}
            </div>
          </div>
        </div>

        {destinationResults.length === 0 ? (
          <div className="chip mt-6 px-5 py-5 text-sm text-[color:var(--text-secondary)]">
            No scored destinations yet. Add participants, refine constraints, and run the search when ready.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]">
                Comparison picks {compareDestinationIds.length}/3
              </span>
              {compareDestinationIds.length > 0 ? (
                <button
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={clearComparison}
                  type="button"
                >
                  Clear comparison
                </button>
              ) : null}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              {/* Ranked destinations */}
              <div className="space-y-3">
                {destinationResults.map((item) => {
                  const isSelected = item.destination.id === selectedDestinationId;
                  const isCompared = compareDestinationIds.includes(item.destination.id);
                  const regionName = regions.find((region) => region.id === item.destination.region_id)?.name ?? "Curated region";

                  return (
                    <div
                      className={`w-full rounded-xl border p-5 transition ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                          : "border-[var(--border-default)] bg-[var(--bg-overlay)]"
                      }`}
                      key={item.destination.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`label-mono text-[0.6rem] ${isSelected ? "text-[color:var(--accent-hover)]" : ""}`}>
                            Rank #{item.result.overall_rank}
                          </div>
                          <h3 className="heading-section mt-2 text-2xl">{item.destination.name}</h3>
                          <p className="mt-1 text-xs text-[color:var(--text-tertiary)]">{regionName}</p>
                        </div>
                        <span className="pill border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]">
                          balance #{item.result.rank_by_balance}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className={`rounded-lg px-3 py-2.5 ${isSelected ? "bg-[rgba(99,102,241,0.08)]" : "bg-[var(--bg-surface)]"}`}>
                          <div className="label-mono text-[0.58rem]">Total cost</div>
                          <div className="mt-1 text-sm font-semibold">
                            {formatCurrency(item.result.total_cost, plan.currency)}
                          </div>
                        </div>
                        <div className={`rounded-lg px-3 py-2.5 ${isSelected ? "bg-[rgba(99,102,241,0.08)]" : "bg-[var(--bg-surface)]"}`}>
                          <div className="label-mono text-[0.58rem]">Avg hours</div>
                          <div className="mt-1 text-sm font-semibold">{formatHours(item.result.avg_flight_hours)}</div>
                        </div>
                        <div className={`rounded-lg px-3 py-2.5 ${isSelected ? "bg-[rgba(99,102,241,0.08)]" : "bg-[var(--bg-surface)]"}`}>
                          <div className="label-mono text-[0.58rem]">Arrival spread</div>
                          <div className="mt-1 text-sm font-semibold">{formatHours(item.result.arrival_spread_hours)}</div>
                        </div>
                        <div className={`rounded-lg px-3 py-2.5 ${isSelected ? "bg-[rgba(99,102,241,0.08)]" : "bg-[var(--bg-surface)]"}`}>
                          <div className="label-mono text-[0.58rem]">Max burden</div>
                          <div className="mt-1 text-sm font-semibold">{formatHours(item.result.max_flight_hours)}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          className="btn-secondary px-3 py-1.5 text-xs"
                          onClick={() => void loadDestinationDetail(item.destination.id)}
                          type="button"
                        >
                          {isSelected ? "Viewing route detail" : "View route detail"}
                        </button>
                        <button
                          aria-pressed={isCompared}
                          className={`btn-secondary px-3 py-1.5 text-xs ${
                            isCompared ? "border-[var(--accent)] text-[color:var(--text-primary)]" : ""
                          }`}
                          onClick={() => toggleCompareDestination(item.destination.id)}
                          type="button"
                        >
                          {isCompared ? `Remove ${item.destination.name}` : `Compare ${item.destination.name}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail panel */}
              <div className="card-raised p-5">
                <p className="label-mono text-[color:var(--accent)]">Selected destination detail</p>
                <h3 className="heading-section mt-2 text-2xl">
                  {selectedDestinationName ?? "Select a destination"}
                </h3>
                {destinationDetail ? (
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                    {formatCurrency(destinationDetail.result.result.total_cost, plan.currency)} total ·{" "}
                    {formatHours(destinationDetail.result.result.total_flight_hours)} total hours
                  </p>
                ) : null}

                {loadingDetail ? (
                  <p className="mt-6 text-sm text-[color:var(--text-secondary)]">Loading routes...</p>
                ) : destinationDetail ? (
                  <div className="mt-5 space-y-3">
                    {destinationDetail.flights.map((item) => (
                      <div
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] p-4"
                        key={item.flight.id}
                      >
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="text-sm font-semibold">{item.display_name}</div>
                            <div className="mt-0.5 text-xs text-[color:var(--text-tertiary)]">
                              {item.departure_tag} · {item.flight.direction}
                            </div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                              <div className="label-mono text-[0.56rem]">Route</div>
                              <div className="mt-1 text-xs font-semibold">
                                {item.flight.origin_airport} → {item.flight.dest_airport}
                              </div>
                              <div className="text-[0.65rem] text-[color:var(--text-tertiary)]">{item.flight.main_carrier}</div>
                            </div>
                            <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                              <div className="label-mono text-[0.56rem]">Departs</div>
                              <div className="mt-1 text-xs font-semibold">
                                {formatDateTime(item.flight.departure_time, plan.event_timezone)}
                              </div>
                            </div>
                            <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                              <div className="label-mono text-[0.56rem]">Arrives</div>
                              <div className="mt-1 text-xs font-semibold">
                                {formatDateTime(item.flight.arrival_time, plan.event_timezone)}
                              </div>
                            </div>
                            <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                              <div className="label-mono text-[0.56rem]">Cost</div>
                              <div className="mt-1 text-xs font-semibold">
                                {formatCurrency(item.flight.price, item.flight.currency)} · {item.flight.stops} stops
                              </div>
                              <div className="text-[0.65rem] text-[color:var(--text-tertiary)]">
                                {formatHours(item.flight.duration_minutes / 60)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
                    Pick a ranked destination to inspect the flight set per traveler.
                  </p>
                )}
              </div>
            </div>

            {comparedResults.length >= 2 ? (
              <div className="card-raised p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="label-mono text-[color:var(--accent)]">Comparison mode</p>
                    <h3 className="heading-section mt-2 text-2xl">Side-by-side destination board</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]">
                      Best cost: {comparedResults.find((item) => item.destination.id === bestByCost)?.destination.name ?? "n/a"}
                    </span>
                    <span className="pill border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]">
                      Best time: {comparedResults.find((item) => item.destination.id === bestByTime)?.destination.name ?? "n/a"}
                    </span>
                    <span className="pill border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]">
                      Best sync: {comparedResults.find((item) => item.destination.id === bestByArrivalSpread)?.destination.name ?? "n/a"}
                    </span>
                  </div>
                </div>

                <div className={`mt-5 grid gap-4 ${comparedResults.length === 2 ? "lg:grid-cols-2" : "xl:grid-cols-3"}`}>
                  {comparedResults.map((item) => {
                    const detail = compareDetailsByDestinationId[item.destination.id];
                    const flightCount = detail?.flights.length ?? 0;
                    const averageStops =
                      detail && detail.flights.length > 0
                        ? detail.flights.reduce((total, flightItem) => total + flightItem.flight.stops, 0) /
                          detail.flights.length
                        : null;

                    return (
                      <article
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-overlay)] p-4"
                        key={`comparison-${item.destination.id}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="label-mono text-[0.58rem]">Rank #{item.result.overall_rank}</div>
                            <h4 className="heading-section mt-1.5 text-xl">{item.destination.name}</h4>
                          </div>
                          <span className="pill border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]">
                            balance #{item.result.rank_by_balance}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                            <div className="label-mono text-[0.56rem]">Total cost</div>
                            <div className="mt-1 text-xs font-semibold">{formatCurrency(item.result.total_cost, plan.currency)}</div>
                          </div>
                          <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                            <div className="label-mono text-[0.56rem]">Total hours</div>
                            <div className="mt-1 text-xs font-semibold">{formatHours(item.result.total_flight_hours)}</div>
                          </div>
                          <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                            <div className="label-mono text-[0.56rem]">Arrival spread</div>
                            <div className="mt-1 text-xs font-semibold">{formatHours(item.result.arrival_spread_hours)}</div>
                          </div>
                          <div className="rounded-md bg-[var(--bg-surface)] px-3 py-2">
                            <div className="label-mono text-[0.56rem]">Max burden</div>
                            <div className="mt-1 text-xs font-semibold">{formatHours(item.result.max_flight_hours)}</div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-[color:var(--text-tertiary)]">
                          {loadingComparisonDetails && !detail
                            ? "Loading route stats..."
                            : detail
                              ? `${flightCount} sampled routes · avg ${averageStops?.toFixed(1) ?? "0.0"} stops`
                              : "Route stats unavailable"}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {bestByCost === item.destination.id ? (
                            <span className="pill border border-[var(--emerald)] bg-[var(--emerald-muted)] text-[color:var(--text-primary)]">
                              Lowest cost
                            </span>
                          ) : null}
                          {bestByTime === item.destination.id ? (
                            <span className="pill border border-[var(--cyan)] bg-[var(--cyan-muted)] text-[color:var(--text-primary)]">
                              Lowest time
                            </span>
                          ) : null}
                          {bestByArrivalSpread === item.destination.id ? (
                            <span className="pill border border-[var(--amber)] bg-[var(--amber-muted)] text-[color:var(--text-primary)]">
                              Tightest arrival spread
                            </span>
                          ) : null}
                          {bestByMaxBurden === item.destination.id ? (
                            <span className="pill border border-[var(--accent)] bg-[var(--accent-muted)] text-[color:var(--text-primary)]">
                              Lightest max burden
                            </span>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      {/* Next milestones */}
      <SectionCard className="p-6">
        <p className="label-mono">Roadmap</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="card-dark rounded-lg p-4 text-sm text-[color:var(--text-secondary)]">
            Destination selection and booking confirmation still need their own backend slice.
          </div>
          <div className="chip p-4 text-sm text-[color:var(--text-secondary)]">
            AI recommendation remains separate so the Go API can call the Python agent boundary cleanly.
          </div>
          <div className="chip p-4 text-sm text-[color:var(--text-secondary)]">
            Final summary, grouped by departure origin, still lands after selection is implemented.
          </div>
        </div>
      </SectionCard>

      {message ? <p className="text-sm font-medium text-[color:var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
