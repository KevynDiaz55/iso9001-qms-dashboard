interface LevelChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function LevelChip({ label, active, onClick }: LevelChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
        active
          ? 'bg-primary-50 text-primary-700 border-primary-100'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

