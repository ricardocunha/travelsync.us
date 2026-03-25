import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormField } from "@/components/FormField";
import { SectionCard } from "@/components/SectionCard";
import { ParticipantDraftForm } from "@/features/plans/components/ParticipantDraftForm";
import type { ParticipantInput, PlanInput } from "@/features/plans/types";
import type { Country, Region } from "@/features/reference/types";
import { addParticipants, ApiError, createPlan, listCountries, listRegions } from "@/lib/api";
import { config } from "@/lib/config";

const wizardSteps = ["Basics", "Participants", "Regions", "Review"];

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
        setMessage(
          `Reference data could not be loaded from the Go API at ${config.apiBaseUrl}. ` +
            "Check that apps/api is running and that WEB_ALLOWED_ORIGINS includes your Vite origin, " +
            "or set VITE_ENABLE_MOCK=true for frontend-only mode.",
        );
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
      <div className="grid gap-6 xl:grid-cols-[0.42fr_1fr]">
        <SectionCard className="signal-surface rounded-[2.6rem] p-6 sm:p-7">
          <div className="radar-dots" />
          <div className="relative z-10">
            <p className="eyebrow">Plan wizard</p>
            <h1 className="section-title mt-4 text-6xl font-semibold">Build the planning brief.</h1>
            <p className="muted-copy mt-4 text-sm leading-8">
              Capture the constraints first, shape the departure map second, and keep destination bias out of the room.
            </p>

            <div className="mt-8 space-y-3">
              {wizardSteps.map((step, index) => {
                const active = index === stepIndex;

                return (
                  <div
                    className={`rounded-[1.6rem] border px-4 py-4 ${
                      active ? "border-white/15 bg-white/10 text-[color:var(--paper-50)]" : "border-white/8 bg-white/4 text-[color:rgba(248,243,235,0.72)]"
                    }`}
                    key={step}
                  >
                    <div className={`eyebrow ${active ? "text-[rgba(248,243,235,0.7)]" : "text-[rgba(248,243,235,0.48)]"}`}>
                      0{index + 1}
                    </div>
                    <div className="mt-2 text-xl font-semibold">{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          {stepIndex === 0 ? (
            <SectionCard className="rounded-[2.6rem] p-6 sm:p-7">
              <p className="eyebrow">Step 1</p>
              <h2 className="section-title mt-4 text-5xl font-semibold">Plan basics and guardrails.</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <FormField label="Plan name">
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("name", event.target.value)}
                      placeholder="EMEA + Americas leadership sync"
                      value={draft.name}
                    />
                  </div>
                </FormField>

                <FormField label="Event timezone">
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
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
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("event_start", event.target.value)}
                      type="datetime-local"
                      value={draft.event_start}
                    />
                  </div>
                </FormField>

                <FormField label="Event end">
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      onChange={(event) => updateDraft("event_end", event.target.value)}
                      type="datetime-local"
                      value={draft.event_end}
                    />
                  </div>
                </FormField>

                <FormField label="Arrival buffer (hours)">
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
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
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
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
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
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
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
                    <input
                      className="w-full bg-transparent outline-none"
                      maxLength={3}
                      onChange={(event) => updateDraft("currency", event.target.value.toUpperCase())}
                      value={draft.currency}
                    />
                  </div>
                </FormField>

                <FormField label="Cabin class">
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
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
                  <div className="field-shell rounded-[1.5rem] px-4 py-3">
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
                <div className="field-shell mt-5 rounded-[1.8rem] px-4 py-3">
                  <textarea
                    className="min-h-32 w-full resize-y bg-transparent outline-none"
                    onChange={(event) => updateDraft("description", event.target.value)}
                    placeholder="Who is meeting, why this event matters, and any planning context the future search layer should respect."
                    value={draft.description}
                  />
                </div>
              </FormField>
            </SectionCard>
          ) : null}

          {stepIndex === 1 ? (
            <SectionCard className="rounded-[2.6rem] p-6 sm:p-7">
              <p className="eyebrow">Step 2</p>
              <h2 className="section-title mt-4 text-5xl font-semibold">Capture the real departure map.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--ink-600)]">
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
                  <div className="route-chip rounded-[1.8rem] px-4 py-5 text-sm leading-7 text-[color:var(--ink-600)]">
                    No participants staged yet. Saving without participants is allowed, but search orchestration later will require at least one.
                  </div>
                ) : (
                  participants.map((participant, index) => (
                    <div
                      className="route-chip flex flex-wrap items-center justify-between gap-3 rounded-[1.8rem] px-4 py-4"
                      key={`${participant.guest_name}-${index}`}
                    >
                      <div>
                        <div className="text-lg font-semibold text-[color:var(--ink-900)]">{participant.guest_name}</div>
                        <div className="text-sm text-[color:var(--ink-600)]">
                          {participant.departure_city} · airport #{participant.departure_airport_id}
                        </div>
                      </div>
                      <button
                        className="font-[var(--font-mono)] text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--signal-coral)]"
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
            <SectionCard className="rounded-[2.6rem] p-6 sm:p-7">
              <p className="eyebrow">Step 3</p>
              <h2 className="section-title mt-4 text-5xl font-semibold">Optional region filter.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--ink-600)]">
                Region filtering helps the search stay focused when you already know the broad zone worth exploring.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {regions.map((region) => {
                  const checked = draft.region_filter_ids.includes(region.id);

                  return (
                    <button
                      className={`rounded-[1.8rem] border px-5 py-5 text-left transition ${
                        checked
                          ? "signal-surface"
                          : "command-surface"
                      }`}
                      key={region.id}
                      onClick={() => toggleRegion(region.id)}
                      type="button"
                    >
                      <div className={`eyebrow ${checked ? "text-[rgba(248,243,235,0.7)]" : "text-[color:var(--ink-600)]"}`}>Region</div>
                      <div className="section-title mt-3 text-4xl font-semibold">{region.name}</div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          ) : null}

          {stepIndex === 3 ? (
            <SectionCard className="rounded-[2.6rem] p-6 sm:p-7">
              <p className="eyebrow">Step 4</p>
              <h2 className="section-title mt-4 text-5xl font-semibold">Review and create the plan.</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="signal-surface rounded-[2rem] p-5">
                  <div className="eyebrow">Event setup</div>
                  <div className="mt-4 space-y-2 text-sm leading-8 text-[color:var(--paper-50)]">
                    <p><strong>Name:</strong> {draft.name || "Untitled plan"}</p>
                    <p><strong>Timezone:</strong> {draft.event_timezone}</p>
                    <p><strong>Search mode:</strong> {draft.search_mode}</p>
                    <p><strong>Cabin class:</strong> {draft.cabin_class}</p>
                    <p><strong>Budget:</strong> {draft.max_budget_per_person ? `${draft.currency} ${draft.max_budget_per_person}` : "Open"}</p>
                  </div>
                </div>
                <div className="command-surface rounded-[2rem] p-5">
                  <div className="eyebrow">Team scope</div>
                  <div className="mt-4 space-y-2 text-sm leading-8 text-[color:var(--ink-800)]">
                    <p><strong>Participants staged:</strong> {participants.length}</p>
                    <p><strong>Region filters:</strong> {draft.region_filter_ids.length === 0 ? "All regions" : draft.region_filter_ids.length}</p>
                    <p><strong>Organization:</strong> {draft.organization_id}</p>
                    <p><strong>Created by user:</strong> {draft.created_by_user_id}</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {message ? <p className="text-sm font-semibold text-[color:var(--signal-coral)]">{message}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              className="button-secondary"
              disabled={stepIndex === 0}
              onClick={previousStep}
              type="button"
            >
              Previous
            </button>

            {stepIndex < wizardSteps.length - 1 ? (
              <button
                className="button-primary"
                onClick={nextStep}
                type="button"
              >
                Continue
              </button>
            ) : (
              <button
                className="button-primary"
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
    </div>
  );
}
