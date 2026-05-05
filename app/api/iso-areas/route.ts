import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getServerAuthSession } from '../../../lib/auth';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const areas = await prisma.isoArea.findMany({
    orderBy: { clauseCode: 'asc' },
    include: {
      requirements: {
        orderBy: { id: 'asc' },
      },
    },
  });

  return NextResponse.json({ isoAreas: areas });
}

