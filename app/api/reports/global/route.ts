import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../lib/auth';

export async function GET() {
  try {
    await requireRole(['admin']);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const [companies, steps, certifiedWithDates] = await Promise.all([
    prisma.company.findMany({ select: { id: true, status: true, currentStage: true } }),
    prisma.playbookStep.findMany({ orderBy: { order: 'asc' }, select: { id: true, order: true, title: true } }),
    prisma.company.findMany({
      where: {
        status: 'certified',
        settings: {
          implementationStartDate: { not: null },
          targetCertificationDate: { not: null },
        },
      },
      include: {
        settings: {
          select: { implementationStartDate: true, targetCertificationDate: true },
        },
      },
    }),
  ]);

  const totalCompanies = companies.length;
  const byStatus: Record<string, number> = {
    certified: 0,
    'in progress': 0,
    'not contacted': 0,
  };
  for (const c of companies) {
    const s = c.status?.toLowerCase();
    if (s in byStatus) byStatus[s]++;
    else byStatus[s ?? 'other'] = (byStatus[s ?? 'other'] ?? 0) + 1;
  }

  const byPlaybookStage: { stageName: string; stageOrder: number; count: number }[] = steps.map((step) => ({
    stageName: step.title,
    stageOrder: step.order,
    count: companies.filter((c) => (c.currentStage ?? '').trim() === step.title).length,
  }));
  const notSetCount = companies.filter((c) => !(c.currentStage ?? '').trim()).length;
  if (notSetCount > 0) {
    byPlaybookStage.push({ stageName: 'Not set', stageOrder: 999, count: notSetCount });
  }

  let averageTimeForCertificationDays: number | null = null;
  if (certifiedWithDates.length > 0) {
    const days: number[] = certifiedWithDates
      .map((c) => {
        const start = c.settings?.implementationStartDate;
        const end = c.settings?.targetCertificationDate;
        if (!start || !end) return null;
        return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      })
      .filter((d): d is number => d !== null);
    if (days.length > 0) {
      averageTimeForCertificationDays = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    }
  }

  return NextResponse.json({
    totalCompanies,
    byStatus,
    byPlaybookStage,
    averageTimeForCertificationDays,
  });
}
