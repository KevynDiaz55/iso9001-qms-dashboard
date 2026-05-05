import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-xs font-semibold text-slate-500">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>;
}

export function TH({ children }: { children: ReactNode }) {
  return <th className="px-4 py-2 text-left">{children}</th>;
}

export function TD({ children }: { children: ReactNode }) {
  return <td className="px-4 py-2 align-top text-slate-700">{children}</td>;
}

