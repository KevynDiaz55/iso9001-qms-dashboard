import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { prisma } from '../../../../../lib/prisma';
import {
  computeDocumentsByLevel,
  computeOverallProgress,
  computeRequirementStatusCounts,
  computeDaysToTarget,
  computeImplementationBand,
} from '../../../../../lib/kpi';
import { getServerAuthSession } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

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

  const companyRows: Array<{
    name: string;
    industry: string;
    progress: number;
    approvedDocs: number;
    targetDate: string;
    band: string;
  }> = [];

  let totalProgress = 0;
  let totalCompanies = 0;
  const totalApprovedByLevel: Record<string, number> = {};

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
    const { approvedByLevel } = computeDocumentsByLevel(levels, docs);
    const implementationBand = computeImplementationBand(overallProgressPercent);
    const totalApprovedDocs = Object.values(approvedByLevel).reduce((a, b) => a + b, 0);

    totalCompanies += 1;
    totalProgress += overallProgressPercent;
    for (const [lvl, count] of Object.entries(approvedByLevel)) {
      totalApprovedByLevel[lvl] = (totalApprovedByLevel[lvl] ?? 0) + count;
    }

    companyRows.push({
      name: company.name,
      industry: company.industry ?? '',
      progress: overallProgressPercent,
      approvedDocs: totalApprovedDocs,
      targetDate: settings?.targetCertificationDate?.toISOString().slice(0, 10) ?? '',
      band: implementationBand,
    });
  }

  const avgProgress = totalCompanies ? Math.round(totalProgress / totalCompanies) : 0;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  page.setFont(fontBold);
  page.setFontSize(18);
  page.drawText('City of El Paso – ISO 9001 Implementation KPIs', { x: 50, y });

  y -= 40;

  page.setFont(fontRegular);
  page.setFontSize(12);
  page.drawText(`Number of El Paso companies: ${totalCompanies}`, { x: 50, y });

  y -= 20;
  page.drawText(`Average implementation progress: ${avgProgress}%`, { x: 50, y });

  y -= 30;
  page.drawText('Total approved documents by level:', { x: 50, y });

  const levelsOrder = ['L1', 'L2', 'L3', 'L4'];
  for (const lvl of levelsOrder) {
    y -= 16;
    page.drawText(`${lvl}: ${totalApprovedByLevel[lvl] ?? 0}`, { x: 70, y });
  }

  // Company overview section
  y -= 30;
  page.setFont(fontBold);
  page.setFontSize(14);
  page.drawText('Company Overview', { x: 50, y });

  y -= 22;
  page.setFont(fontRegular);
  page.setFontSize(9);
  page.drawText('Company | Industry | Progress % | Approved Docs | Target Date | Band', { x: 50, y });

  y -= 16;
  for (const row of companyRows) {
    if (y < 40) {
      const newPage = pdfDoc.addPage();
      const size = newPage.getSize();
      y = size.height - 50;
      newPage.setFont(fontRegular);
      newPage.setFontSize(9);
      newPage.drawText('Company | Industry | Progress % | Approved Docs | Target Date | Band', { x: 50, y });
      y -= 16;
    }

    const line = `${row.name} | ${row.industry} | ${row.progress}% | ${row.approvedDocs} | ${row.targetDate} | ${row.band}`;
    page.drawText(line, { x: 50, y });
    y -= 14;
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="el-paso-kpi-report.pdf"',
    },
  });
}

