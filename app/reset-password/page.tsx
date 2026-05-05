'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage('Missing reset token. Use the link from your email.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to reset password.');
        return;
      }
      setStatus('success');
      setMessage('Password updated. You can now sign in.');
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  };

  if (!token) {
    return (
      <div className="card max-w-md w-full p-8 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Invalid Link</h1>
        <p className="text-sm text-slate-600">
          This reset link is missing the token. Please use the link from your email or request a new one.
        </p>
        <Link href="/forgot-password" className="text-primary-600 hover:underline text-sm">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="card max-w-md w-full p-8 space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Set New Password</h1>
        <p className="text-sm text-slate-600">Choose a new password (at least 8 characters).</p>
      </header>

      {status === 'success' ? (
        <div className="space-y-4">
          <p className="text-sm text-green-700">{message}</p>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 text-center"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              minLength={8}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              minLength={8}
              required
            />
          </div>
          {message && (
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-700'}`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-primary-600 hover:underline">Back to Login</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<div className="text-sm text-slate-600">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
