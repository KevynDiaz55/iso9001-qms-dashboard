import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getServerAuthSession, requireRole } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const levelId = searchParams.get('levelId');
  const status = searchParams.get('status');
  const cloudProvider = searchParams.get('cloudProvider');
  const search = searchParams.get('search') ?? undefined;

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  const docs = await prisma.document.findMany({
    where: {
      companyRequirement: {
        companyId,
      },
      levelId: levelId ? Number(levelId) : undefined,
      status: status ?? undefined,
      cloudProvider: cloudProvider ?? undefined,
      name: search
        ? {
            contains: search,
            mode: 'insensitive',
          }
        : undefined,
    },
    include: {
      companyRequirement: {
        include: {
          requirement: {
            include: { isoArea: true },
          },
        },
      },
      level: true,
      createdBy: true,
      approvedBy: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ items: docs });
}

export async function POST(req: NextRequest) {
  const session = await requireRole(['admin', 'consultant']);
  const body = await req.json();
  const createdById = body.createdById ?? (session.user as { id?: string }).id;
  if (!createdById) {
    return NextResponse.json({ error: 'createdById is required' }, { status: 400 });
  }

  const created = await prisma.document.create({
    data: {
      companyRequirementId: body.companyRequirementId,
      name: body.name,
      description: body.description,
      levelId: body.levelId,
      status: body.status,
      cloudProvider: body.cloudProvider,
      cloudUrl: body.cloudUrl,
      version: body.version,
      createdById,
      approvedById: body.approvedById ?? null,
    },
  });

  return NextResponse.json({ document: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  await requireRole(['admin', 'consultant']);
  const body = await req.json();

  const data: Record<string, unknown> = {
    name: body.name,
    description: body.description,
    levelId: body.levelId,
    status: body.status,
    cloudProvider: body.cloudProvider,
    cloudUrl: body.cloudUrl,
    version: body.version,
    approvedById: body.approvedById ?? null,
  };
  if (typeof body.companyRequirementId === 'number') {
    data.companyRequirementId = body.companyRequirementId;
  }

  const updated = await prisma.document.update({
    where: { id: body.id },
    data: data as any,
  });

  return NextResponse.json({ document: updated });
}

