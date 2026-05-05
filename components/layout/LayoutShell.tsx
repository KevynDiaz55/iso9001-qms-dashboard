import { Suspense, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Suspense fallback={null}>
          <Topbar />
        </Suspense>
        <main className="flex-1 p-4 md:p-6 space-y-4">{children}</main>
      </div>
    </div>
  );
}

