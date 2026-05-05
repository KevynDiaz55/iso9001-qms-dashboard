interface StatusBadgeProps {
  status: string;
}

function getColors(status: string) {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'submitted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'pending':
    case 'draft':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'under_review':
      return 'bg-sky-50 text-sky-700 border-sky-100';
    case 'obsolete':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'not_started':
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}

const DISPLAY_LABELS: Record<string, string> = {
  pending: 'Pending',
  completed: 'Completed',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = DISPLAY_LABELS[status] ?? status.replace(/_/g, ' ');
  const colors = getColors(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors}`}
    >
      {label}
    </span>
  );
}

