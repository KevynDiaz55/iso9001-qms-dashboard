'use client';

export const dynamic = 'force-dynamic';

import type { FC } from 'react';
import { useSession } from 'next-auth/react';
import { useGlobalReport } from '../../../lib/hooks';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Card } from '../../../components/ui/Card';

const AdminDashboardPage: FC = () => {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin';

  const { data, isLoading, error } = useGlobalReport({ enabled: isAdmin });

  if (status === 'loading') {
    return <p className="text-sm text-slate-600">Loading…</p>;
  }
  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-red-600 mt-2">Access denied. Admin role required.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading global report…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : 'Failed to load global report.'}
      </p>
    );
  }

  const total = data?.totalCompanies ?? 0;
  const byStatus = data?.byStatus ?? {};
  const certified = byStatus.certified ?? 0;
  const inProgress = byStatus['in progress'] ?? 0;
  const notContacted = byStatus['not contacted'] ?? 0;
  const byPlaybookStage = data?.byPlaybookStage ?? [];
  const avgDays = data?.averageTimeForCertificationDays;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Global Admin Dashboard</h1>
        <p className="text-sm text-slate-600">
          High-level metrics across all companies in the TMAC ISO 9001 Implementation Tracker.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-2">Companies overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total companies" value={String(total)} />
          <KpiCard label="Certified" value={String(certified)} />
          <KpiCard label="In progress" value={String(inProgress)} />
          <KpiCard label="Not contacted" value={String(notContacted)} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-2">Average time for certification</h2>
        <div className="grid gap-4 md:grid-cols-1">
          <KpiCard
            label="Average days (certified companies with start & target dates)"
            value={avgDays != null ? `${avgDays} days` : '—'}
            helper={avgDays == null ? 'No certified companies with both implementation start and target certification dates.' : undefined}
          />
        </div>
      </section>

      <Card
        title="Companies by playbook stage"
        subtitle="Number of companies in each of the 6 playbook stages (or not set)."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {byPlaybookStage
            .sort((a, b) => a.stageOrder - b.stageOrder)
            .map((item) => (
              <div
                key={item.stageName}
                className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{item.stageName}</span>
                <span className="ml-2 text-slate-600">{item.count}</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
