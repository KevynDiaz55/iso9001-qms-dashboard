'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUsers } from '../../../lib/hooks';
import { apiUrl } from '../../../lib/api';
import { Table, THead, TBody, TH, TD } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';

export default function UsersPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin';

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'viewer' as string });

  const createUser = useMutation({
    mutationFn: async (payload: { email: string; name: string; password: string; role: string }) => {
      const res = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || 'Failed to add user');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setForm({ email: '', name: '', password: '', role: 'viewer' });
    },
  });

  const users = data?.users ?? [];

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-600">Only admins can view and add approved users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-600">
            Approved @miners.utep.edu accounts. Only these users can sign in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Add User
        </button>
      </header>

      {isLoading && <p className="text-sm text-slate-600">Loading users…</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load users.'}
        </p>
      )}
      {!isLoading && !error && (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Created</TH>
            </tr>
          </THead>
          <TBody>
            {users.map((u: { id: string; name: string | null; email: string; role: string; createdAt: string }) => (
              <tr key={u.id}>
                <TD>{u.name ?? '—'}</TD>
                <TD>{u.email}</TD>
                <TD className="capitalize">{u.role}</TD>
                <TD>{new Date(u.createdAt).toLocaleDateString()}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}

      <Modal open={modalOpen} title="Add approved user (@miners.utep.edu)" onClose={() => setModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createUser.mutate(form);
          }}
          className="space-y-3 text-sm"
        >
          <p className="text-xs text-slate-600">Only @miners.utep.edu emails can be added. The user will be able to sign in with this email and the password you set.</p>
          <div>
            <label className="block text-xs font-medium text-slate-500">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@miners.utep.edu"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Name (optional)</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Password (min 8 characters)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="viewer">Viewer</option>
              <option value="consultant">Consultant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {createUser.error && (
            <p className="text-red-600 text-xs">{createUser.error instanceof Error ? createUser.error.message : 'Error'}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700" disabled={createUser.isPending}>
              Add User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
