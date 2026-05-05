'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { signOut, useSession } from 'next-auth/react';

async function fetchMe() {
  const res = await fetch('/api/me');
  if (!res.ok) throw new Error('Failed to load user');
  return res.json();
}

export function Topbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyIdParam = searchParams.get('companyId');
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: fetchMe });

  const companies = (data?.user?.companies ?? []) as { id: string; name: string }[];
  const currentCompanyId = companyIdParam || (companies[0]?.id as string | undefined);
  const currentCompany = companies.find((c) => c.id === currentCompanyId);

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered =
    search.trim() === ''
      ? companies
      : companies.filter((c) =>
          c.name.toLowerCase().includes(search.toLowerCase()),
        );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('companyId', id);
    } else {
      params.delete('companyId');
    }
    router.push(`${typeof window !== 'undefined' ? window.location.pathname : ''}?${params.toString()}`);
    setOpen(false);
    setSearch('');
  };

  return (
    <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3 relative min-w-[200px]" ref={wrapperRef}>
        <div className="flex flex-col w-full max-w-xs">
          <label htmlFor="company-search" className="sr-only">
            Search companies
          </label>
          <input
            id="company-search"
            type="text"
            placeholder="Search companies…"
            value={open ? search : (currentCompany?.name ?? '')}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400"
            disabled={isLoading || companies.length === 0}
          />
        </div>
        {open && (companies.length > 0) && (
          <ul
            className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No companies match.</li>
            ) : (
              filtered.map((company) => (
                <li key={company.id} role="option">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                    onClick={() => handleSelect(company.id)}
                  >
                    {company.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex gap-2 text-xs text-slate-500">
          <button className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50">
            Today
          </button>
          <button className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50">
            This Week
          </button>
          <button className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50">
            This Month
          </button>
        </div>
        <div className="relative">
          <input
            type="search"
            placeholder="Search requirements or documents"
            className="hidden md:block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
            {session?.user?.name?.[0] ?? 'U'}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-slate-600 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
