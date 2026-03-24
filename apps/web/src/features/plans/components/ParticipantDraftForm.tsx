import { useEffect, useState } from "react";

import { FormField } from "@/components/FormField";
import { listAirports } from "@/lib/api";
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

  useEffect(() => {
    if (draft.departure_city.trim().length < 2) {
      setAirports([]);
      return;
    }

    let cancelled = false;
    setLoadingAirports(true);
    void listAirports({
      countryId: draft.departure_country_id ?? undefined,
      city: draft.departure_city,
    })
      .then((items) => {
        if (!cancelled) {
          setAirports(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAirports([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAirports(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draft.departure_city, draft.departure_country_id]);

  function updateDraft<Key extends keyof ParticipantInput>(key: Key, value: ParticipantInput[Key]) {
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

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--border-strong)] bg-white/65 p-4">
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
          hint={loadingAirports ? "Searching..." : "Type a city to load routes"}
          label="Departure airport"
        >
          <div className="field-shell rounded-2xl px-4 py-3">
            <select
              className="w-full bg-transparent outline-none"
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

      {message ? <p className="text-sm font-semibold text-rose-700">{message}</p> : null}

      <div className="flex justify-end">
        <button
          className="route-chip rounded-full px-5 py-3 text-sm font-extrabold"
          onClick={handleAdd}
          type="button"
        >
          Add participant
        </button>
      </div>
    </div>
  );
}
