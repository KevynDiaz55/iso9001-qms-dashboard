'use client';

import { useState } from 'react';
import { useElPasoReport } from '../../../../lib/hooks';
import { KpiCard } from '../../../../components/ui/KpiCard';
import { Card } from '../../../../components/ui/Card';
import { Table, THead, TBody, TH, TD } from '../../../../components/ui/Table';
import { apiUrl } from '../../../../lib/api';

export default function ElPasoReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading, error } = useElPasoReport({ from: from || undefined, to: to || undefined });

  const handleExport = (type: 'csv' | 'pdf') => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const href =
      type === 'csv'
        ? apiUrl(`/api/reports/el-paso/csv${query}`)
        : apiUrl(`/api/reports/el-paso/pdf${query}`);
    window.open(href, '_blank');
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">City of El Paso KPI Report</h1>
          <p className="text-sm text-slate-600">
            Aggregated ISO 9001 implementation metrics across all companies located in El Paso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-slate-500">
            City filter: <span className="font-semibold">El Paso</span>
          </div>
        </div>
      </header>

      <Card title="Filters">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">From (optional)</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">To (optional)</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
            />
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Export KPI report (CSV)
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Export KPI report (PDF)
            </button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading El Paso KPIs…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load El Paso KPI data.</p>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-medium text-slate-700 mb-2">El Paso summary</h2>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <KpiCard
                label="Total El Paso companies"
                value={data?.summary?.numCompanies?.toString() ?? '0'}
              />
              <KpiCard
                label="Certified El Paso companies"
                value={data?.summary?.certifiedEP?.toString() ?? '0'}
              />
              <KpiCard
                label="El Paso companies in progress"
                value={data?.summary?.inProgressEP?.toString() ?? '0'}
              />
            </div>
          </section>
          <section className="grid gap-4 md:grid-cols-4">
            <KpiCard
              label="El Paso Companies"
              value={data?.summary?.numCompanies?.toString() ?? '0'}
            />
            <KpiCard
              label="Average Progress"
              value={`${data?.summary?.avgProgress ?? 0}%`}
            />
            <KpiCard
              label="Approved Docs L1–L4"
              value={Object.values(data?.summary?.totalApprovedByLevel ?? {}).reduce(
                (a: any, b: any) => a + b,
                0,
              ).toString()}
              helper="Total approved documents across all levels"
            />
            <KpiCard
              label="Highest Band Count"
              value={
                Object.entries(data?.summary?.bandDistribution ?? {})
                  .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] ?? '—'
              }
              helper="Implementation stage band with most companies"
            />
          </section>

          <Card
            title="Company breakdown"
            subtitle="Each row represents one El Paso company implementing ISO 9001."
          >
            <Table>
              <THead>
                <tr>
                  <TH>Company</TH>
                  <TH>Industry</TH>
                  <TH>Overall %</TH>
                  <TH>Approved docs</TH>
                  <TH>Target date</TH>
                  <TH>Band</TH>
                </tr>
              </THead>
              <TBody>
                {data?.companies?.map((row: any) => {
                  const totalApproved = Object.values(row.approvedDocumentsByLevel ?? {}).reduce(
                    (a: any, b: any) => a + b,
                    0,
                  );
                  return (
                    <tr key={row.company.id}>
                      <TD>{row.company.name}</TD>
                      <TD>{row.company.industry}</TD>
                      <TD>{row.overallProgressPercent}%</TD>
                      <TD>{totalApproved}</TD>
                      <TD>
                        {row.settings?.targetCertificationDate
                          ? new Date(row.settings.targetCertificationDate).toLocaleDateString()
                          : '—'}
                      </TD>
                      <TD>{row.implementationBand}</TD>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

