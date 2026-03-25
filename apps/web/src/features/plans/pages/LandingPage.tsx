import { Link } from "react-router-dom";

import { SectionCard } from "@/components/SectionCard";
import { MetricCard } from "@/features/plans/components/MetricCard";

const principles = [
  "Search all curated destinations before anyone gets emotionally attached to one city.",
  "Measure cost, flight burden, and arrival spread as first-class signals.",
  "Keep the organizer in control with transparent tradeoffs instead of a black box verdict.",
];

const systemPoints = [
  "multi-origin teams",
  "curated destination catalog",
  "rank by cost, burden, and togetherness",
];

export function LandingPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard className="signal-surface rounded-[2.8rem] p-6 sm:p-8">
          <div className="radar-dots" />
          <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-end">
            <div className="relative z-10">
              <p className="eyebrow">Distributed teams</p>
              <h1 className="section-title mt-4 max-w-3xl text-6xl font-semibold leading-[0.9] sm:text-7xl">
                Pick the best meeting point after the data speaks.
              </h1>
              <p className="muted-copy mt-6 max-w-2xl text-base leading-8 sm:text-lg">
                Travel Sync compares curated destinations against your team&apos;s departure cities,
                then turns cost, flight time, and arrival sync into an operations-grade planning brief.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="button-primary"
                  to="/plans/new"
                >
                  Start a plan
                </Link>
                <Link
                  className="button-secondary"
                  to="/plans"
                >
                  Review plans
                </Link>
              </div>
            </div>

            <div className="relative z-10 rounded-[2.2rem] border border-white/12 bg-white/6 p-5 backdrop-blur-md">
              <div className="eyebrow text-[color:rgba(248,243,235,0.78)]">Current product shape</div>
              <div className="mt-5 grid gap-3">
                {principles.map((principle, index) => (
                  <div
                    className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-7 text-[color:rgba(248,243,235,0.9)]"
                    key={principle}
                  >
                    <span className="mr-3 font-[var(--font-mono)] text-[0.72rem] tracking-[0.16em] text-[color:rgba(248,243,235,0.62)]">
                      0{index + 1}
                    </span>
                    {principle}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6">
          <MetricCard
            accent="from-[rgba(73,184,199,0.3)] to-transparent"
            label="Planning lens"
            value="Cost + time + togetherness"
          />
          <MetricCard
            accent="from-[rgba(244,118,86,0.25)] to-transparent"
            label="Frontend slice"
            value="Plan setup, ranking, and route detail"
          />
          <MetricCard
            accent="from-[rgba(240,180,65,0.3)] to-transparent"
            label="Next backend milestone"
            value="Recommendation, selection, and final summary"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <SectionCard className="rounded-[2.4rem] p-6 sm:p-7">
          <p className="eyebrow">System logic</p>
          <h2 className="section-title mt-4 text-5xl font-semibold">Destination bias dies early.</h2>
          <p className="mt-4 max-w-xl text-sm leading-8 text-[color:var(--ink-600)]">
            Instead of arguing about a city first, the workflow starts with the team map, the event
            window, and the travel constraints that actually shape the outcome.
          </p>

          <div className="mt-8 grid gap-3">
            {systemPoints.map((point) => (
              <div
                className="route-chip rounded-[1.5rem] px-4 py-4 text-sm font-medium text-[color:var(--ink-800)]"
                key={point}
              >
                {point}
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard className="rounded-[2.4rem] p-6">
            <p className="eyebrow">Step 1</p>
            <h2 className="section-title mt-4 text-4xl font-semibold">Shape the event window.</h2>
            <p className="mt-4 text-sm leading-8 text-[color:var(--ink-600)]">
              Capture dates, buffers, budget, cabin class, and search mode before any destination bias can creep in.
            </p>
          </SectionCard>
          <SectionCard className="rounded-[2.4rem] p-6">
            <p className="eyebrow">Step 2</p>
            <h2 className="section-title mt-4 text-4xl font-semibold">Map the team&apos;s true origins.</h2>
            <p className="mt-4 text-sm leading-8 text-[color:var(--ink-600)]">
              Every participant can leave from a different airport, even inside the same city. The interface is already built for that.
            </p>
          </SectionCard>
          <SectionCard className="rounded-[2.4rem] p-6">
            <p className="eyebrow">Step 3</p>
            <h2 className="section-title mt-4 text-4xl font-semibold">Run ranked outcomes.</h2>
            <p className="mt-4 text-sm leading-8 text-[color:var(--ink-600)]">
              Search and scoring now attach directly to each plan. The next slices add recommendation, selection, and final summary workflows.
            </p>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
