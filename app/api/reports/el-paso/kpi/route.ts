import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import {
  computeDocumentsByLevel,
  computeOverallProgress,
  computeRequirementStatusCounts,
  computeDaysToTarget,
  computeImplementationBand,
} from '../../../../../lib/kpi';
import { getServerAuthSession } from '../../../../../lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const companies = await prisma.company.findMany({
    where: {
      location: {
        contains: 'El Paso',
        mode: 'insensitive',
      },
    },
  });

  const levels = await prisma.documentLevel.findMany({ orderBy: { order: 'asc' } });

  const companyKpis = [];

  for (const company of companies) {
    const whereRequirement: any = { companyId: company.id };
    const whereDocs: any = { companyRequirement: { companyId: company.id } };

    if (from || to) {
      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      whereRequirement.lastUpdatedAt = dateFilter;
      whereDocs.updatedAt = dateFilter;
    }

    const [requirements, docs, settings] = await Promise.all([
      prisma.companyRequirement.findMany({ where: whereRequirement }),
      prisma.document.findMany({ where: whereDocs }),
      prisma.companySettings.findUnique({ where: { companyId: company.id } }),
    ]);

    const statusCounts = computeRequirementStatusCounts(requirements);
    const overallProgressPercent = computeOverallProgress(requirements);
    const { byLevel, approvedByLevel } = computeDocumentsByLevel(levels, docs);
    const daysToTarget = computeDaysToTarget(settings);
    const implementationBand = computeImplementationBand(overallProgressPercent);

    companyKpis.push({
      company,
      settings,
      overallProgressPercent,
      requirementStatusCounts: statusCounts,
      documentsByLevel: byLevel,
      approvedDocumentsByLevel: approvedByLevel,
      daysToTarget,
      implementationBand,
    });
  }

  const numCompanies = companyKpis.length;
  const certifiedEP = companies.filter((c) => (c.status ?? '').toLowerCase() === 'certified').length;
  const inProgressEP = companies.filter((c) => (c.status ?? '').toLowerCase() === 'in progress').length;

  const avgProgress =
    numCompanies === 0
      ? 0
      : Math.round(
          companyKpis.reduce((sum, k) => sum + k.overallProgressPercent, 0) / numCompanies,
        );

  const totalApprovedByLevel: Record<string, number> = {};
  const bandDistribution: Record<string, number> = {};

  for (const k of companyKpis) {
    for (const [level, count] of Object.entries(k.approvedDocumentsByLevel)) {
      totalApprovedByLevel[level] = (totalApprovedByLevel[level] ?? 0) + count;
    }
    bandDistribution[k.implementationBand] = (bandDistribution[k.implementationBand] ?? 0) + 1;
  }

  return NextResponse.json({
    companies: companyKpis,
    summary: {
      numCompanies,
      certifiedEP,
      inProgressEP,
      avgProgress,
      totalApprovedByLevel,
      bandDistribution,
    },
  });
}

