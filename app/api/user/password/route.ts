import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { getServerAuthSession } from '../../../../lib/auth';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return jsonError('New password must be at least 8 characters.');
    }
    if (newPassword !== confirmPassword) {
      return jsonError('New password and confirmation do not match.');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!valid) {
      return jsonError('Current password is incorrect.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
