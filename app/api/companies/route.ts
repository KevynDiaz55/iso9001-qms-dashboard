import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getServerAuthSession, requireRole } from '../../../lib/auth';
import { BASE_DOCUMENT_TEMPLATES } from '../../../lib/base-document-templates';

function jsonError(message: string, details?: string, status = 500) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status },
  );
}

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role as string | undefined;

    if (role === 'admin') {
      const companies = await prisma.company.findMany({
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ companies });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        companies: {
          include: { company: true },
        },
      },
    });

    const companies = user?.companies.map((uc) => uc.company) ?? [];
    return NextResponse.json({ companies });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const body = await req.json();
    const creatorId = (session.user as { id?: string }).id;
    if (!creatorId) {
      return NextResponse.json({ error: 'User session missing id' }, { status: 401 });
    }

    const [requirements, levels] = await Promise.all([
      prisma.requirement.findMany({
        include: { defaultLevel: true },
        orderBy: { id: 'asc' },
      }),
      prisma.documentLevel.findMany({ orderBy: { order: 'asc' } }),
    ]);

    const company = await prisma.company.create({
      data: {
        name: body.name,
        industry: body.industry ?? null,
        location: body.location ?? '',
        tmacCoach: body.tmacCoach ?? null,
        status: body.status ?? 'not contacted',
        address: body.address ?? null,
        contactName: body.contactName ?? null,
        contactEmail: body.contactEmail ?? null,
        contactPhone: body.contactPhone ?? null,
      },
    });

    await prisma.userCompany.create({
      data: {
        userId: creatorId,
        companyId: company.id,
        roleInCompany: 'owner',
      },
    });

    const companyRequirements: { id: number; levelId: number }[] = [];
    for (const requirement of requirements) {
      const levelId = requirement.defaultLevelId;
      const cr = await prisma.companyRequirement.create({
        data: {
          companyId: company.id,
          requirementId: requirement.id,
          levelId,
          status: 'not_started',
          priority: 'medium',
          lastUpdatedAt: new Date(),
        },
      });
      companyRequirements.push(cr);
    }

    for (const template of BASE_DOCUMENT_TEMPLATES) {
      const level = levels.find((l) => l.order === template.levelOrder);
      if (!level) continue;
      const crForLevel = companyRequirements.find((cr) => cr.levelId === level.id);
      if (!crForLevel) continue;
      for (const name of template.names) {
        await prisma.document.create({
          data: {
            companyRequirementId: crForLevel.id,
            name,
            description: `Base template: ${name}`,
            levelId: level.id,
            status: 'pending',
            cloudProvider: 'google_drive',
            cloudUrl: `https://drive.google.com/drive/folders/${company.id}`,
            version: '1.0',
            createdById: creatorId,
            approvedById: null,
          },
        });
      }
    }

    await prisma.companySettings.create({
      data: {
        companyId: company.id,
        mainCloudProvider: 'google_drive',
        mainCloudUrl: `https://drive.google.com/drive/folders/${company.id}`,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonError('Internal Server Error', message);
  }
}
