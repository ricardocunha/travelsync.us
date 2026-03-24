import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SectionCard } from "@/components/SectionCard";
import { StatusPill } from "@/components/StatusPill";
import { config } from "@/lib/config";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ApiError, listPlans } from "@/lib/api";
import type { Plan } from "@/features/plans/types";

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
          setError(err instanceof ApiError ? err.message : "Failed to load plans.");
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
      <SectionCard className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow">Plan board</p>
          <h1 className="section-title mt-4 text-5xl font-semibold">Organize the work before the search engine arrives.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--ink-600)]">
            This first frontend slice focuses on plan setup. You can create plans, shape participant departure data,
            and leave the ranking and recommendation slices for the next backend milestone.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border-strong)] bg-white/70 p-5">
          <div className="eyebrow">Live workspace status</div>
          <div className="mt-4 space-y-4 text-sm text-[color:var(--ink-700)]">
            <p>Organization scope: {config.organizationId}</p>
            <p>Data source: {config.useMock ? "Mock mode for local flow and browser tests" : "Go API"}</p>
            <p>Next user-facing milestone: ranked destination results and AI recommendation banner.</p>
          </div>
          <Link
            className="mt-6 inline-flex rounded-full bg-[color:var(--ink-950)] px-5 py-3 text-sm font-extrabold text-[color:var(--sand-50)]"
            to="/plans/new"
          >
            Create a new plan
          </Link>
        </div>
      </SectionCard>

      {loading ? (
        <SectionCard>
          <p className="text-sm font-semibold text-[color:var(--ink-600)]">Loading plans...</p>
        </SectionCard>
      ) : error ? (
        <SectionCard>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </SectionCard>
      ) : plans.length === 0 ? (
        <SectionCard>
          <p className="eyebrow">No plans yet</p>
          <h2 className="section-title mt-3 text-3xl font-semibold">Start with one event window and one team.</h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
            Once a plan exists, this page becomes the operational home for upcoming search and recommendation slices.
          </p>
        </SectionCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <Link
              className="paper-panel rounded-[2rem] p-6 transition-transform duration-200 hover:-translate-y-1"
              key={plan.id}
              to={`/plans/${plan.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Plan #{plan.id}</p>
                  <h2 className="section-title mt-3 text-3xl font-semibold">{plan.name}</h2>
                </div>
                <StatusPill status={plan.status} />
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">{plan.description || "No description yet."}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="route-chip rounded-2xl p-4">
                  <div className="eyebrow">Event window</div>
                  <div className="mt-2 text-sm font-semibold">{formatDateTime(plan.event_start, plan.event_timezone)}</div>
                  <div className="mt-1 text-xs text-[color:var(--ink-600)]">{formatDateTime(plan.event_end, plan.event_timezone)}</div>
                </div>
                <div className="route-chip rounded-2xl p-4">
                  <div className="eyebrow">Constraints</div>
                  <div className="mt-2 text-sm font-semibold">
                    {plan.search_mode} · {plan.cabin_class}
                  </div>
                  <div className="mt-1 text-xs text-[color:var(--ink-600)]">
                    {formatCurrency(plan.max_budget_per_person, plan.currency)} per traveler
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
