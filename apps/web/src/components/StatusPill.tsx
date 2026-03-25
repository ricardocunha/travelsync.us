const toneByStatus: Record<string, string> = {
  draft: "border-[rgba(21,34,49,0.12)] bg-white/70 text-[color:var(--ink-800)]",
  searching: "border-transparent bg-[rgba(240,180,65,0.18)] text-[color:var(--ink-900)]",
  reviewed: "border-transparent bg-[rgba(73,184,199,0.18)] text-[color:var(--ink-900)]",
  booked: "border-transparent bg-[rgba(134,212,176,0.2)] text-[color:var(--ink-900)]",
  completed: "border-transparent bg-[rgba(33,52,71,0.18)] text-[color:var(--ink-900)]",
  cancelled: "border-transparent bg-[rgba(244,118,86,0.18)] text-[color:var(--ink-900)]",
  pending: "border-[rgba(21,34,49,0.12)] bg-white/70 text-[color:var(--ink-800)]",
  confirmed: "border-transparent bg-[rgba(134,212,176,0.2)] text-[color:var(--ink-900)]",
  declined: "border-transparent bg-[rgba(244,118,86,0.18)] text-[color:var(--ink-900)]",
};

type StatusPillProps = {
  status: string;
};

export function StatusPill({ status }: StatusPillProps) {
  const tone = toneByStatus[status] ?? "border-[rgba(21,34,49,0.12)] bg-white/70 text-[color:var(--ink-800)]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${tone}`}
    >
      {status}
    </span>
  );
}
