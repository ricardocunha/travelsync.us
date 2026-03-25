type MetricCardProps = {
  label: string;
  value: string;
  accent?: string;
};

export function MetricCard({ label, value, accent = "bg-[var(--accent)]" }: MetricCardProps) {
  return (
    <div className="metric-chip p-5">
      <div className={`absolute inset-x-0 top-0 h-[2px] ${accent}`} />
      <div className="label-mono">{label}</div>
      <div className="heading-section mt-3 text-xl">{value}</div>
    </div>
  );
}
