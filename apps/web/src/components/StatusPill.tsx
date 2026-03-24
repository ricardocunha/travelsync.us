const toneByStatus: Record<string, string> = {
  draft: "bg-stone-200 text-stone-800",
  searching: "bg-amber-200 text-amber-900",
  reviewed: "bg-teal-200 text-teal-900",
  booked: "bg-emerald-200 text-emerald-900",
  completed: "bg-slate-300 text-slate-900",
  cancelled: "bg-rose-200 text-rose-900",
  pending: "bg-stone-200 text-stone-800",
  confirmed: "bg-emerald-200 text-emerald-900",
  declined: "bg-rose-200 text-rose-900",
};

type StatusPillProps = {
  status: string;
};

export function StatusPill({ status }: StatusPillProps) {
  const tone = toneByStatus[status] ?? "bg-stone-200 text-stone-800";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${tone}`}>
      {status}
    </span>
  );
}
