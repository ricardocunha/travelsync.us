import { useEffect, useState } from "react";

import { FormField } from "@/components/FormField";
import { ApiError, listAirports } from "@/lib/api";
import type { Airport, Country } from "@/features/reference/types";
import type { ParticipantInput } from "@/features/plans/types";

type ParticipantDraftFormProps = {
  countries: Country[];
  onAdd: (participant: ParticipantInput) => void;
};

const emptyDraft: ParticipantInput = {
  guest_name: "",
  guest_email: "",
  departure_city: "",
  departure_airport_id: 0,
  departure_country_id: null,
  status: "pending",
};

export function ParticipantDraftForm({ countries, onAdd }: ParticipantDraftFormProps) {
  const [draft, setDraft] = useState<ParticipantInput>(emptyDraft);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loadingAirports, setLoadingAirports] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lookupVersion, setLookupVersion] = useState(0);

  useEffect(() => {
    if (draft.departure_city.trim().length < 2) {
      setAirports([]);
      setLoadingAirports(false);
      setMessage(null);
      return;
    }

    let cancelled = false;
    const lookupCity = draft.departure_city.trim();

    async function fetchAirportsWithRetry(retriesLeft: number): Promise<void> {
      try {
        const items = await listAirports({
          countryId: draft.departure_country_id ?? undefined,
          city: draft.departure_city,
        });

        if (cancelled) {
          return;
        }

        setAirports(items);
        setDraft((current) => {
          if (current.departure_airport_id || items.length !== 1) {
            return current;
          }

          return {
            ...current,
            departure_airport_id: items[0]?.id ?? 0,
          };
        });

        if (items.length === 0) {
          setMessage(
            `No airports found for "${lookupCity}". ` +
              "Try a nearby city, a destination alias like New York, or set the country first.",
          );
          return;
        }

        setMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (retriesLeft > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 350);
          });
          if (!cancelled) {
            await fetchAirportsWithRetry(retriesLeft - 1);
          }
          return;
        }

        setAirports([]);
        if (error instanceof ApiError) {
          setMessage(error.message);
        } else {
          setMessage("Airport search failed. Check that the Go API is running, then try again.");
        }
      }
    }

    setLoadingAirports(true);
    void fetchAirportsWithRetry(1).finally(() => {
      if (!cancelled) {
        setLoadingAirports(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [draft.departure_city, draft.departure_country_id, lookupVersion]);

  function updateDraft<Key extends keyof ParticipantInput>(key: Key, value: ParticipantInput[Key]) {
    setMessage(null);
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "departure_city" ? { departure_airport_id: 0 } : {}),
      ...(key === "departure_country_id" ? { departure_airport_id: 0 } : {}),
    }));
  }

  function handleAdd() {
    if (!draft.guest_name.trim()) {
      setMessage("Participant name is required.");
      return;
    }

    if (!draft.departure_city.trim() || !draft.departure_airport_id) {
      setMessage("Choose a departure city and airport before adding the participant.");
      return;
    }

    onAdd({
      ...draft,
      guest_name: draft.guest_name.trim(),
      guest_email: draft.guest_email.trim(),
      departure_city: draft.departure_city.trim(),
    });
    setDraft(emptyDraft);
    setAirports([]);
    setMessage(null);
  }

  function retryAirportLookup() {
    setMessage(null);
    setLookupVersion((current) => current + 1);
  }

  return (
    <div className="command-surface space-y-4 rounded-[2rem] p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Guest name">
          <div className="field-shell rounded-2xl px-4 py-3">
            <input
              className="w-full bg-transparent outline-none"
              onChange={(event) => updateDraft("guest_name", event.target.value)}
              placeholder="Ana Silva"
              value={draft.guest_name}
            />
          </div>
        </FormField>

        <FormField
          hint="Optional"
          label="Guest email"
        >
          <div className="field-shell rounded-2xl px-4 py-3">
            <input
              className="w-full bg-transparent outline-none"
              onChange={(event) => updateDraft("guest_email", event.target.value)}
              placeholder="ana@example.com"
              type="email"
              value={draft.guest_email}
            />
          </div>
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
        <FormField
          hint="Optional"
          label="Departure country"
        >
          <div className="field-shell rounded-2xl px-4 py-3">
            <select
              className="w-full bg-transparent outline-none"
              onChange={(event) =>
                updateDraft(
                  "departure_country_id",
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              value={draft.departure_country_id ?? ""}
            >
              <option value="">All countries</option>
              {countries.map((country) => (
                <option
                  key={country.id}
                  value={country.id}
                >
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </FormField>

        <FormField label="Departure city">
          <div className="field-shell rounded-2xl px-4 py-3">
            <input
              className="w-full bg-transparent outline-none"
              onChange={(event) => updateDraft("departure_city", event.target.value)}
              placeholder="Brasilia"
              value={draft.departure_city}
            />
          </div>
        </FormField>

        <FormField
          hint={
            loadingAirports
              ? "Searching..."
              : draft.departure_city.trim().length < 2
                ? "Type at least 2 characters"
                : airports.length === 0
                  ? "No matches yet"
                  : `${airports.length} option${airports.length === 1 ? "" : "s"} found`
          }
          label="Departure airport"
        >
          <div className="field-shell rounded-2xl px-4 py-3">
            <select
              className="w-full bg-transparent outline-none"
              disabled={loadingAirports || draft.departure_city.trim().length < 2}
              onChange={(event) => updateDraft("departure_airport_id", Number(event.target.value))}
              value={draft.departure_airport_id || ""}
            >
              <option value="">Select airport</option>
              {airports.map((airport) => (
                <option
                  key={airport.id}
                  value={airport.id}
                >
                  {airport.iata_code} · {airport.city} · {airport.name}
                </option>
              ))}
            </select>
          </div>
        </FormField>
      </div>

      {message ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--signal-coral)]">{message}</p>
          {draft.departure_city.trim().length >= 2 ? (
            <button
              className="button-secondary"
              onClick={retryAirportLookup}
              type="button"
            >
              Retry airport search
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end border-t border-[rgba(21,34,49,0.08)] pt-3">
        <button
          className="button-secondary"
          onClick={handleAdd}
          type="button"
        >
          Add participant
        </button>
      </div>
    </div>
  );
}
