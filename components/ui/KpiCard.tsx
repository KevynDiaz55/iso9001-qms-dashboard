interface KpiCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function KpiCard({ label, value, helper }: KpiCardProps) {
  return (
    <div className="card p-4 space-y-2">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {helper && <div className="text-xs text-slate-500">{helper}</div>}
    </div>
  );
}

