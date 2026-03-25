const toneByStatus: Record<string, string> = {
  draft: "border-[var(--border-default)] bg-[var(--bg-overlay)] text-[color:var(--text-secondary)]",
  searching: "border-transparent bg-[var(--amber-muted)] text-[color:var(--amber)]",
  reviewed: "border-transparent bg-[var(--accent-muted)] text-[color:var(--accent-hover)]",
  booked: "border-transparent bg-[var(--emerald-muted)] text-[color:var(--emerald)]",
  completed: "border-transparent bg-[var(--emerald-muted)] text-[color:var(--emerald)]",
  cancelled: "border-transparent bg-[var(--rose-muted)] text-[color:var(--rose)]",
  pending: "border-[var(--border-default)] bg-[var(--bg-overlay)] text-[color:var(--text-secondary)]",
  confirmed: "border-transparent bg-[var(--emerald-muted)] text-[color:var(--emerald)]",
  declined: "border-transparent bg-[var(--rose-muted)] text-[color:var(--rose)]",
};

type StatusPillProps = {
  status: string;
};

export function StatusPill({ status }: StatusPillProps) {
  const tone = toneByStatus[status] ?? "border-[var(--border-default)] bg-[var(--bg-overlay)] text-[color:var(--text-secondary)]";

  return (
    <span className={`pill border ${tone}`}>
      {status}
    </span>
  );
}
