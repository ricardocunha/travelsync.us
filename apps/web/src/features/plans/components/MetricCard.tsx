type MetricCardProps = {
  label: string;
  value: string;
  accent?: string;
};

export function MetricCard({ label, value, accent = "from-amber-200 to-transparent" }: MetricCardProps) {
  return (
    <div className="paper-panel metric-band rounded-[1.9rem] p-5">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${accent}`} />
      <div className="radar-dots" />
      <div className="relative">
        <div className="eyebrow">{label}</div>
        <div className="section-title mt-5 text-[2.3rem] font-semibold leading-[0.92]">{value}</div>
      </div>
    </div>
  );
}
