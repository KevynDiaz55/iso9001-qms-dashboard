import {
  Company,
  CompanyRequirement,
  Document,
  DocumentLevel,
  CompanySettings,
} from '@prisma/client';

export type RequirementStatusCounts = Record<
  'not_started' | 'in_progress' | 'under_review' | 'approved',
  number
>;

export interface CompanyKpi {
  company: Company;
  settings: CompanySettings | null;
  overallProgressPercent: number;
  requirementStatusCounts: RequirementStatusCounts;
  documentsByLevel: Record<string, number>;
  approvedDocumentsByLevel: Record<string, number>;
  daysToTarget: number | null;
  implementationBand: '0-25%' | '25-50%' | '50-75%' | '75-100%';
  totalApprovedDocs: number;
}

export function computeRequirementStatusCounts(
  requirements: CompanyRequirement[],
): RequirementStatusCounts {
  const base: RequirementStatusCounts = {
    not_started: 0,
    in_progress: 0,
    under_review: 0,
    approved: 0,
  };
  for (const cr of requirements) {
    base[cr.status] += 1;
  }
  return base;
}

export function computeOverallProgress(reqs: CompanyRequirement[]): number {
  if (reqs.length === 0) return 0;
  const approved = reqs.filter((r) => r.status === 'approved').length;
  return Math.round((approved / reqs.length) * 100);
}

export function computeDocumentsByLevel(levels: DocumentLevel[], docs: Document[]) {
  const byLevel: Record<string, number> = {};
  const approvedByLevel: Record<string, number> = {};
  for (const level of levels) {
    byLevel[level.shortName] = 0;
    approvedByLevel[level.shortName] = 0;
  }
  for (const doc of docs) {
    const level = levels.find((l) => l.id === doc.levelId);
    if (!level) continue;
    byLevel[level.shortName] = (byLevel[level.shortName] ?? 0) + 1;
    if (doc.status === 'approved' || doc.status === 'completed') {
      approvedByLevel[level.shortName] = (approvedByLevel[level.shortName] ?? 0) + 1;
    }
  }
  return { byLevel, approvedByLevel };
}

export function computeDaysToTarget(settings: CompanySettings | null): number | null {
  if (!settings?.targetCertificationDate) return null;
  const today = new Date();
  const diffMs = settings.targetCertificationDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function computeImplementationBand(percent: number): CompanyKpi['implementationBand'] {
  if (percent < 25) return '0-25%';
  if (percent < 50) return '25-50%';
  if (percent < 75) return '50-75%';
  return '75-100%';
}

