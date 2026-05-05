'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';

async function fetchCompany(companyId: string) {
  const res = await fetch(apiUrl(`/api/companies/${companyId}`));
  if (!res.ok) throw new Error('Failed to load company');
  return res.json();
}

async function fetchSettings(companyId: string) {
  const res = await fetch(apiUrl(`/api/company-settings/${companyId}`));
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const queryClient = useQueryClient();

  const { data: companyData } = useQuery({
    enabled: !!companyId,
    queryKey: ['company', companyId],
    queryFn: () => fetchCompany(companyId as string),
  });

  const { data: settingsData } = useQuery({
    enabled: !!companyId,
    queryKey: ['company-settings', companyId],
    queryFn: () => fetchSettings(companyId as string),
  });

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [tmacCoach, setTmacCoach] = useState('');

  const [mainCloudProvider, setMainCloudProvider] = useState('google_drive');
  const [mainCloudUrl, setMainCloudUrl] = useState('');

  useEffect(() => {
    if (companyData?.company) {
      setName(companyData.company.name);
      setIndustry(companyData.company.industry ?? '');
      setLocation(companyData.company.location ?? '');
      setTmacCoach(companyData.company.tmacCoach ?? '');
    }
  }, [companyData]);

  useEffect(() => {
    if (settingsData?.settings) {
      setMainCloudProvider(settingsData.settings.mainCloudProvider);
      setMainCloudUrl(settingsData.settings.mainCloudUrl ?? '');
    }
  }, [settingsData]);

  const updateCompany = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/api/companies/${companyId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, location, tmacCoach }),
      });
      if (!res.ok) throw new Error('Failed to update company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/api/company-settings/${companyId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainCloudProvider,
          mainCloudUrl,
        }),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard', companyId] });
    },
  });

  const onSubmitProfile = (e: FormEvent) => {
    e.preventDefault();
    updateCompany.mutate();
  };

  const onSubmitRepository = (e: FormEvent) => {
    e.preventDefault();
    updateSettings.mutate();
  };

  if (!companyId) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Company Settings</h1>
        <p className="text-sm text-slate-600">
          Select a company to adjust profile and repository settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Company Settings</h1>

      <Card title="Company profile">
        <form onSubmit={onSubmitProfile} className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">TMAC Coach</label>
            <input
              value={tmacCoach}
              onChange={(e) => setTmacCoach(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Save profile
            </button>
          </div>
        </form>
      </Card>

      <Card title="Main document repository">
        <form onSubmit={onSubmitRepository} className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Provider</label>
            <select
              value={mainCloudProvider}
              onChange={(e) => setMainCloudProvider(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="google_drive">Google Drive</option>
              <option value="sharepoint">SharePoint</option>
              <option value="dropbox">Dropbox</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-medium text-slate-500">Main folder URL</label>
            <input
              value={mainCloudUrl}
              onChange={(e) => setMainCloudUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-3 flex items-center justify-between">
            <a
              href={mainCloudUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary-700 hover:text-primary-900"
            >
              Open repository
            </a>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Save repository
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}

