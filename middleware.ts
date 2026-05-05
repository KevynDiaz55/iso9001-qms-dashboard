import { withAuth } from 'next-auth/middleware';

export default withAuth();

export const config = {
  matcher: ['/((?!login|forgot-password|reset-password|api/auth|_next|favicon.ico).*)'],
};

