import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormField } from "@/components/FormField";
import { SectionCard } from "@/components/SectionCard";
import { ParticipantDraftForm } from "@/features/plans/components/ParticipantDraftForm";
import { createPlan, addParticipants, listCountries, listRegions, ApiError } from "@/lib/api";
import { config } from "@/lib/config";
import type { Country, Region } from "@/features/reference/types";
import type { ParticipantInput, PlanInput } from "@/features/plans/types";

const wizardSteps = [
  "Basics",
  "Participants",
  "Regions",
  "Review",
];

const timezoneOptions = [
  "America/Panama",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/Madrid",
  "UTC",
];

const now = new Date("2026-04-06T14:00:00.000Z");
const later = new Date("2026-04-10T20:00:00.000Z");

function toLocalSeed(date: Date) {
  return date.toISOString().slice(0, 16);
}

export function NewPlanPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    organization_id: config.organizationId,
    created_by_user_id: 1,
    name: "",
    description: "",
    event_start: toLocalSeed(now),
    event_end: toLocalSeed(later),
    event_timezone: "America/Panama",
    arrival_buffer_hours: 12,
    departure_buffer_hours: 4,
    max_budget_per_person: "1200",
    currency: "USD",
    cabin_class: "ECONOMY",
    search_mode: "strict",
    region_filter_ids: [] as number[],
  });

  useEffect(() => {
    void Promise.all([listRegions(), listCountries()])
      .then(([regionItems, countryItems]) => {
        setRegions(regionItems);
        setCountries(countryItems);
      })
      .catch(() => {
        setMessage("Reference data could not be loaded. You can still continue in mock mode.");
      });
  }, []);

  function updateDraft(key: string, value: string | number | number[]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleRegion(regionId: number) {
    setDraft((current) => ({
      ...current,
      region_filter_ids: current.region_filter_ids.includes(regionId)
        ? current.region_filter_ids.filter((value) => value !== regionId)
        : [...current.region_filter_ids, regionId],
    }));
  }

  function nextStep() {
    setStepIndex((current) => Math.min(current + 1, wizardSteps.length - 1));
  }

  function previousStep() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function appendParticipant(participant: ParticipantInput) {
    setParticipants((current) => [...current, participant]);
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      setMessage("Plan name is required before saving.");
      return;
    }

    if (new Date(draft.event_end).getTime() <= new Date(draft.event_start).getTime()) {
      setMessage("Event end must be after event start.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const planInput: PlanInput = {
      organization_id: draft.organization_id,
      created_by_user_id: draft.created_by_user_id,
      name: draft.name.trim(),
      description: draft.description.trim(),
      event_start: new Date(draft.event_start).toISOString(),
      event_end: new Date(draft.event_end).toISOString(),
      event_timezone: draft.event_timezone,
      arrival_buffer_hours: Number(draft.arrival_buffer_hours),
      departure_buffer_hours: Number(draft.departure_buffer_hours),
      max_budget_per_person: draft.max_budget_per_person ? Number(draft.max_budget_per_person) : null,
      currency: draft.currency,
      cabin_class: draft.cabin_class,
      search_mode: draft.search_mode,
      region_filter_ids: draft.region_filter_ids,
    };

    try {
      const createdPlan = await createPlan(planInput);
      if (participants.length > 0) {
        await addParticipants(createdPlan.id, participants);
      }
      navigate(`/plans/${createdPlan.id}`);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to save the plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard className="grid gap-6 lg:grid-cols-[0.45fr_1fr]">
        <div className="rounded-[1.75rem] border border-[color:var(--border-strong)] bg-white/70 p-5">
          <p className="eyebrow">Plan wizard</p>
          <h1 className="section-title mt-3 text-4xl font-semibold">Build the planning brief.</h1>
          <div className="mt-6 space-y-3">
            {wizardSteps.map((step, index) => (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  index === stepIndex
                    ? "bg-[color:var(--ink-950)] text-[color:var(--sand-50)]"
                    : "route-chip"
                }`}
                key={step}
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {stepIndex === 0 ? (
            <SectionCard>
              <p className="eyebrow">Step 1</p>
              <h2 className="section-title mt-3 text-4xl font-semibold">Plan basics and guardrails.</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FormField label="Plan name">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("name", event.target.value)}
                      placeholder="EMEA + Americas leadership sync"
                      value={draft.name}
                    />
                  </div>
                </FormField>

                <FormField label="Event timezone">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <select
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("event_timezone", event.target.value)}
                      value={draft.event_timezone}
                    >
                      {timezoneOptions.map((timezone) => (
                        <option
                          key={timezone}
                          value={timezone}
                        >
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>

                <FormField label="Event start">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("event_start", event.target.value)}
                      type="datetime-local"
                      value={draft.event_start}
                    />
                  </div>
                </FormField>

                <FormField label="Event end">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("event_end", event.target.value)}
                      type="datetime-local"
                      value={draft.event_end}
                    />
                  </div>
                </FormField>

                <FormField label="Arrival buffer (hours)">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      min={0}
                      onChange={(event) => updateDraft("arrival_buffer_hours", Number(event.target.value))}
                      type="number"
                      value={draft.arrival_buffer_hours}
                    />
                  </div>
                </FormField>

                <FormField label="Departure buffer (hours)">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      min={0}
                      onChange={(event) => updateDraft("departure_buffer_hours", Number(event.target.value))}
                      type="number"
                      value={draft.departure_buffer_hours}
                    />
                  </div>
                </FormField>

                <FormField label="Budget per traveler">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      min={0}
                      onChange={(event) => updateDraft("max_budget_per_person", event.target.value)}
                      placeholder="1200"
                      type="number"
                      value={draft.max_budget_per_person}
                    />
                  </div>
                </FormField>

                <FormField label="Currency">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      maxLength={3}
                      onChange={(event) => updateDraft("currency", event.target.value.toUpperCase())}
                      value={draft.currency}
                    />
                  </div>
                </FormField>

                <FormField label="Cabin class">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <select
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("cabin_class", event.target.value)}
                      value={draft.cabin_class}
                    >
                      <option value="ECONOMY">Economy</option>
                      <option value="PREMIUM_ECONOMY">Premium economy</option>
                      <option value="BUSINESS">Business</option>
                      <option value="FIRST">First</option>
                    </select>
                  </div>
                </FormField>

                <FormField label="Search mode">
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <select
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("search_mode", event.target.value)}
                      value={draft.search_mode}
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
                    onChange={(event) => updateDraft("description", event.target.value)}
                    placeholder="Who is meeting, why this event matters, and any planning context the future search layer should respect."
                    value={draft.description}
                  />
                </div>
              </FormField>
            </SectionCard>
          ) : null}

          {stepIndex === 1 ? (
            <SectionCard>
              <p className="eyebrow">Step 2</p>
              <h2 className="section-title mt-3 text-4xl font-semibold">Capture the real departure map.</h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
                This slice supports guest participants and per-person airport choices. You can always add more travelers later from the plan detail page.
              </p>
              <div className="mt-6">
                <ParticipantDraftForm
                  countries={countries}
                  onAdd={appendParticipant}
                />
              </div>

              <div className="mt-6 space-y-3">
                {participants.length === 0 ? (
                  <div className="route-chip rounded-2xl px-4 py-4 text-sm text-[color:var(--ink-600)]">
                    No participants staged yet. Saving without participants is allowed, but search orchestration later will require at least one.
                  </div>
                ) : (
                  participants.map((participant, index) => (
                    <div
                      className="route-chip flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4"
                      key={`${participant.guest_name}-${index}`}
                    >
                      <div>
                        <div className="font-bold">{participant.guest_name}</div>
                        <div className="text-sm text-[color:var(--ink-600)]">
                          {participant.departure_city} · airport #{participant.departure_airport_id}
                        </div>
                      </div>
                      <button
                        className="text-sm font-bold text-rose-700"
                        onClick={() =>
                          setParticipants((current) =>
                            current.filter((_, participantIndex) => participantIndex !== index),
                          )
                        }
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          ) : null}

          {stepIndex === 2 ? (
            <SectionCard>
              <p className="eyebrow">Step 3</p>
              <h2 className="section-title mt-3 text-4xl font-semibold">Optional region filter.</h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
                Region filtering helps the future search slice stay focused when you already know the broad zone worth exploring.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {regions.map((region) => {
                  const checked = draft.region_filter_ids.includes(region.id);

                  return (
                    <button
                      className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                        checked
                          ? "border-[color:var(--ink-950)] bg-[color:var(--ink-950)] text-[color:var(--sand-50)]"
                          : "border-[color:var(--border-strong)] bg-white/70"
                      }`}
                      key={region.id}
                      onClick={() => toggleRegion(region.id)}
                      type="button"
                    >
                      <div className="eyebrow text-inherit/70">Region</div>
                      <div className="section-title mt-3 text-3xl font-semibold">{region.name}</div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          ) : null}

          {stepIndex === 3 ? (
            <SectionCard>
              <p className="eyebrow">Step 4</p>
              <h2 className="section-title mt-3 text-4xl font-semibold">Review and create the plan.</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="route-chip rounded-[1.75rem] p-5">
                  <div className="eyebrow">Event setup</div>
                  <div className="mt-4 space-y-2 text-sm leading-7">
                    <p><strong>Name:</strong> {draft.name || "Untitled plan"}</p>
                    <p><strong>Timezone:</strong> {draft.event_timezone}</p>
                    <p><strong>Search mode:</strong> {draft.search_mode}</p>
                    <p><strong>Cabin class:</strong> {draft.cabin_class}</p>
                    <p><strong>Budget:</strong> {draft.max_budget_per_person ? `${draft.currency} ${draft.max_budget_per_person}` : "Open"}</p>
                  </div>
                </div>
                <div className="route-chip rounded-[1.75rem] p-5">
                  <div className="eyebrow">Team scope</div>
                  <div className="mt-4 space-y-2 text-sm leading-7">
                    <p><strong>Participants staged:</strong> {participants.length}</p>
                    <p><strong>Region filters:</strong> {draft.region_filter_ids.length === 0 ? "All regions" : draft.region_filter_ids.length}</p>
                    <p><strong>Organization:</strong> {draft.organization_id}</p>
                    <p><strong>Created by user:</strong> {draft.created_by_user_id}</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {message ? <p className="text-sm font-semibold text-rose-700">{message}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              className="route-chip rounded-full px-5 py-3 text-sm font-extrabold"
              disabled={stepIndex === 0}
              onClick={previousStep}
              type="button"
            >
              Previous
            </button>
            <div className="flex gap-3">
              {stepIndex < wizardSteps.length - 1 ? (
                <button
                  className="rounded-full bg-[color:var(--ink-950)] px-6 py-3 text-sm font-extrabold text-[color:var(--sand-50)]"
                  onClick={nextStep}
                  type="button"
                >
                  Continue
                </button>
              ) : (
                <button
                  className="rounded-full bg-[color:var(--ink-950)] px-6 py-3 text-sm font-extrabold text-[color:var(--sand-50)]"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {saving ? "Creating..." : "Create plan"}
                </button>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
