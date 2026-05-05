'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyRequirements } from '../../../lib/hooks';
import { apiUrl } from '../../../lib/api';
import { Table, THead, TBody, TH, TD } from '../../../components/ui/Table';
import { LevelChip } from '../../../components/ui/LevelChip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';

type StatusFilter = 'not_started' | 'in_progress' | 'under_review' | 'approved';

function RequirementsPageContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<StatusFilter[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading, error } = useCompanyRequirements({
    companyId,
    levelId: levelFilter,
    statuses,
    search,
  });

  const queryClient = useQueryClient();

  const updateRequirement = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(apiUrl('/api/company-requirements'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update requirement');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-requirements'] });
    },
  });

  const toggleStatusFilter = (value: StatusFilter) => {
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  if (!companyId) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Requirements</h1>
        <p className="text-sm text-slate-600">
          Select a company from the top bar to see its ISO 9001 requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Requirements</h1>
          <p className="text-sm text-slate-600">
            Track ISO 9001 requirements for this company, including owners, due dates, and status.
          </p>
        </div>
      </header>

      <section className="card p-3 md:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <LevelChip
            label="All"
            active={!levelFilter}
            onClick={() => setLevelFilter(null)}
          />
          {['1', '2', '3', '4'].map((n) => (
            <LevelChip
              key={n}
              label={`L${n}`}
              active={levelFilter === n}
              onClick={() => setLevelFilter(`L${n}` === levelFilter ? null : `L${n}`)}
            />
          ))}
          <div className="h-5 w-px bg-slate-200 mx-1" />
          {(['not_started', 'in_progress', 'under_review', 'approved'] as StatusFilter[]).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  statuses.includes(s)
                    ? 'bg-primary-50 text-primary-700 border-primary-100'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ),
          )}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              placeholder="Search title or clause"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 w-48 md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading requirements…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load requirements.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Clause</TH>
              <TH>Title</TH>
              <TH>Level</TH>
              <TH>Status</TH>
              <TH>Priority</TH>
              <TH>Owner</TH>
              <TH>Due date</TH>
              <TH>Last updated</TH>
            </tr>
          </THead>
          <TBody>
            {data?.items?.map((item: any) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelected(item)}
              >
                <TD>{item.requirement.isoArea.clauseCode}</TD>
                <TD>{item.requirement.title}</TD>
                <TD>{item.level.shortName}</TD>
                <TD>
                  <StatusBadge status={item.status} />
                </TD>
                <TD className="capitalize">{item.priority}</TD>
                <TD>{item.owner?.name ?? 'Unassigned'}</TD>
                <TD>
                  {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : <span>—</span>}
                </TD>
                <TD>{new Date(item.lastUpdatedAt).toLocaleDateString()}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={!!selected}
        title={selected ? selected.requirement.title : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">{selected.requirement.description}</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-slate-500">
                Clause {selected.requirement.isoArea.clauseCode}
              </span>
              <span className="text-xs text-slate-500 capitalize">
                Priority: {selected.priority}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">Notes</div>
              <p className="text-slate-700 whitespace-pre-line">{selected.notes ?? '—'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function RequirementsPage() {
  return (
    <Suspense fallback={null}>
      <RequirementsPageContent />
    </Suspense>
  );
}

