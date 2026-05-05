import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getServerAuthSession } from '../../../lib/auth';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const levels = await prisma.documentLevel.findMany({
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ levels });
}

