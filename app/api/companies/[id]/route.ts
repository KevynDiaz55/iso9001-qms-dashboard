import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerAuthSession, requireRole } from '../../../../lib/auth';
import {
  computeDocumentsByLevel,
  computeOverallProgress,
  computeRequirementStatusCounts,
  computeDaysToTarget,
  computeImplementationBand,
} from '../../../../lib/kpi';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function jsonError(message: string, details?: string, status = 500) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status },
  );
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [requirements, docs, levels, settings] = await Promise.all([
      prisma.companyRequirement.findMany({
        where: { companyId: company.id },
      }),
      prisma.document.findMany({
        where: { companyRequirement: { companyId: company.id } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      prisma.documentLevel.findMany({ orderBy: { order: 'asc' } }),
      prisma.companySettings.findUnique({ where: { companyId: company.id } }),
    ]);

    const statusCounts = computeRequirementStatusCounts(requirements);
    const overallProgressPercent = computeOverallProgress(requirements);
    const { byLevel, approvedByLevel } = computeDocumentsByLevel(levels, docs);
    const daysToTarget = computeDaysToTarget(settings ?? null);
    const implementationBand = computeImplementationBand(overallProgressPercent);

    const recentActivity = [
      ...requirements.map((r) => ({
        type: 'requirement',
        id: r.id,
        status: r.status,
        lastUpdatedAt: r.lastUpdatedAt,
      })),
      ...docs.map((d) => ({
        type: 'document',
        id: d.id,
        status: d.status,
        lastUpdatedAt: d.updatedAt,
      })),
    ]
      .sort((a, b) => +new Date(b.lastUpdatedAt) - +new Date(a.lastUpdatedAt))
      .slice(0, 10);

    return NextResponse.json({
      company,
      settings: settings ?? null,
      kpis: {
        overallProgressPercent,
        requirementStatusCounts: statusCounts,
        documentsByLevel: byLevel,
        approvedDocumentsByLevel: approvedByLevel,
        daysToTarget,
        implementationBand,
      },
      recentActivity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'consultant']);
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: body.name,
        industry: body.industry,
        location: body.location,
        tmacCoach: body.tmacCoach,
        currentStage: body.currentStage,
        status: body.status,
        address: body.address,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
      },
    });

    return NextResponse.json({ company: updated });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin']);
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.industry != null && { industry: body.industry }),
        ...(body.location != null && { location: body.location }),
        ...(body.tmacCoach != null && { tmacCoach: body.tmacCoach }),
        ...(body.currentStage != null && { currentStage: body.currentStage }),
        ...(body.status != null && { status: body.status }),
        ...(body.address != null && { address: body.address }),
        ...(body.contactName != null && { contactName: body.contactName }),
        ...(body.contactEmail != null && { contactEmail: body.contactEmail }),
        ...(body.contactPhone != null && { contactPhone: body.contactPhone }),
      },
    });

    return NextResponse.json({ company: updated });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin']);
    const { id } = await params;

    await prisma.company.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}
