'use client';

import { useState, FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '../../../../lib/api';

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl('/api/user/password'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      return data;
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error) => {
      setMessage({ type: 'error', text: err.message });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    changePassword.mutate();
  };

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-semibold text-slate-900">Change Password</h1>
      <p className="text-sm text-slate-600">
        Enter your current password and choose a new one. Use at least 8 characters.
      </p>

      <form onSubmit={onSubmit} className="card p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            minLength={8}
            required
          />
        </div>
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          disabled={changePassword.isPending}
        >
          {changePassword.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
