type MetricCardProps = {
  label: string;
  value: string;
  accent?: string;
};

export function MetricCard({ label, value, accent = "from-amber-200 to-transparent" }: MetricCardProps) {
  return (
    <div className={`paper-panel relative overflow-hidden rounded-[1.75rem] p-5`}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent}`} />
      <div className="relative">
        <div className="eyebrow">{label}</div>
        <div className="section-title mt-4 text-3xl font-semibold">{value}</div>
      </div>
    </div>
  );
}
