import { useQuery } from '@tanstack/react-query';
import { apiUrl } from './api';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/companies'));
      if (!res.ok) throw new Error('Failed to load companies');
      return res.json();
    },
  });
}

export function useCompanyDashboard(companyId?: string | null) {
  return useQuery({
    enabled: !!companyId,
    queryKey: ['company-dashboard', companyId],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/companies/${companyId}`));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.details || data.error || 'Failed to load company dashboard';
        throw new Error(typeof msg === 'string' ? msg : 'Failed to load company dashboard');
      }
      return data;
    },
  });
}

export function useCompanyRequirements(params: {
  companyId?: string | null;
  levelId?: string | null;
  ownerUserId?: string | null;
  statuses?: string[];
  search?: string;
}) {
  const { companyId, levelId, ownerUserId, statuses, search } = params;
  const qs = new URLSearchParams();
  if (companyId) qs.set('companyId', companyId);
  if (levelId) qs.set('levelId', levelId);
  if (ownerUserId) qs.set('ownerUserId', ownerUserId);
  if (statuses) {
    for (const s of statuses) qs.append('status', s);
  }
  if (search) qs.set('search', search);

  return useQuery({
    enabled: !!companyId,
    queryKey: ['company-requirements', qs.toString()],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/company-requirements?${qs.toString()}`));
      if (!res.ok) throw new Error('Failed to load requirements');
      return res.json();
    },
  });
}

export function useDocumentLevels() {
  return useQuery({
    queryKey: ['document-levels'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/document-levels'));
      if (!res.ok) throw new Error('Failed to load document levels');
      const data = await res.json();
      return data.levels ?? data;
    },
  });
}

export function useDocuments(params: {
  companyId?: string | null;
  levelId?: string | null;
  status?: string | null;
  cloudProvider?: string | null;
  search?: string;
}) {
  const { companyId, levelId, status, cloudProvider, search } = params;
  const qs = new URLSearchParams();
  if (companyId) qs.set('companyId', companyId);
  if (levelId) qs.set('levelId', levelId);
  if (status) qs.set('status', status);
  if (cloudProvider) qs.set('cloudProvider', cloudProvider);
  if (search) qs.set('search', search);

  return useQuery({
    enabled: !!companyId,
    queryKey: ['documents', qs.toString()],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/documents?${qs.toString()}`));
      if (!res.ok) throw new Error('Failed to load documents');
      return res.json();
    },
  });
}

export function usePlaybook(companyId?: string | null) {
  return useQuery({
    enabled: !!companyId,
    queryKey: ['playbook', companyId],
    queryFn: async () => {
      const [stepsRes, tasksRes] = await Promise.all([
        fetch(apiUrl('/api/playbook/steps')),
        fetch(apiUrl(`/api/playbook/company/${companyId}`)),
      ]);
      if (!stepsRes.ok || !tasksRes.ok) throw new Error('Failed to load playbook');
      const steps = await stepsRes.json();
      const tasks = await tasksRes.json();
      return { steps: steps.steps, tasks: tasks.tasks };
    },
  });
}

export function useGlobalReport(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'global'],
    enabled: options?.enabled !== false,
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/reports/global'));
      if (!res.ok) throw new Error('Failed to load global report');
      return res.json();
    },
  });
}

export function useElPasoReport(params: { from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  const queryString = qs.toString();

  return useQuery({
    queryKey: ['el-paso-kpi', queryString],
    queryFn: async () => {
      const url = queryString ? `/api/reports/el-paso/kpi?${queryString}` : '/api/reports/el-paso/kpi';
      const res = await fetch(apiUrl(url));
      if (!res.ok) throw new Error('Failed to load El Paso KPIs');
      return res.json();
    },
  });
}

export function useMeetingLogs(companyId?: string | null) {
  return useQuery({
    enabled: !!companyId,
    queryKey: ['meeting-logs', companyId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/companies/${companyId}/meetings`));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.details || data.error || 'Failed to load meeting logs';
        throw new Error(typeof msg === 'string' ? msg : 'Failed to load meeting logs');
      }
      return data;
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/users'));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.details || data.error || 'Failed to load users';
        throw new Error(typeof msg === 'string' ? msg : 'Failed to load users');
      }
      return data;
    },
  });
}

