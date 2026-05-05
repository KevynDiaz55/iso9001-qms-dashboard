'use client';

import { useState } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyDashboard, useMeetingLogs } from '../../../../../lib/hooks';
import { apiUrl } from '../../../../../lib/api';
import { Card } from '../../../../../components/ui/Card';
import { Modal } from '../../../../../components/ui/Modal';

function buildMailto(log: { meetingDate: string; whatWasDone: string; planForNext: string }, companyName: string) {
  const date = new Date(log.meetingDate).toLocaleDateString();
  const subject = encodeURIComponent(`TMAC Meeting Minutes - ${companyName}`);
  const body = encodeURIComponent(
    `Here are the minutes from our meeting on ${date}:\n\nWHAT WAS DONE:\n${log.whatWasDone}\n\nPLAN FOR NEXT MEETING:\n${log.planForNext}`,
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

function buildOutlookDeeplink(companyName: string, planForNext: string) {
  const subject = encodeURIComponent(`Weekly TMAC Meeting - ${companyName}`);
  const body = encodeURIComponent(
    `Plan for this meeting:\n${planForNext}\n\n(Please make this a Teams meeting)`,
  );
  return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${subject}&body=${body}`;
}

export default function CompanyProgressPage(): JSX.Element {
  const params = useParams();
  const companyId = params?.id as string | undefined;
  const queryClient = useQueryClient();

  const { data: dashboardData } = useCompanyDashboard(companyId);
  const { data: meetingsData, isLoading: meetingsLoading, error: meetingsError } = useMeetingLogs(companyId);
  const company = dashboardData?.company;
  const [stageEdit, setStageEdit] = useState('');
  const [savingStage, setSavingStage] = useState(false);
  const [logModal, setLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    meetingDate: new Date().toISOString().slice(0, 10),
    attendees: '',
    whatWasDone: '',
    planForNext: '',
  });

  const saveStage = async () => {
    if (!companyId || stageEdit === '') return;
    setSavingStage(true);
    try {
      const res = await fetch(apiUrl(`/api/companies/${companyId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage: stageEdit }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['company-dashboard', companyId] });
        setStageEdit('');
      }
    } finally {
      setSavingStage(false);
    }
  };

  const createLog = useMutation({
    mutationFn: async (payload: typeof logForm) => {
      const res = await fetch(apiUrl(`/api/companies/${companyId}/meetings`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || 'Failed to create meeting log');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-logs', companyId] });
      setLogModal(false);
      setLogForm({ meetingDate: new Date().toISOString().slice(0, 10), attendees: '', whatWasDone: '', planForNext: '' });
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (logId: number) => {
      const res = await fetch(apiUrl(`/api/companies/${companyId}/meetings/${logId}`), { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to delete');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-logs', companyId] });
    },
  });

  const logs = meetingsData?.items ?? [];
  const currentStage = company?.currentStage ?? null;
  const lastLog = logs[0];
  const companyName = company?.name ?? 'Company';

  if (!companyId) {
    return (
      <div className="text-sm text-slate-600">
        <Link href="/companies" className="text-primary-600 hover:underline">Back to Companies</Link>
        <p className="mt-2">No company selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/companies" className="text-primary-600 hover:underline">Companies</Link>
        <span>/</span>
        <span className="font-medium text-slate-900">{companyName}</span>
        <span>/</span>
        <span>Progress</span>
      </div>

      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Progress & Meeting Minutes</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.open(buildOutlookDeeplink(companyName, lastLog?.planForNext ?? 'Weekly TMAC check-in'), '_blank')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Schedule Next Meeting (Teams/Outlook)
          </button>
          <button
            type="button"
            onClick={() => setLogModal(true)}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            + Log Meeting
          </button>
        </div>
      </header>

      <Card title="Current stage" subtitle="Implementation phase for this company">
        {currentStage ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-800">{currentStage}</span>
            <button
              type="button"
              onClick={() => setStageEdit(currentStage)}
              className="text-xs text-primary-600 hover:underline"
            >
              Edit
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Not set.</p>
        )}
        {stageEdit !== '' && (
          <div className="mt-2 flex gap-2">
            <input
              value={stageEdit}
              onChange={(e) => setStageEdit(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              placeholder="e.g. Documentation & process mapping"
            />
            <button
              type="button"
              onClick={saveStage}
              disabled={savingStage}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-60"
            >
              Save
            </button>
            <button type="button" onClick={() => setStageEdit('')} className="text-sm text-slate-600 hover:underline">
              Cancel
            </button>
          </div>
        )}
      </Card>

      <Card title="Meeting minutes" subtitle="Previous meetings and plans">
        {meetingsLoading && <p className="text-sm text-slate-600">Loading…</p>}
        {meetingsError && (
          <p className="text-sm text-red-600">{meetingsError instanceof Error ? meetingsError.message : 'Failed to load.'}</p>
        )}
        {!meetingsLoading && !meetingsError && (
          <ul className="space-y-4">
            {logs.length === 0 ? (
              <li className="text-sm text-slate-500">No meeting logs yet. Use &quot;+ Log Meeting&quot; to add one.</li>
            ) : (
              logs.map((log: {
                id: number;
                meetingDate: string;
                attendees: string | null;
                whatWasDone: string;
                planForNext: string;
                createdBy?: { name: string | null };
              }) => (
                <li key={log.id} className="card rounded-lg border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(log.meetingDate).toLocaleDateString()}</span>
                    {log.createdBy?.name && <span>By {log.createdBy.name}</span>}
                  </div>
                  {log.attendees && <p className="text-xs text-slate-600">Attendees: {log.attendees}</p>}
                  <div>
                    <p className="text-xs font-medium text-slate-500">What was done</p>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.whatWasDone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Plan for next</p>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.planForNext}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <a
                      href={buildMailto(log, companyName)}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Email Minutes
                    </a>
                    <button
                      type="button"
                      onClick={() => window.confirm('Delete this meeting log?') && deleteLog.mutate(log.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </Card>

      <Modal open={logModal} title="Log meeting" onClose={() => setLogModal(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLog.mutate(logForm);
          }}
          className="space-y-3 text-sm"
        >
          <div>
            <label className="block text-xs font-medium text-slate-500">Meeting date</label>
            <input
              type="date"
              value={logForm.meetingDate}
              onChange={(e) => setLogForm((f) => ({ ...f, meetingDate: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Attendees (optional)</label>
            <input
              value={logForm.attendees}
              onChange={(e) => setLogForm((f) => ({ ...f, attendees: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Names or emails"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">What was done</label>
            <textarea
              value={logForm.whatWasDone}
              onChange={(e) => setLogForm((f) => ({ ...f, whatWasDone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 min-h-[80px]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Plan for next meeting</label>
            <textarea
              value={logForm.planForNext}
              onChange={(e) => setLogForm((f) => ({ ...f, planForNext: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 min-h-[80px]"
              required
            />
          </div>
          {createLog.error && (
            <p className="text-red-600 text-xs">{createLog.error instanceof Error ? createLog.error.message : 'Error'}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setLogModal(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700" disabled={createLog.isPending}>
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
