import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerAuthSession, requireRole } from '../../../../lib/auth';

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { companyId } = await params;
  const settings = await prisma.companySettings.findUnique({
    where: { companyId },
  });

  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  await requireRole(['admin', 'consultant']);
  const body = await req.json();
  const { companyId } = await params;

  const updated = await prisma.companySettings.upsert({
    where: { companyId },
    update: {
      mainCloudProvider: body.mainCloudProvider,
      mainCloudUrl: body.mainCloudUrl,
      implementationStartDate: body.implementationStartDate
        ? new Date(body.implementationStartDate)
        : null,
      targetCertificationDate: body.targetCertificationDate
        ? new Date(body.targetCertificationDate)
        : null,
    },
    create: {
      companyId,
      mainCloudProvider: body.mainCloudProvider,
      mainCloudUrl: body.mainCloudUrl,
      implementationStartDate: body.implementationStartDate
        ? new Date(body.implementationStartDate)
        : null,
      targetCertificationDate: body.targetCertificationDate
        ? new Date(body.targetCertificationDate)
        : null,
    },
  });

  return NextResponse.json({ settings: updated });
}

