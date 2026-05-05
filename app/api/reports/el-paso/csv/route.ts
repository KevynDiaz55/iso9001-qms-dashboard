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
    return new NextResponse('Unauthorized', { status: 401 });
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

  const levels = await prisma.documentLevel.findMany();

  const header = [
    'companyName',
    'industry',
    'location',
    'overallProgressPercent',
    'requirementsNotStarted',
    'requirementsInProgress',
    'requirementsUnderReview',
    'requirementsApproved',
    'docsLevel1Total',
    'docsLevel1Approved',
    'docsLevel2Total',
    'docsLevel2Approved',
    'docsLevel3Total',
    'docsLevel3Approved',
    'docsLevel4Total',
    'docsLevel4Approved',
    'targetCertificationDate',
    'daysToTarget',
    'implementationBand',
  ];

  const rows: string[] = [];
  rows.push(header.join(','));

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

    const lvl = (shortName: string) => byLevel[shortName] ?? 0;
    const lvlApproved = (shortName: string) => approvedByLevel[shortName] ?? 0;

    const vals = [
      company.name,
      company.industry ?? '',
      company.location,
      overallProgressPercent.toString(),
      statusCounts.not_started.toString(),
      statusCounts.in_progress.toString(),
      statusCounts.under_review.toString(),
      statusCounts.approved.toString(),
      lvl('L1').toString(),
      lvlApproved('L1').toString(),
      lvl('L2').toString(),
      lvlApproved('L2').toString(),
      lvl('L3').toString(),
      lvlApproved('L3').toString(),
      lvl('L4').toString(),
      lvlApproved('L4').toString(),
      settings?.targetCertificationDate?.toISOString() ?? '',
      daysToTarget !== null ? daysToTarget.toString() : '',
      implementationBand,
    ];

    rows.push(vals.map((v) => `"${v.replace(/"/g, '""')}"`).join(','));
  }

  const csv = rows.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="el-paso-kpi-report.csv"',
    },
  });
}

