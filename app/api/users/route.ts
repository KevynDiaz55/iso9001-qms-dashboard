import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { getServerAuthSession, requireRole } from '../../../lib/auth';

function jsonError(message: string, details?: string, status = 500) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status },
  );
}

export async function GET() {
  try {
    await requireRole(['admin']);
    const users = await prisma.user.findMany({
      orderBy: { email: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin']);
    const body = await req.json();
    const email = (body.email as string)?.trim()?.toLowerCase();
    const allowedDomain = email?.endsWith('@miners.utep.edu') || email?.endsWith('@utep.edu');
    if (!email || !allowedDomain) {
      return NextResponse.json(
        { error: 'Only @miners.utep.edu or @utep.edu emails can be added.' },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const password = body.password as string;
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: (body.name as string) || null,
        hashedPassword,
        role: body.role === 'admin' || body.role === 'consultant' ? body.role : 'viewer',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}
