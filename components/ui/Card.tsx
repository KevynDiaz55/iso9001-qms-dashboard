import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, subtitle, actions, children }: CardProps) {
  return (
    <section className="card p-4 md:p-5 space-y-3">
      {(title || subtitle || actions) && (
        <header className="flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}

