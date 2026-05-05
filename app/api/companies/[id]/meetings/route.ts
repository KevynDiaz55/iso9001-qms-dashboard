import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getServerAuthSession, requireRole } from '../../../../../lib/auth';

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
    const { id: companyId } = await params;
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.meetingLog.findMany({
      where: { companyId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { meetingDate: 'desc' },
    });

    return NextResponse.json({ items: logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'consultant']);
    const { id: companyId } = await params;
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const created = await prisma.meetingLog.create({
      data: {
        companyId,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : new Date(),
        attendees: body.attendees ?? null,
        whatWasDone: body.whatWasDone ?? '',
        planForNext: body.planForNext ?? '',
        createdById: session.user.id as string,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}
