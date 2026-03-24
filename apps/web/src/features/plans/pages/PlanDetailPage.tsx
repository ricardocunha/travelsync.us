import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { FormField } from "@/components/FormField";
import { SectionCard } from "@/components/SectionCard";
import { StatusPill } from "@/components/StatusPill";
import { ParticipantDraftForm } from "@/features/plans/components/ParticipantDraftForm";
import type { Country, Region } from "@/features/reference/types";
import type { ParticipantInput, Plan, PlanInput, PlanParticipant } from "@/features/plans/types";
import { addParticipants, getPlan, listCountries, listParticipants, listRegions, updatePlan } from "@/lib/api";
import { formatCurrency, formatDateTime, toDateTimeLocalValue } from "@/lib/format";

export function PlanDetailPage() {
  const params = useParams();
  const planId = Number(params.planId);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [participants, setParticipants] = useState<PlanParticipant[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

    void Promise.all([
      getPlan(planId),
      listParticipants(planId),
      listRegions(),
      listCountries(),
    ])
      .then(([planItem, participantItems, regionItems, countryItems]) => {
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
            planItem.max_budget_per_person === null
              ? ""
              : String(planItem.max_budget_per_person),
          currency: planItem.currency,
          cabin_class: planItem.cabin_class,
          search_mode: planItem.search_mode,
        });
      })
      .catch(() => {
        setMessage("This plan could not be loaded.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [planId]);

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
      setMessage("Participant added.");
    } catch {
      setMessage("Unable to add participant.");
    }
  }

  if (loading) {
    return (
      <SectionCard>
        <p className="text-sm font-semibold text-[color:var(--ink-600)]">Loading plan...</p>
      </SectionCard>
    );
  }

  if (!plan) {
    return (
      <SectionCard>
        <p className="text-sm font-semibold text-rose-700">{message ?? "Plan not found."}</p>
      </SectionCard>
    );
  }

  const regionNames = regions
    .filter((region) => plan.region_filter_ids.includes(region.id))
    .map((region) => region.name);

  return (
    <div className="space-y-6">
      <SectionCard className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">Plan #{plan.id}</p>
            <StatusPill status={plan.status} />
          </div>
          <h1 className="section-title mt-4 text-5xl font-semibold">{plan.name}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--ink-600)]">
            {plan.description || "No planning description captured yet."}
          </p>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border-strong)] bg-white/70 p-5">
          <div className="eyebrow">Current readiness</div>
          <div className="mt-4 space-y-4 text-sm leading-7">
            <p><strong>Window:</strong> {formatDateTime(plan.event_start, plan.event_timezone)} to {formatDateTime(plan.event_end, plan.event_timezone)}</p>
            <p><strong>Budget:</strong> {formatCurrency(plan.max_budget_per_person, plan.currency)}</p>
            <p><strong>Filters:</strong> {regionNames.length === 0 ? "All regions" : regionNames.join(", ")}</p>
            <p><strong>Participants:</strong> {participants.length}</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard>
          <p className="eyebrow">Basics editor</p>
          <h2 className="section-title mt-3 text-4xl font-semibold">Tighten the planning brief.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField label="Plan name">
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                  value={editor.name}
                />
              </div>
            </FormField>
            <FormField label="Event timezone">
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) =>
                    setEditor((current) => ({ ...current, event_timezone: event.target.value }))
                  }
                  value={editor.event_timezone}
                />
              </div>
            </FormField>
            <FormField label="Event start">
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_start: event.target.value }))}
                  type="datetime-local"
                  value={editor.event_start}
                />
              </div>
            </FormField>
            <FormField label="Event end">
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  onChange={(event) => setEditor((current) => ({ ...current, event_end: event.target.value }))}
                  type="datetime-local"
                  value={editor.event_end}
                />
              </div>
            </FormField>
            <FormField label="Arrival buffer">
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  min={0}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      arrival_buffer_hours: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={editor.arrival_buffer_hours}
                />
              </div>
            </FormField>
            <FormField label="Departure buffer">
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent outline-none"
                  min={0}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      departure_buffer_hours: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={editor.departure_buffer_hours}
                />
              </div>
            </FormField>
            <FormField label="Budget per traveler">
              <div className="field-shell rounded-2xl px-4 py-3">
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
              <div className="field-shell rounded-2xl px-4 py-3">
                <select
                  className="w-full bg-transparent outline-none"
                  onChange={(event) =>
                    setEditor((current) => ({ ...current, search_mode: event.target.value }))
                  }
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
            <div className="field-shell mt-4 rounded-[1.75rem] px-4 py-3">
              <textarea
                className="min-h-28 w-full resize-y bg-transparent outline-none"
                onChange={(event) =>
                  setEditor((current) => ({ ...current, description: event.target.value }))
                }
                value={editor.description}
              />
            </div>
          </FormField>

          <div className="mt-6 flex justify-end">
            <button
              className="rounded-full bg-[color:var(--ink-950)] px-6 py-3 text-sm font-extrabold text-[color:var(--sand-50)]"
              disabled={saving}
              onClick={() => void handleSaveBasics()}
              type="button"
            >
              {saving ? "Saving..." : "Save basics"}
            </button>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard>
            <p className="eyebrow">Participants</p>
            <h2 className="section-title mt-3 text-4xl font-semibold">Departure map</h2>
            <div className="mt-6 space-y-3">
              {participants.map((participant) => (
                <div
                  className="route-chip rounded-[1.5rem] px-4 py-4"
                  key={participant.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold">{participant.guest_name}</div>
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

          <SectionCard>
            <p className="eyebrow">Add participant</p>
            <h2 className="section-title mt-3 text-4xl font-semibold">Extend the team map.</h2>
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

      <SectionCard>
        <p className="eyebrow">Coming next</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="route-chip rounded-[1.5rem] px-4 py-4 text-sm">Flight search orchestration will attach to this plan.</div>
          <div className="route-chip rounded-[1.5rem] px-4 py-4 text-sm">Destination ranking cards will live here after scoring is implemented.</div>
          <div className="route-chip rounded-[1.5rem] px-4 py-4 text-sm">AI recommendation and final summary will appear once the agent boundary is connected.</div>
        </div>
      </SectionCard>

      {message ? <p className="text-sm font-semibold text-[color:var(--ink-700)]">{message}</p> : null}
    </div>
  );
}
