import { Link } from "react-router-dom";

import { MetricCard } from "@/features/plans/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";

const principles = [
  "Search all curated destinations before anyone gets emotionally attached to one city.",
  "Measure cost, flight burden, and arrival spread as first-class signals.",
  "Keep the organizer in control with transparent tradeoffs instead of a black box verdict.",
];

export function LandingPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow">Distributed teams</p>
              <h1 className="section-title mt-4 max-w-2xl text-5xl font-semibold leading-tight sm:text-6xl">
                Pick the best meeting point after the data speaks.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--ink-600)] sm:text-lg">
                Travel Sync compares curated destinations against your team&apos;s departure cities,
                then turns cost, flight time, and arrival sync into an operations-grade planning brief.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-[color:var(--ink-950)] px-6 py-3 text-sm font-extrabold text-[color:var(--sand-50)]"
                  to="/plans/new"
                >
                  Start a plan
                </Link>
                <Link
                  className="route-chip rounded-full px-6 py-3 text-sm font-extrabold"
                  to="/plans"
                >
                  Review plans
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[color:var(--border-strong)] bg-[linear-gradient(135deg,rgba(255,250,242,0.96),rgba(239,200,191,0.32))] p-5">
              <div className="eyebrow">Current product shape</div>
              <div className="mt-5 space-y-3">
                {principles.map((principle) => (
                  <div
                    className="route-chip rounded-2xl px-4 py-4 text-sm leading-6"
                    key={principle}
                  >
                    {principle}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6">
          <MetricCard
            accent="from-teal-200 to-transparent"
            label="Planning lens"
            value="Cost + time + togetherness"
          />
          <MetricCard
            accent="from-rose-200 to-transparent"
            label="Frontend slice"
            value="Plan setup and team readiness"
          />
          <MetricCard
            accent="from-amber-200 to-transparent"
            label="Next backend milestone"
            value="Search orchestration and rankings"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard>
          <p className="eyebrow">Step 1</p>
          <h2 className="section-title mt-3 text-3xl font-semibold">Shape the event window.</h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
            Capture dates, buffers, budget, cabin class, and search mode before any destination bias can creep in.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="eyebrow">Step 2</p>
          <h2 className="section-title mt-3 text-3xl font-semibold">Map the team&apos;s true origins.</h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
            Every participant can leave from a different airport, even inside the same city. The first slice already supports that shape.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="eyebrow">Step 3</p>
          <h2 className="section-title mt-3 text-3xl font-semibold">Prepare for ranked outcomes.</h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
            The next slices will attach search, scoring, recommendation, and summary workflows to the plans you create here.
          </p>
        </SectionCard>
      </section>
    </div>
  );
}
