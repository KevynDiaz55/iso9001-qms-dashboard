import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="card max-w-md w-full p-8 space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">TMAC ISO 9001 Tracker</h1>
        <p className="text-slate-600">
          Internal implementation tracker and quality management dashboard for TMAC engagements.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}

