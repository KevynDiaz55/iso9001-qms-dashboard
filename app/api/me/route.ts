import { NextResponse } from 'next/server';
import { getServerAuthSession } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        companies: {
          include: { company: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    let companies: { id: string; name: string; location: string | null; industry: string | null }[];
    if (user.role === 'admin') {
      const allCompanies = await prisma.company.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, location: true, industry: true },
      });
      companies = allCompanies;
    } else {
      companies = user.companies.map((uc) => ({
        id: uc.company.id,
        name: uc.company.name,
        location: uc.company.location,
        industry: uc.company.industry,
      }));
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companies,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 },
    );
  }
}

