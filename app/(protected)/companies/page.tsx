'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanies } from '../../../lib/hooks';
import { apiUrl } from '../../../lib/api';
import { Table, THead, TBody, TH, TD } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';

const COMPANY_STATUSES = ['not contacted', 'in progress', 'certified'] as const;

type CompanyPayload = {
  name: string;
  industry: string;
  location: string;
  tmacCoach: string;
  status: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

const emptyForm: CompanyPayload = {
  name: '',
  industry: '',
  location: '',
  tmacCoach: '',
  status: 'not contacted',
  address: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

export default function CompaniesPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin';

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useCompanies();
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<{ id: string } & CompanyPayload | null>(null);
  const [form, setForm] = useState<CompanyPayload>(emptyForm);

  const createCompany = useMutation({
    mutationFn: async (payload: CompanyPayload) => {
      const res = await fetch(apiUrl('/api/companies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || 'Failed to create company');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setModal(null);
      setForm(emptyForm);
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & CompanyPayload) => {
      const res = await fetch(apiUrl(`/api/companies/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || 'Failed to update company');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/companies/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || json.details || 'Failed to delete company');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditing(null);
    setModal('add');
  };

  const openEdit = (c: Record<string, unknown>) => {
    const id = c.id as string;
    setEditing({
      id,
      name: (c.name as string) ?? '',
      industry: (c.industry as string) ?? '',
      location: (c.location as string) ?? '',
      tmacCoach: (c.tmacCoach as string) ?? '',
      status: (c.status as string) ?? 'not contacted',
      address: (c.address as string) ?? '',
      contactName: (c.contactName as string) ?? '',
      contactEmail: (c.contactEmail as string) ?? '',
      contactPhone: (c.contactPhone as string) ?? '',
    });
    setForm({
      name: (c.name as string) ?? '',
      industry: (c.industry as string) ?? '',
      location: (c.location as string) ?? '',
      tmacCoach: (c.tmacCoach as string) ?? '',
      status: (c.status as string) ?? 'not contacted',
      address: (c.address as string) ?? '',
      contactName: (c.contactName as string) ?? '',
      contactEmail: (c.contactEmail as string) ?? '',
      contactPhone: (c.contactPhone as string) ?? '',
    });
    setModal('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'add') {
      createCompany.mutate(form);
    } else if (editing) {
      updateCompany.mutate({ id: editing.id, ...form });
    }
  };

  const companies = data?.companies ?? [];

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-600">
            Manage companies tracked for ISO 9001 implementation. Only admins can add, edit, or delete.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Add Company
          </button>
        )}
      </header>

      {isLoading && <p className="text-sm text-slate-600">Loading companies…</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load companies.'}
        </p>
      )}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Industry</TH>
                <TH>Location</TH>
                <TH>Status</TH>
                <TH>TMAC Coach</TH>
                <TH>Contact</TH>
                {isAdmin && <TH>Actions</TH>}
              </tr>
            </THead>
            <TBody>
              {companies.map((c: Record<string, unknown>) => (
                <tr key={c.id as string} className="hover:bg-slate-50">
                  <TD>{String(c.name ?? '—')}</TD>
                  <TD>{String(c.industry ?? '—')}</TD>
                  <TD>{String(c.location ?? '—')}</TD>
                  <TD className="capitalize">{String((c.status as string) ?? '—').replace(' ', ' ')}</TD>
                  <TD>{String(c.tmacCoach ?? '—')}</TD>
                  <TD className="text-xs">
                    {c.contactName ? `${c.contactName}` : '—'}
                    {c.contactEmail ? ` · ${c.contactEmail}` : ''}
                  </TD>
                  {isAdmin && (
                    <TD className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="text-xs text-primary-700 hover:text-primary-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => window.confirm('Delete this company? This cannot be undone.') && deleteCompany.mutate(c.id as string)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                      <a
                        href={`/companies/${c.id}/progress?companyId=${c.id}`}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        Progress
                      </a>
                    </TD>
                  )}
                </tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <Modal
        open={modal !== null}
        title={modal === 'add' ? 'Add Company' : 'Edit Company'}
        onClose={() => { setModal(null); setEditing(null); }}
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-500">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500">Industry</label>
              <input
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                {COMPANY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Street, city, state, zip"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">TMAC Coaches / Owners</label>
            <input
              value={form.tmacCoach}
              onChange={(e) => setForm((f) => ({ ...f, tmacCoach: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="e.g. Ricardo Ramirez & Kevyn Diaz"
            />
            <p className="mt-1 text-xs text-slate-500">You can add multiple names (e.g., &quot;Ricardo Ramirez & Kevyn Diaz&quot;).</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Contact Name</label>
            <input
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Contact Phone</label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          {(createCompany.error || updateCompany.error) && (
            <p className="text-red-600 text-xs">
              {createCompany.error instanceof Error ? createCompany.error.message : updateCompany.error instanceof Error ? updateCompany.error.message : 'Error'}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700" disabled={createCompany.isPending || updateCompany.isPending}>
              {modal === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
