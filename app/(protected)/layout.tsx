import type { ReactNode } from 'react';
import { AppProviders } from '../../components/providers';
import { LayoutShell } from '../../components/layout/LayoutShell';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <LayoutShell>{children}</LayoutShell>
    </AppProviders>
  );
}

