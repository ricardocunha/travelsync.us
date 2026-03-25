import { NavLink, Route, Routes } from "react-router-dom";

import { LandingPage } from "@/features/plans/pages/LandingPage";
import { NewPlanPage } from "@/features/plans/pages/NewPlanPage";
import { PlanDetailPage } from "@/features/plans/pages/PlanDetailPage";
import { PlansListPage } from "@/features/plans/pages/PlansListPage";

function NotFoundPage() {
  return (
    <div className="paper-panel rounded-[2.4rem] p-8 text-center">
      <p className="eyebrow">Lost Route</p>
      <h1 className="section-title mt-4 text-5xl font-semibold">This itinerary does not exist yet.</h1>
      <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
        The page you tried to open is outside the current frontend surface.
      </p>
    </div>
  );
}

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-[8rem] h-72 w-72 rounded-full bg-[rgba(73,184,199,0.14)] blur-3xl" />
        <div className="absolute right-[-4rem] top-[1rem] h-80 w-80 rounded-full bg-[rgba(240,180,65,0.16)] blur-3xl" />
        <div className="absolute bottom-[-5rem] left-[30%] h-72 w-72 rounded-full bg-[rgba(244,118,86,0.12)] blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[92rem] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="paper-panel sticky top-4 z-20 rounded-[2.4rem] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="eyebrow">Travel Sync / Search First</div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="section-title text-3xl font-semibold sm:text-4xl">
                  Meeting points, not guesswork.
                </div>
                <span className="inline-flex rounded-full border border-[rgba(21,34,49,0.1)] bg-white/70 px-3 py-1 font-[var(--font-mono)] text-[0.68rem] uppercase tracking-[0.2em] text-[color:var(--ink-700)]">
                  group flight optimizer
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-600)]">
                Curated destinations, synchronized arrivals, transparent tradeoffs.
              </p>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold text-[color:var(--ink-800)]">
                <NavLink
                  className="nav-link"
                  to="/"
                >
                  {({ isActive }) => <span data-active={isActive}>Overview</span>}
                </NavLink>
                <NavLink
                  className="nav-link"
                  to="/plans"
                >
                  {({ isActive }) => <span data-active={isActive}>Plans</span>}
                </NavLink>
                <NavLink
                  className="button-primary"
                  to="/plans/new"
                >
                  Create plan
                </NavLink>
              </nav>
              <div className="eyebrow text-[0.64rem] text-[color:var(--ink-600)]">
                Editorial command deck for distributed team travel
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex-1 py-6">
          <Routes>
            <Route
              path="/"
              element={<LandingPage />}
            />
            <Route
              path="/plans"
              element={<PlansListPage />}
            />
            <Route
              path="/plans/new"
              element={<NewPlanPage />}
            />
            <Route
              path="/plans/:planId"
              element={<PlanDetailPage />}
            />
            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
