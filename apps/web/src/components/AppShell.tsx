import { NavLink, Route, Routes } from "react-router-dom";

import { LandingPage } from "@/features/plans/pages/LandingPage";
import { NewPlanPage } from "@/features/plans/pages/NewPlanPage";
import { PlanDetailPage } from "@/features/plans/pages/PlanDetailPage";
import { PlansListPage } from "@/features/plans/pages/PlansListPage";

function NotFoundPage() {
  return (
    <div className="paper-panel rounded-[2rem] p-8 text-center">
      <p className="eyebrow">Lost Route</p>
      <h1 className="section-title mt-3 text-4xl font-semibold">This itinerary does not exist yet.</h1>
      <p className="mt-4 text-sm text-[color:var(--ink-600)]">
        The page you tried to open is outside the first frontend slice.
      </p>
    </div>
  );
}

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="paper-panel sticky top-4 z-20 mb-6 rounded-full px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="eyebrow">Travel Sync</div>
              <div className="section-title text-2xl font-semibold">Meeting points, not guesswork.</div>
            </div>
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
                className="route-chip rounded-full px-4 py-2 font-bold"
                to="/plans/new"
              >
                Create plan
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="flex-1">
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
