import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '../../../../lib/prisma';
import { sendPasswordResetEmail } from '../../../../lib/email';

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

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If that email is registered, a reset link will be sent.',
      });
    }

    const normalizedEmail = user.email.toLowerCase();

    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

    const sent = await sendPasswordResetEmail({ to: normalizedEmail, resetUrl: resetLink });

    if (!sent.ok) {
      const isDev = process.env.NODE_ENV === 'development';
      console.error('[Forgot Password]', sent.error);
      if (isDev) {
        console.log('[Forgot Password] Dev reset link:', resetLink);
        return NextResponse.json({
          success: true,
          message:
            'Email is not configured (set RESEND_API_KEY). For local dev, use the link below or see the server console.',
          devResetLink: resetLink,
        });
      }
      return NextResponse.json(
        {
          error:
            'Password reset email is not configured. Add RESEND_API_KEY and EMAIL_FROM in Vercel (see lib/email.ts), then redeploy.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, you will receive a reset link shortly.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
