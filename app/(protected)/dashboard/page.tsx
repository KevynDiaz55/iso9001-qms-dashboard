'use client';

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import { useCompanyDashboard } from '../../../lib/hooks';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Card } from '../../../components/ui/Card';

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const { data, isLoading, error } = useCompanyDashboard(companyId);

  if (!companyId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Select a company from the top bar to view its ISO 9001 implementation status.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading dashboard…</p>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard.';
    return (
      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Failed to load dashboard</p>
        <p className="text-sm text-red-700 font-mono break-words">{message}</p>
        <p className="text-xs text-red-600">Check the API and try again or refresh the page.</p>
      </div>
    );
  }

  const company = data?.company;
  const settings = data?.settings ?? null;
  const kpis = data?.kpis;
  const recentActivity = data?.recentActivity ?? [];

  if (!company || !kpis) {
    return (
      <div className="text-sm text-slate-600">
        No dashboard data for this company.
      </div>
    );
  }

  const levels = Object.keys(kpis.documentsByLevel ?? {});
  const statusCounts = kpis.requirementStatusCounts ?? { not_started: 0, in_progress: 0, under_review: 0, approved: 0 };
  const documentsByLevel = kpis.documentsByLevel ?? {};
  const approvedByLevel = kpis.approvedDocumentsByLevel ?? {};

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-slate-900">
          ISO 9001 Tracker – {company.name}
        </h1>
        <p className="text-sm text-slate-500">
          Overview of implementation progress, documentation levels, and key milestones.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard
          label="Overall Implementation"
          value={`${kpis.overallProgressPercent}%`}
          helper={`Band: ${kpis.implementationBand}`}
        />
        <KpiCard
          label="Requirements Approved"
          value={String(statusCounts.approved ?? 0)}
          helper={`of ${Object.values(statusCounts).reduce((a, b) => a + b, 0)}`}
        />
        <KpiCard
          label="Total Documents"
          value={String(Object.values(documentsByLevel).reduce((a, b) => a + b, 0))}
          helper={`Approved: ${Object.values(approvedByLevel).reduce((a, b) => a + b, 0)}`}
        />
        <KpiCard
          label="Days to Target"
          value={
            kpis.daysToTarget === null || kpis.daysToTarget === undefined
              ? '—'
              : kpis.daysToTarget >= 0
              ? `${kpis.daysToTarget} days`
              : `Past due by ${Math.abs(kpis.daysToTarget)}`
          }
          helper={settings?.targetCertificationDate ? 'Target date set' : 'No target date set'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Documents by Level" subtitle="Expected documentation folders L1–L4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {levels.length ? levels.map((levelKey) => {
              const total = documentsByLevel[levelKey] ?? 0;
              const approved = approvedByLevel[levelKey] ?? 0;
              const percent = total ? Math.round((approved / total) * 100) : 0;
              return (
                <div key={levelKey} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>{levelKey}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {approved} / {total} documents approved
                  </p>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-500 col-span-2">No level data yet.</p>
            )}
          </div>
        </Card>

        <Card
          title="Main Document Repository"
          subtitle="Primary external folder or document links for ISO 9001 documentation."
        >
          {settings?.mainCloudUrl ? (
            <div className="space-y-2 text-sm">
              <div className="font-medium text-slate-800">
                Provider: <span className="capitalize">{String(settings.mainCloudProvider).replace('_', ' ')}</span>
              </div>
              <div className="text-slate-600 break-all">{settings.mainCloudUrl}</div>
              <a
                href={settings.mainCloudUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 mt-2"
              >
                Open in repository
              </a>
            </div>
          ) : null}
          <a
            href={companyId ? `/documents?companyId=${companyId}` : '#'}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 mt-2"
          >
            View all document links
          </a>
        </Card>

        <Card title="Recent Activity" subtitle="Last 10 changes to requirements or documents.">
          <ul className="space-y-2 text-xs">
            {recentActivity.length ? recentActivity.map((item: { type: string; id: number; status: string; lastUpdatedAt: string }) => (
              <li key={`${item.type}-${item.id}`} className="flex items-center justify-between">
                <span className="capitalize text-slate-700">{item.type}</span>
                <span className="text-slate-500">{item.status}</span>
                <span className="text-slate-400">
                  {new Date(item.lastUpdatedAt).toLocaleDateString()}
                </span>
              </li>
            )) : (
              <li className="text-slate-500">No recent activity.</li>
            )}
          </ul>
        </Card>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
