import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token) {
      return jsonError('Reset token is required.');
    }
    if (!newPassword || newPassword.length < 8) {
      return jsonError('New password must be at least 8 characters.');
    }
    if (newPassword !== confirmPassword) {
      return jsonError('Passwords do not match.');
    }

    const resetRow = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!resetRow) {
      return jsonError('Invalid or expired reset token.');
    }
    if (new Date() > resetRow.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetRow.id } });
      return jsonError('Reset token has expired.');
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: resetRow.email, mode: 'insensitive' } },
    });
    if (!user) {
      return jsonError('No user found for this reset link.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { email: user.email.toLowerCase(), hashedPassword: hashed },
    });
    await prisma.passwordResetToken.delete({ where: { id: resetRow.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
