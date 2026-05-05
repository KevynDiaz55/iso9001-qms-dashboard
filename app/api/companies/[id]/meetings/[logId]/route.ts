import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { requireRole } from '../../../../../../lib/auth';

interface RouteParams {
  params: Promise<{ id: string; logId: string }>;
}

function jsonError(message: string, details?: string, status = 500) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status },
  );
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'consultant']);
    const { id: companyId, logId } = await params;
    const body = await req.json();

    const updated = await prisma.meetingLog.updateMany({
      where: { id: parseInt(logId, 10), companyId },
      data: {
        ...(body.meetingDate != null && { meetingDate: new Date(body.meetingDate) }),
        ...(body.attendees != null && { attendees: body.attendees }),
        ...(body.whatWasDone != null && { whatWasDone: body.whatWasDone }),
        ...(body.planForNext != null && { planForNext: body.planForNext }),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const item = await prisma.meetingLog.findFirst({
      where: { id: parseInt(logId, 10), companyId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ item });
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
    await requireRole(['admin', 'consultant']);
    const { id: companyId, logId } = await params;

    const deleted = await prisma.meetingLog.deleteMany({
      where: { id: parseInt(logId, 10), companyId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}
