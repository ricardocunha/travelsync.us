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
      <SectionCard className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="signal-surface rounded-[2.5rem] p-6 sm:p-7">
          <div className="radar-dots" />
          <div className="relative z-10">
            <p className="eyebrow">Plan board</p>
            <h1 className="section-title mt-4 max-w-3xl text-6xl font-semibold">
              Track the plans that are ready for comparison.
            </h1>
            <p className="muted-copy mt-5 max-w-2xl text-base leading-8">
              The current flow now carries plans from setup into destination scoring. Recommendation,
              selection, and summary still land in later slices, but the ranking engine is no longer theoretical.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <SectionCard className="rounded-[2.2rem] p-5">
            <div className="eyebrow">Live workspace status</div>
            <div className="mt-5 space-y-4 text-sm leading-8 text-[color:var(--ink-700)]">
              <p>Organization scope: {config.organizationId}</p>
              <p>Data source: {config.useMock ? "Mock mode for local flow and browser tests" : "Go API"}</p>
              <p>Current user-facing milestone: ranked destination results on each plan detail page.</p>
            </div>
          </SectionCard>

          <Link
            className="button-primary w-fit"
            to="/plans/new"
          >
            Create a new plan
          </Link>
        </div>
      </SectionCard>

      {loading ? (
        <SectionCard className="rounded-[2.4rem]">
          <p className="text-sm font-semibold text-[color:var(--ink-600)]">Loading plans...</p>
        </SectionCard>
      ) : error ? (
        <SectionCard className="rounded-[2.4rem]">
          <p className="text-sm font-semibold text-[color:var(--signal-coral)]">{error}</p>
        </SectionCard>
      ) : plans.length === 0 ? (
        <SectionCard className="rounded-[2.4rem]">
          <p className="eyebrow">No plans yet</p>
          <h2 className="section-title mt-4 text-5xl font-semibold">Start with one event window and one team.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[color:var(--ink-600)]">
            Once a plan exists, the detail page becomes the working surface for scoring destinations and inspecting route detail.
          </p>
        </SectionCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <Link
              className="paper-panel rounded-[2.4rem] p-6 transition duration-200 hover:-translate-y-1"
              key={plan.id}
              to={`/plans/${plan.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Plan #{plan.id}</p>
                  <h2 className="section-title mt-4 text-4xl font-semibold">{plan.name}</h2>
                </div>
                <StatusPill status={plan.status} />
              </div>

              <p className="mt-5 text-sm leading-8 text-[color:var(--ink-600)]">
                {plan.description || "No description yet."}
              </p>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="signal-surface rounded-[1.8rem] p-4">
                  <div className="eyebrow">Event window</div>
                  <div className="mt-3 text-lg font-semibold text-[color:var(--paper-50)]">
                    {formatDateTime(plan.event_start, plan.event_timezone)}
                  </div>
                  <div className="mt-1 text-sm text-[color:rgba(248,243,235,0.72)]">
                    {formatDateTime(plan.event_end, plan.event_timezone)}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="route-chip rounded-[1.4rem] px-4 py-4">
                    <div className="eyebrow">Constraints</div>
                    <div className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                      {plan.search_mode} · {plan.cabin_class}
                    </div>
                  </div>
                  <div className="route-chip rounded-[1.4rem] px-4 py-4">
                    <div className="eyebrow">Budget</div>
                    <div className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                      {formatCurrency(plan.max_budget_per_person, plan.currency)} per traveler
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
