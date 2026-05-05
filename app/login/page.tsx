'use client';

import { FormEvent, Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card max-w-md w-full p-8 space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to TMAC QMS</h1>
          <p className="text-sm text-slate-600">
            Use your <strong>@miners.utep.edu</strong> or <strong>@utep.edu</strong> email and password. Only pre-approved UTEP accounts can access the ISO 9001 tracker.
          </p>
        </header>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1 text-left">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email (@miners.utep.edu)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@miners.utep.edu"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="space-y-1 text-left">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-xs text-slate-500 text-left">
            Only <strong>@miners.utep.edu</strong> / <strong>@utep.edu</strong> addresses that have been added by an admin can sign in. If you don’t have access, contact your TMAC admin.
          </p>
          <p className="text-xs text-slate-500 text-left">
            <a href="/forgot-password" className="text-primary-600 hover:underline">Forgot password?</a>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
