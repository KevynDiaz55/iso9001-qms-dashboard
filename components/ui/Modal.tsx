import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}

