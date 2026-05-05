'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDocuments, useCompanyRequirements, useDocumentLevels } from '../../../lib/hooks';
import { apiUrl } from '../../../lib/api';
import { Table, THead, TBody, TH, TD } from '../../../components/ui/Table';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';

const DOC_STATUSES = ['draft', 'submitted', 'approved', 'obsolete'] as const;
const QUICK_STATUSES = ['pending', 'completed'] as const;
const CLOUD_PROVIDERS = ['google_drive', 'sharepoint', 'dropbox', 'other'] as const;

type DocForm = {
  companyRequirementId: number | '';
  levelId: number | '';
  name: string;
  description: string;
  status: string;
  cloudProvider: string;
  cloudUrl: string;
  version: string;
};

const emptyDocForm: DocForm = {
  companyRequirementId: '',
  levelId: '',
  name: '',
  description: '',
  status: 'draft',
  cloudProvider: '',
  cloudUrl: '',
  version: '',
};

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canEdit = role === 'admin' || role === 'consultant';

  const [levelId, setLevelId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [linkModalDoc, setLinkModalDoc] = useState<Record<string, unknown> | null>(null);
  const [linkForm, setLinkForm] = useState({ cloudProvider: 'google_drive', cloudUrl: '' });
  const [editingDoc, setEditingDoc] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<DocForm>(emptyDocForm);

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useDocuments({
    companyId,
    levelId,
    status,
    cloudProvider: provider,
    search,
  });
  const { data: reqData } = useCompanyRequirements({ companyId });
  const { data: levelsData } = useDocumentLevels();
  type ReqItem = { id: number; level?: { id: number; shortName: string }; requirement?: { isoArea?: { clauseCode: string }; title: string } };
  const requirements = (reqData as { items?: ReqItem[] })?.items ?? [];
  const levels = Array.isArray(levelsData) ? levelsData : (levelsData as { id?: number; shortName?: string }[] | undefined) ?? [];

  const createDoc = useMutation({
    mutationFn: async (payload: DocForm & { companyRequirementId: number; levelId: number }) => {
      const res = await fetch(apiUrl('/api/documents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyRequirementId: payload.companyRequirementId,
          levelId: payload.levelId,
          name: payload.name,
          description: payload.description || undefined,
          status: payload.status || 'draft',
          cloudProvider: payload.cloudProvider || undefined,
          cloudUrl: payload.cloudUrl || undefined,
          version: payload.version || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to create document');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ['company-dashboard', companyId] });
      setModal(null);
      setForm(emptyDocForm);
    },
  });

  const updateDoc = useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & DocForm) => {
      const res = await fetch(apiUrl('/api/documents'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: payload.name,
          description: payload.description,
          companyRequirementId: payload.companyRequirementId !== '' ? payload.companyRequirementId : undefined,
          levelId: payload.levelId || undefined,
          status: payload.status,
          cloudProvider: payload.cloudProvider,
          cloudUrl: payload.cloudUrl,
          version: payload.version,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update document');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ['company-dashboard', companyId] });
      setModal(null);
      setEditingDoc(null);
      setForm(emptyDocForm);
    },
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(apiUrl(`/api/documents/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to delete document');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ['company-dashboard', companyId] });
    },
  });

  const updateDocStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(apiUrl(`/api/documents/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update status');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ['company-dashboard', companyId] });
    },
  });

  const updateDocLink = useMutation({
    mutationFn: async ({ id, cloudProvider, cloudUrl }: { id: number; cloudProvider: string; cloudUrl: string }) => {
      const res = await fetch(apiUrl(`/api/documents/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudProvider, cloudUrl }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update link');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ['company-dashboard', companyId] });
      setLinkModalDoc(null);
      setLinkForm({ cloudProvider: 'google_drive', cloudUrl: '' });
    },
  });

  const openAdd = () => {
    setForm(emptyDocForm);
    setEditingDoc(null);
    setModal('add');
  };

  const openEdit = (doc: Record<string, unknown>) => {
    setEditingDoc(doc);
    const cr = doc.companyRequirement as { id?: number; levelId?: number } | undefined;
    setForm({
      companyRequirementId: (cr?.id ?? doc.companyRequirementId) as number || '',
      levelId: (doc.levelId ?? cr?.levelId ?? doc.level?.id) as number || '',
      name: (doc.name as string) ?? '',
      description: (doc.description as string) ?? '',
      status: (doc.status as string) ?? 'draft',
      cloudProvider: (doc.cloudProvider as string) ?? '',
      cloudUrl: (doc.cloudUrl as string) ?? '',
      version: (doc.version as string) ?? '',
    });
    setModal('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'add') {
      const crId = form.companyRequirementId;
      const lvId = form.levelId;
      if (crId === '' || lvId === '') return;
      createDoc.mutate({ ...form, companyRequirementId: crId, levelId: lvId });
    } else if (editingDoc && form.levelId !== '') {
      updateDoc.mutate({ id: editingDoc.id as number, ...form });
    }
  };

  if (!companyId) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Documents</h1>
        <p className="text-sm text-slate-600">
          Select a company from the top bar to see its ISO 9001 documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-600">
            Browse and manage ISO 9001 documents. Add, edit, or delete documents to customize the base template per company.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Add Document
          </button>
        )}
      </header>

      <section className="card p-3 md:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
            value={levelId ?? ''}
            onChange={(e) => setLevelId(e.target.value || null)}
          >
            <option value="">All levels</option>
            <option value="1">L1</option>
            <option value="2">L2</option>
            <option value="3">L3</option>
            <option value="4">L4</option>
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
            value={status ?? ''}
            onChange={(e) => setStatus(e.target.value || null)}
          >
            <option value="">All statuses</option>
            {QUICK_STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'pending' ? 'Pending' : 'Completed'}</option>
            ))}
            {DOC_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
            value={provider ?? ''}
            onChange={(e) => setProvider(e.target.value || null)}
          >
            <option value="">All providers</option>
            {CLOUD_PROVIDERS.map((p) => (
              <option key={p} value={p}>{p.replace('_', ' ')}</option>
            ))}
          </select>
          <div className="ml-auto">
            <input
              type="search"
              placeholder="Search by name"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 w-48 md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {!isLoading && !error && companyId && (() => {
        const items = (data?.items ?? []) as Record<string, unknown>[];
        const total = items.length;
        const completed = items.filter((d) => (d.status as string) === 'completed').length;
        return total > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
            <span className="font-medium text-slate-800">{completed} / {total} Documents Completed</span>
          </div>
        ) : null;
      })()}

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading documents…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load documents.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Requirement / Clause</TH>
                <TH>Level</TH>
                <TH>Status</TH>
                <TH>Provider</TH>
                <TH>Version</TH>
                <TH>Owner</TH>
                <TH>Approved by</TH>
                <TH>Last updated</TH>
                {canEdit && <TH>Actions</TH>}
                <TH />
              </tr>
            </THead>
            <TBody>
              {(data?.items ?? []).map((doc: Record<string, unknown>) => (
                <tr key={doc.id as string} className="hover:bg-slate-50">
                  <TD>{String(doc.name ?? '—')}</TD>
                  <TD>
                    {doc.companyRequirement?.requirement
                      ? `${(doc.companyRequirement as { requirement?: { isoArea?: { clauseCode?: string }; title?: string } }).requirement?.isoArea?.clauseCode ?? ''} – ${(doc.companyRequirement as { requirement?: { title?: string } }).requirement?.title ?? ''}`
                      : '—'}
                  </TD>
                  <TD>{(doc.level as { shortName?: string })?.shortName ?? '—'}</TD>
                  <TD>
                    {canEdit ? (
                      <select
                        value={(doc.status as string) === 'completed' ? 'completed' : 'pending'}
                        onChange={(e) => updateDocStatus.mutate({ id: doc.id as number, status: e.target.value })}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs capitalize"
                        disabled={updateDocStatus.isPending}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <StatusBadge status={doc.status as string} />
                    )}
                  </TD>
                  <TD className="capitalize">{String(doc.cloudProvider ?? '—').replace('_', ' ')}</TD>
                  <TD>{doc.version ?? '—'}</TD>
                  <TD>{(doc.createdBy as { name?: string })?.name ?? '—'}</TD>
                  <TD>{(doc.approvedBy as { name?: string })?.name ?? '—'}</TD>
                  <TD>{doc.updatedAt ? new Date(doc.updatedAt as string).toLocaleDateString() : '—'}</TD>
                  {canEdit && (
                    <TD className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => openEdit(doc)} className="text-xs text-primary-700 hover:text-primary-900">Edit</button>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkModalDoc(doc);
                          setLinkForm({
                            cloudProvider: (doc.cloudProvider as string) || 'google_drive',
                            cloudUrl: (doc.cloudUrl as string) || '',
                          });
                        }}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        {doc.cloudUrl ? 'Change link' : 'Add link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.confirm('Delete this document?') && deleteDoc.mutate(doc.id as number)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </TD>
                  )}
                  <TD>
                    {doc.cloudUrl ? (
                      <a href={doc.cloudUrl as string} target="_blank" rel="noreferrer" className="text-xs text-primary-700 hover:text-primary-900">Open</a>
                    ) : canEdit ? (
                      <button type="button" onClick={() => { setLinkModalDoc(doc); setLinkForm({ cloudProvider: 'google_drive', cloudUrl: '' }); }} className="text-xs text-amber-600 hover:text-amber-800">Add link</button>
                    ) : (
                      '—'
                    )}
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <Modal
        open={modal !== null}
        title={modal === 'add' ? 'Add Document' : 'Edit Document'}
        onClose={() => { setModal(null); setEditingDoc(null); }}
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-500">Clause / Requirement</label>
            <select
              value={form.companyRequirementId === '' ? '' : form.companyRequirementId}
              onChange={(e) => setForm((f) => ({ ...f, companyRequirementId: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            >
              <option value="">Select clause (requirement)</option>
              {requirements.map((r: ReqItem) => (
                <option key={r.id} value={r.id}>
                  L{r.level?.id ?? '?'} – {r.requirement?.isoArea?.clauseCode ?? ''} – {r.requirement?.title ?? ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Level</label>
            <select
              value={form.levelId === '' ? '' : form.levelId}
              onChange={(e) => setForm((f) => ({ ...f, levelId: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            >
              <option value="">Select level</option>
              {levels.map((l: { id?: number; shortName?: string }) => (
                <option key={l.id} value={l.id}>{l.shortName ?? `L${l.id}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              {DOC_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Cloud provider</label>
            <select
              value={form.cloudProvider}
              onChange={(e) => setForm((f) => ({ ...f, cloudProvider: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">—</option>
              {CLOUD_PROVIDERS.map((p) => (
                <option key={p} value={p}>{p.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Cloud URL (Google Drive or SharePoint link)</label>
            <input
              type="url"
              value={form.cloudUrl}
              onChange={(e) => setForm((f) => ({ ...f, cloudUrl: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Paste Google Drive or SharePoint link here"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Version</label>
            <input
              value={form.version}
              onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          {(createDoc.error || updateDoc.error) && (
            <p className="text-red-600 text-xs">
              {createDoc.error instanceof Error ? createDoc.error.message : updateDoc.error instanceof Error ? updateDoc.error.message : 'Error'}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700" disabled={createDoc.isPending || updateDoc.isPending}>
              {modal === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!linkModalDoc}
        title={linkModalDoc?.cloudUrl ? 'Change document link' : 'Add Google Drive or SharePoint link'}
        onClose={() => { setLinkModalDoc(null); setLinkForm({ cloudProvider: 'google_drive', cloudUrl: '' }); }}
      >
        <form
          className="space-y-3 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!linkModalDoc) return;
            const url = linkForm.cloudUrl.trim();
            if (!url) return;
            updateDocLink.mutate({
              id: linkModalDoc.id as number,
              cloudProvider: linkForm.cloudProvider || 'google_drive',
              cloudUrl: url,
            });
          }}
        >
          {linkModalDoc && <p className="text-xs text-slate-600 font-medium">{String(linkModalDoc.name)}</p>}
          <div>
            <label className="block text-xs font-medium text-slate-500">Storage</label>
            <select
              value={linkForm.cloudProvider}
              onChange={(e) => setLinkForm((f) => ({ ...f, cloudProvider: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {CLOUD_PROVIDERS.map((p) => (
                <option key={p} value={p}>{p === 'google_drive' ? 'Google Drive' : p === 'sharepoint' ? 'SharePoint' : p.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Link (required)</label>
            <input
              type="url"
              value={linkForm.cloudUrl}
              onChange={(e) => setLinkForm((f) => ({ ...f, cloudUrl: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Paste Google Drive or SharePoint link here"
              required
            />
          </div>
          {updateDocLink.error && (
            <p className="text-red-600 text-xs">{updateDocLink.error instanceof Error ? updateDocLink.error.message : 'Error'}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setLinkModalDoc(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Cancel</button>
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700" disabled={updateDocLink.isPending}>
              Save link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsPageContent />
    </Suspense>
  );
}
