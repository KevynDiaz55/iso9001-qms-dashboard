'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }
      setStatus('success');
      setMessage(data.message || 'If that email is registered, you will receive a reset link.');
      if (data.devResetLink) {
        setMessage((prev) => prev + ' Check the console or use the link shown in development.');
        console.log('Reset link:', data.devResetLink);
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card max-w-md w-full p-8 space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Forgot Password</h1>
          <p className="text-sm text-slate-600">
            Enter your @miners.utep.edu or @utep.edu email. We’ll send a reset link (or show it in the console if no email server is configured).
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@miners.utep.edu"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
            {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="text-primary-600 hover:underline">Back to Login</Link>
        </p>
      </div>
    </main>
  );
}
