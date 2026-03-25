import { Link } from "react-router-dom";

import { SectionCard } from "@/components/SectionCard";
import { MetricCard } from "@/features/plans/components/MetricCard";

const principles = [
  "Search all curated destinations before anyone gets emotionally attached to one city.",
  "Measure cost, flight burden, and arrival spread as first-class signals.",
  "Keep the organizer in control with transparent tradeoffs instead of a black box verdict.",
];

const steps = [
  { num: "01", title: "Shape the event window", desc: "Capture dates, buffers, budget, and cabin class before any destination bias creeps in." },
  { num: "02", title: "Map team origins", desc: "Every participant can leave from a different airport, even inside the same city." },
  { num: "03", title: "Run ranked outcomes", desc: "Search and scoring attach directly to each plan. Recommendation and summary come next." },
];

export function LandingPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <SectionCard className="card-accent p-8 sm:p-10">
          <div className="grid gap-10 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
            <div>
              <p className="label-mono text-[color:var(--accent-hover)]">Distributed teams</p>
              <h1 className="heading-display mt-4 max-w-2xl text-5xl sm:text-6xl">
                Pick the best meeting point after the data speaks.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[color:var(--text-secondary)]">
                TravelSync compares curated destinations against your team&apos;s departure cities,
                then turns cost, flight time, and arrival sync into an operations-grade planning brief.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="btn-primary"
                  to="/plans/new"
                >
                  Start a plan
                </Link>
                <Link
                  className="btn-secondary"
                  to="/plans"
                >
                  Review plans
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] p-5">
              <p className="label-mono">Design principles</p>
              <div className="mt-4 grid gap-2.5">
                {principles.map((principle, index) => (
                  <div
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                    key={principle}
                  >
                    <span className="mr-2 font-[var(--font-mono)] text-xs text-[color:var(--accent)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {principle}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4">
          <MetricCard
            accent="bg-[var(--cyan)]"
            label="Planning lens"
            value="Cost + time + togetherness"
          />
          <MetricCard
            accent="bg-[var(--rose)]"
            label="Frontend slice"
            value="Plan setup, ranking & route detail"
          />
          <MetricCard
            accent="bg-[var(--amber)]"
            label="Next milestone"
            value="Recommendation & final summary"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SectionCard className="p-6 sm:p-8">
          <p className="label-mono">How it works</p>
          <h2 className="heading-section mt-3 text-4xl">Destination bias dies early.</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[color:var(--text-secondary)]">
            Instead of arguing about a city first, the workflow starts with the team map, the event
            window, and the travel constraints that actually shape the outcome.
          </p>

          <div className="mt-6 grid gap-2.5">
            {["Multi-origin teams", "Curated destination catalog", "Rank by cost, burden & togetherness"].map((point) => (
              <div
                className="chip px-4 py-3 text-sm font-medium text-[color:var(--text-secondary)]"
                key={point}
              >
                {point}
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((item) => (
            <SectionCard
              className="p-5"
              key={item.num}
            >
              <p className="label-mono text-[color:var(--accent)]">{item.num}</p>
              <h3 className="heading-section mt-3 text-xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{item.desc}</p>
            </SectionCard>
          ))}
        </div>
      </section>
    </div>
  );
}
