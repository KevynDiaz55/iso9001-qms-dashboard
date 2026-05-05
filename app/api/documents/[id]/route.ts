import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole } from '../../../../lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'consultant']);
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
    }
    const body = await req.json();
    const updateData: { status?: string; cloudProvider?: string; cloudUrl?: string } = {};
    if (typeof body.status === 'string') updateData.status = body.status;
    if (typeof body.cloudProvider === 'string') updateData.cloudProvider = body.cloudProvider;
    if (typeof body.cloudUrl === 'string') updateData.cloudUrl = body.cloudUrl;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const document = await prisma.document.update({
      where: { id: numId },
      data: updateData,
    });
    return NextResponse.json({ document });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'consultant']);
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
    }
    await prisma.document.delete({
      where: { id: numId },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
