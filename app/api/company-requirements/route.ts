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
  const ownerUserId = searchParams.get('ownerUserId');
  const status = searchParams.getAll('status');
  const search = searchParams.get('search') ?? undefined;

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  const requirements = await prisma.companyRequirement.findMany({
    where: {
      companyId,
      levelId: levelId ? Number(levelId) : undefined,
      ownerUserId: ownerUserId || undefined,
      status: status.length ? { in: status as any } : undefined,
      requirement: search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              {
                isoArea: {
                  clauseCode: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : undefined,
    },
    include: {
      requirement: {
        include: { isoArea: true },
      },
      level: true,
      owner: true,
    },
    orderBy: { lastUpdatedAt: 'desc' },
  });

  return NextResponse.json({ items: requirements });
}

export async function PATCH(req: NextRequest) {
  await requireRole(['admin', 'consultant']);
  const body = await req.json();
  const normalizedStatus = body.status === 'completed' ? 'approved' : body.status;

  const updated = await prisma.companyRequirement.update({
    where: { id: body.id },
    data: {
      status: normalizedStatus,
      ownerUserId: body.ownerUserId,
      levelId: body.levelId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes,
      lastUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ item: updated });
}

