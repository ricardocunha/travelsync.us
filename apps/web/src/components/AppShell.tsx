import { NavLink, Route, Routes } from "react-router-dom";

import { LandingPage } from "@/features/plans/pages/LandingPage";
import { NewPlanPage } from "@/features/plans/pages/NewPlanPage";
import { PlanDetailPage } from "@/features/plans/pages/PlanDetailPage";
import { PlansListPage } from "@/features/plans/pages/PlansListPage";

function NotFoundPage() {
  return (
    <div className="card-raised p-10 text-center">
      <p className="label-mono text-[color:var(--rose)]">404</p>
      <h1 className="heading-display mt-3 text-4xl">Page not found</h1>
      <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
  );
}

export function AppShell() {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[rgba(99,102,241,0.05)] blur-[150px]" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-[rgba(34,211,238,0.03)] blur-[120px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="card-raised sticky top-3 z-30 flex items-center justify-between gap-4 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <NavLink
              className="flex items-center gap-2.5"
              to="/"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[0.7rem] font-bold text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                TS
              </div>
              <span className="text-sm font-semibold tracking-tight">TravelSync</span>
            </NavLink>

            <nav className="hidden items-center gap-5 sm:flex">
              <NavLink to="/">
                {({ isActive }) => (
                  <span
                    className="nav-item"
                    data-active={isActive}
                  >
                    Overview
                  </span>
                )}
              </NavLink>
              <NavLink to="/plans">
                {({ isActive }) => (
                  <span
                    className="nav-item"
                    data-active={isActive}
                  >
                    Plans
                  </span>
                )}
              </NavLink>
            </nav>
          </div>

          <NavLink
            className="btn-primary text-sm"
            to="/plans/new"
          >
            New Plan
          </NavLink>
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
