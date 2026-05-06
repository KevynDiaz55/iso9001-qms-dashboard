import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireRole, getServerAuthSession } from '../../../../lib/auth';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['admin']);
    const { id } = await params;
    const body = await req.json();

    const data: { name?: string | null; email?: string; role?: string } = {};

    if (typeof body.name === 'string') {
      data.name = body.name.trim() || null;
    }

    if (typeof body.email === 'string') {
      const email = body.email.trim().toLowerCase();
      const allowedDomain = email.endsWith('@miners.utep.edu') || email.endsWith('@utep.edu');
      if (!allowedDomain) {
        return jsonError('Only @miners.utep.edu or @utep.edu emails are allowed.');
      }
      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, NOT: { id } },
      });
      if (existing) {
        return jsonError('Another user already uses this email.', 409);
      }
      data.email = email;
    }

    if (typeof body.role === 'string') {
      if (!['admin', 'consultant', 'viewer'].includes(body.role)) {
        return jsonError('Invalid role.');
      }
      data.role = body.role;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['admin']);
    const session = await getServerAuthSession();
    const { id } = await params;

    if (session?.user?.id === id) {
      return jsonError('You cannot delete your own account.', 400);
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });
    if (!target) {
      return jsonError('User not found.', 404);
    }

    if (target.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return jsonError('Cannot delete the last admin.', 400);
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
}
