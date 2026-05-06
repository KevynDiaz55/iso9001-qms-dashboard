import { getServerSession, NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email.toLowerCase();
        const allowed =
          email.endsWith('@miners.utep.edu') || email.endsWith('@utep.edu');
        if (!allowed) {
          throw new Error('Only @miners.utep.edu and @utep.edu accounts are allowed.');
        }

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        const sessionUser: User = {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
        };

        return {
          ...sessionUser,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error custom field
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error custom field
        session.user.id = token.sub;
        // @ts-expect-error custom field
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(allowed: Array<'admin' | 'consultant' | 'viewer'>) {
  const session = await requireAuth();
  // @ts-expect-error custom role
  const role = session.user.role as string | undefined;
  if (!role || !allowed.includes(role as any)) {
    throw new Error('Forbidden');
  }
  return session;
}

