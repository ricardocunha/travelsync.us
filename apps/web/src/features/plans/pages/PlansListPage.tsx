import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SectionCard } from "@/components/SectionCard";
import { StatusPill } from "@/components/StatusPill";
import type { Plan } from "@/features/plans/types";
import { ApiError, listPlans } from "@/lib/api";
import { config } from "@/lib/config";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function PlansListPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void listPlans(config.organizationId)
      .then((items) => {
        if (!cancelled) {
          setPlans(items);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : `Failed to load plans from ${config.apiBaseUrl}. Check that the Go API is running.`,
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono text-[color:var(--accent)]">Plan board</p>
          <h1 className="heading-display mt-2 text-4xl sm:text-5xl">Your plans</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--text-secondary)]">
            Track plans from setup through destination scoring. Recommendation and summary land in later slices.
          </p>
        </div>
        <Link
          className="btn-primary shrink-0"
          to="/plans/new"
        >
          Create new plan
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="chip px-3.5 py-2 text-xs text-[color:var(--text-tertiary)]">
          <span className="text-[color:var(--text-secondary)]">Org:</span> {config.organizationId}
        </div>
        <div className="chip px-3.5 py-2 text-xs text-[color:var(--text-tertiary)]">
          <span className="text-[color:var(--text-secondary)]">Source:</span> {config.useMock ? "Mock" : "API"}
        </div>
      </div>

      {loading ? (
        <SectionCard>
          <p className="text-sm text-[color:var(--text-secondary)]">Loading plans...</p>
        </SectionCard>
      ) : error ? (
        <SectionCard>
          <p className="text-sm font-medium text-[color:var(--rose)]">{error}</p>
        </SectionCard>
      ) : plans.length === 0 ? (
        <SectionCard className="p-8 text-center">
          <p className="label-mono">No plans yet</p>
          <h2 className="heading-section mt-3 text-3xl">Start with one event window and one team.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--text-secondary)]">
            Once a plan exists, the detail page becomes the working surface for scoring destinations and inspecting route detail.
          </p>
        </SectionCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <Link
              className="card group p-5 transition duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
              key={plan.id}
              to={`/plans/${plan.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label-mono">Plan #{plan.id}</p>
                  <h2 className="heading-section mt-2 text-2xl transition group-hover:text-[color:var(--accent-hover)]">
                    {plan.name}
                  </h2>
                </div>
                <StatusPill status={plan.status} />
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                {plan.description || "No description yet."}
              </p>

              <div className="mt-5 grid gap-3 xl:grid-cols-2">
                <div className="card-dark rounded-lg p-3.5">
                  <div className="label-mono text-[0.62rem]">Event window</div>
                  <div className="mt-2 text-sm font-semibold">
                    {formatDateTime(plan.event_start, plan.event_timezone)}
                  </div>
                  <div className="mt-0.5 text-xs text-[color:var(--text-tertiary)]">
                    {formatDateTime(plan.event_end, plan.event_timezone)}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="chip px-3.5 py-2.5">
                    <div className="label-mono text-[0.6rem]">Constraints</div>
                    <div className="mt-1 text-xs font-semibold">
                      {plan.search_mode} · {plan.cabin_class}
                    </div>
                  </div>
                  <div className="chip px-3.5 py-2.5">
                    <div className="label-mono text-[0.6rem]">Budget</div>
                    <div className="mt-1 text-xs font-semibold">
                      {formatCurrency(plan.max_budget_per_person, plan.currency)} / traveler
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
