import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getServerAuthSession } from '../../../../../lib/auth';

interface RouteParams {
  params: { companyRequirementId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.companyRequirementId);

  const docs = await prisma.document.findMany({
    where: {
      companyRequirementId: id,
    },
    include: {
      level: true,
      createdBy: true,
      approvedBy: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ items: docs });
}

