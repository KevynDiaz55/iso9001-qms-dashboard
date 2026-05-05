'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const navItems: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/admin-dashboard', label: 'Admin Dashboard', adminOnly: true },
  { href: '/companies', label: 'Companies' },
  { href: '/requirements', label: 'Requirements' },
  { href: '/documents', label: 'Documents' },
  { href: '/playbook', label: 'Playbook' },
  { href: '/reports/el-paso', label: 'Reports' },
  { href: '/settings', label: 'Company Settings' },
  { href: '/settings/security', label: 'Security' },
  { href: '/users', label: 'Users' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin';
  const items = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-200 bg-white/80 backdrop-blur">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
            T
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">TMAC QMS</div>
            <div className="text-xs text-slate-500">ISO 9001 Tracker</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

