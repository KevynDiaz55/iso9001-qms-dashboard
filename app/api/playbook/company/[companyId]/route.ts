import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getServerAuthSession, requireRole } from '../../../../../lib/auth';

interface RouteParams {
  params: { companyId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tasks = await prisma.companyPlaybookTask.findMany({
    where: { companyId: params.companyId },
    include: { step: true },
    orderBy: [{ step: { order: 'asc' } }, { id: 'asc' }],
  });

  return NextResponse.json({ tasks });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  await requireRole(['admin', 'consultant']);
  const body = await req.json();

  const updated = await prisma.companyPlaybookTask.updateMany({
    where: {
      companyId: params.companyId,
      id: body.id,
    },
    data: {
      isDone: body.isDone,
      lastUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ updated });
}

