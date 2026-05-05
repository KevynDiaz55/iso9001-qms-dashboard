import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '../../../../lib/prisma';

const TOKEN_EXPIRY_HOURS = 1;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email as string)?.trim()?.toLowerCase();
    if (!email) {
      return jsonError('Email is required.');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json({ success: true, message: 'If that email is registered, a reset link will be sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    console.log('[Forgot Password] Reset link for', email, ':', resetLink);
    const mailto = `mailto:${email}?subject=TMAC%20Password%20Reset&body=Click%20or%20copy%20this%20link%20to%20reset%20your%20password%20(expires%20in%20${TOKEN_EXPIRY_HOURS}%20hour):%0A%0A${encodeURIComponent(resetLink)}`;
    console.log('[Forgot Password] mailto link:', mailto);

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a reset link will be sent. For development, see server console for the reset link.',
      devResetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
