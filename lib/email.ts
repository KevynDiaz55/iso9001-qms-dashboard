/**
 * Send transactional email via Resend (https://resend.com).
 *
 * Vercel env (Production):
 *   RESEND_API_KEY=re_...
 *   EMAIL_FROM="TMAC QMS <onboarding@resend.dev>"   (or your verified domain)
 */
export async function sendPasswordResetEmail(options: { to: string; resetUrl: string }) {
  const { to, resetUrl } = options;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'TMAC QMS <onboarding@resend.dev>';

  if (!apiKey) {
    return { ok: false as const, error: 'RESEND_API_KEY is not set' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Reset your TMAC QMS password',
      html: `<p>Click the link below to set a new password. This link expires in one hour.</p>
<p><a href="${resetUrl}">Reset password</a></p>
<p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { ok: false as const, error: `Resend error ${res.status}: ${errText}` };
  }

  return { ok: true as const };
}
