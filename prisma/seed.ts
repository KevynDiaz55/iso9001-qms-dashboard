import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Base L1–L4 document template names (must match lib/base-document-templates.ts). */
const BASE_DOCUMENT_TEMPLATES: { levelOrder: number; names: string[] }[] = [
  { levelOrder: 1, names: ['L1-01_QMS Diagram (PowerPoint)', 'L1-02_Quality Overview (Word)', 'L1-03_SWOT Analysis (PowerPoint)'] },
  { levelOrder: 2, names: ['L2-01_Internal Audits', 'L2-02_Documented Information', 'L2-03_Non-Conformance', 'L2-04_Corrective Actions', 'L2-05_Sales', 'L2-06_Machining', 'L2-07_Final Inspection', 'L2-08_Purchasing', 'L2-09_Calibration'] },
  { levelOrder: 3, names: ['L3-01_Supplier Evaluation (Word)', 'L3-02_Organizational Knowledge (Word)', 'L3-03_Job Description CEO (Word)', 'L3-04_Job Description Manager (Word)', 'L3-05_Job Description Assistant (Word)', 'L3-06_Risk Analysis FMEA (Excel)'] },
  { levelOrder: 4, names: ['L4-01_Master List of Documents', 'L4-02_Master List of Records', 'L4-03_Internal Audit Checklist', 'L4-04_Internal Audit Schedule', 'L4-05_Internal Audit Report', 'L4-06_Management Review Agenda', 'L4-07_Non-Conformance Report', 'L4-08_Corrective Action Request', 'L4-09_Corrective Action Log', 'L4-10_Supplier Evaluation Form', 'L4-11_Approved Supplier List', 'L4-12_Customer Survey', 'L4-13_Calibration Log', 'L4-14_DIR Inspection', 'L4-15_Training Log', 'Records Folder'] },
];

const SHARED_ADMIN_PASSWORD = 'Password123!';

const ADMIN_USERS = [
  { name: 'Kevyn Diaz', email: 'Kidiaz2@miners.utep.edu' },
  { name: 'Catalina Sanchez', email: 'cmsanchez15@miners.utep.edu' },
  { name: 'Edrick Gamez', email: 'egamez8@miners.utep.edu' },
  { name: 'Diego Perez', email: 'daperezgutierr@miners.utep.edu' },
  { name: 'Ricardo Ramirez', email: 'rramirez72@miners.utep.edu' },
  { name: 'Rolando Vivas', email: 'revivas2@utep.edu' },
  { name: 'Amit Lopes', email: 'ajlopes@utep.edu' },
  { name: 'Oscar Salcedo', email: 'ohsalcedo@utep.edu' },
];

async function createUsers() {
  const hashedAdmin = await bcrypt.hash(SHARED_ADMIN_PASSWORD, 10);
  const hashedConsultant = await bcrypt.hash('ConsultantPassword123!', 10);
  const hashedViewer = await bcrypt.hash('ViewerPassword123!', 10);

  const admins: { id: string }[] = [];
  for (const u of ADMIN_USERS) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        hashedPassword: hashedAdmin,
        role: 'admin',
      },
    });
    admins.push(user);
  }

  const consultant1 = await prisma.user.create({
    data: {
      name: 'Senior Consultant',
      email: 'consultant@miners.utep.edu',
      hashedPassword: hashedConsultant,
      role: 'consultant',
    },
  });

  const consultantStudent = await prisma.user.create({
    data: {
      name: 'TMAC Student',
      email: 'tmac.student@miners.utep.edu',
      hashedPassword: hashedAdmin,
      role: 'consultant',
    },
  });

  const viewer1 = await prisma.user.create({
    data: {
      name: 'Viewer One',
      email: 'viewer1@miners.utep.edu',
      hashedPassword: hashedViewer,
      role: 'viewer',
    },
  });

  return {
    admins,
    adminFirst: admins[0],
    consultant1,
    consultantStudent,
    viewer1,
  };
}

async function createDocumentLevels() {
  const levels = [
    {
      name: 'Level 1 – Policies',
      shortName: 'L1',
      description: 'High-level quality policies and manual.',
      order: 1,
    },
    {
      name: 'Level 2 – Processes',
      shortName: 'L2',
      description: 'Core and support process descriptions.',
      order: 2,
    },
    {
      name: 'Level 3 – Procedures & Work Instructions',
      shortName: 'L3',
      description: 'Detailed procedures, SOPs, and work instructions.',
      order: 3,
    },
    {
      name: 'Level 4 – Records & Forms',
      shortName: 'L4',
      description: 'Records, logs, forms, and evidence of implementation.',
      order: 4,
    },
  ];

  const created = [];
  for (const level of levels) {
    created.push(await prisma.documentLevel.create({ data: level }));
  }
  return created;
}

async function createIsoAreasAndRequirements(levels: { id: number; shortName: string }[]) {
  const isoAreasData = [
    { clauseCode: '4.1', title: 'Understanding the organization and its context' },
    { clauseCode: '4.2', title: 'Understanding the needs and expectations of interested parties' },
    { clauseCode: '4.3', title: 'Determining the scope of the quality management system' },
    { clauseCode: '5.1', title: 'Leadership and commitment' },
    { clauseCode: '5.3', title: 'Organizational roles, responsibilities and authorities' },
    { clauseCode: '6.1', title: 'Actions to address risks and opportunities' },
    { clauseCode: '6.2', title: 'Quality objectives and planning to achieve them' },
    { clauseCode: '7.1', title: 'Resources' },
    { clauseCode: '7.2', title: 'Competence' },
    { clauseCode: '7.5', title: 'Documented information' },
    { clauseCode: '8.5', title: 'Production and service provision' },
    { clauseCode: '9.1', title: 'Monitoring, measurement, analysis and evaluation' },
    { clauseCode: '9.2', title: 'Internal audit' },
    { clauseCode: '9.3', title: 'Management review' },
    { clauseCode: '10.2', title: 'Nonconformity and corrective action' },
  ];

  const isoAreas = [];
  for (const area of isoAreasData) {
    isoAreas.push(
      await prisma.isoArea.create({
        data: {
          ...area,
          description: `${area.title} as defined in ISO 9001:2015.`,
        },
      }),
    );
  }

  const requirementsSeed: Array<{
    isoClause: string;
    title: string;
    defaultLevelShort: string;
  }> = [
    { isoClause: '4.1', title: 'Document organizational context and key issues', defaultLevelShort: 'L1' },
    { isoClause: '4.2', title: 'Identify interested parties and their requirements', defaultLevelShort: 'L1' },
    { isoClause: '4.3', title: 'Define and approve QMS scope statement', defaultLevelShort: 'L1' },
    { isoClause: '5.1', title: 'Issue quality policy approved by top management', defaultLevelShort: 'L1' },
    { isoClause: '5.3', title: 'Define roles, responsibilities and authorities', defaultLevelShort: 'L2' },
    { isoClause: '6.1', title: 'Establish risk and opportunity register', defaultLevelShort: 'L2' },
    { isoClause: '6.2', title: 'Define quality objectives and KPIs', defaultLevelShort: 'L1' },
    { isoClause: '7.1', title: 'Determine resource needs and infrastructure', defaultLevelShort: 'L2' },
    { isoClause: '7.2', title: 'Define competence requirements and training plan', defaultLevelShort: 'L3' },
    { isoClause: '7.5', title: 'Establish documented information control procedure', defaultLevelShort: 'L3' },
    { isoClause: '8.5', title: 'Create key operational procedures and work instructions', defaultLevelShort: 'L3' },
    { isoClause: '8.5', title: 'Define product/service realization controls', defaultLevelShort: 'L3' },
    { isoClause: '9.1', title: 'Define monitoring and measurement plan', defaultLevelShort: 'L2' },
    { isoClause: '9.2', title: 'Create internal audit program and checklist', defaultLevelShort: 'L3' },
    { isoClause: '9.3', title: 'Define management review agenda and inputs', defaultLevelShort: 'L2' },
    { isoClause: '10.2', title: 'Establish corrective action process', defaultLevelShort: 'L3' },
    { isoClause: '10.2', title: 'Create corrective action log template', defaultLevelShort: 'L4' },
    { isoClause: '7.5', title: 'Define document and record retention matrix', defaultLevelShort: 'L2' },
    { isoClause: '7.1', title: 'Maintain calibration and maintenance records', defaultLevelShort: 'L4' },
    { isoClause: '9.1', title: 'Maintain KPI trend charts and dashboards', defaultLevelShort: 'L4' },
    { isoClause: '8.5', title: 'Maintain production or service records', defaultLevelShort: 'L4' },
    { isoClause: '7.2', title: 'Maintain training records and competency evidence', defaultLevelShort: 'L4' },
  ];

  // Ensure we have at least 40–60 requirements by repeating patterns with slight variations
  const extendedRequirements = [...requirementsSeed];
  while (extendedRequirements.length < 45) {
    for (const base of requirementsSeed) {
      if (extendedRequirements.length >= 50) break;
      extendedRequirements.push({
        ...base,
        title: `${base.title} (${extendedRequirements.length + 1})`,
      });
    }
  }

  const requirements = [];
  for (const req of extendedRequirements) {
    const area = isoAreas.find((a) => a.clauseCode === req.isoClause);
    const level = levels.find((l) => l.shortName === req.defaultLevelShort);
    if (!area || !level) continue;
    requirements.push(
      await prisma.requirement.create({
        data: {
          isoAreaId: area.id,
          title: req.title,
          description: req.title,
          defaultLevelId: level.id,
        },
      }),
    );
  }

  return { isoAreas, requirements };
}

async function createCompaniesAndAssignments(users: ReturnType<typeof createUsers> extends Promise<infer T> ? T : never) {
  const { admins, consultant1, consultantStudent, viewer1 } = users as { admins: Array<{ id: string; email?: string }>; consultant1: { id: string }; consultantStudent: { id: string }; viewer1: { id: string } };
  const ricardo = admins.find((a) => a.email === 'rramirez72@miners.utep.edu') ?? admins[0];
  const coachUserId = ricardo.id;

  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'AconityUS',
        industry: 'Manufacturing',
        location: 'El Paso, TX',
        tmacCoach: 'Ricardo Ramirez',
        status: 'in progress',
        address: null,
        contactName: 'Jorge Mireles',
        contactEmail: 'mireles@aconityus.com',
        contactPhone: null,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Five Axis Manufacturing',
        industry: 'Manufacturing',
        location: 'El Paso, TX',
        tmacCoach: 'Ricardo Ramirez',
        status: 'in progress',
        address: null,
        contactName: 'Jesus Antonio de la Rosa',
        contactEmail: 'tmd-co@hotmail.com',
        contactPhone: null,
      },
    }),
    prisma.company.create({
      data: {
        name: 'PM Technologies',
        industry: '3D Printing',
        location: 'El Paso, TX',
        tmacCoach: 'Ricardo Ramirez',
        status: 'in progress',
        address: null,
        contactName: 'Philip Morton',
        contactEmail: 'philip.morton@pmtechs.com',
        contactPhone: null,
      },
    }),
  ]);

  for (const company of companies) {
    await prisma.userCompany.createMany({
      data: [
        { userId: coachUserId, companyId: company.id, roleInCompany: 'owner' },
        { userId: consultant1.id, companyId: company.id, roleInCompany: 'consultant' },
        { userId: consultantStudent.id, companyId: company.id, roleInCompany: 'consultant' },
        { userId: viewer1.id, companyId: company.id, roleInCompany: 'viewer' },
      ],
    });
  }

  return companies;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function createCompanyRequirementsAndDocuments(
  companies: Awaited<ReturnType<typeof createCompaniesAndAssignments>>,
  requirements: Awaited<ReturnType<typeof createIsoAreasAndRequirements>>['requirements'],
  levels: { id: number; shortName: string; order?: number }[],
  consultants: { id: string }[],
  creatorId: string,
) {
  const statuses = ['not_started', 'in_progress', 'under_review', 'approved'];
  const priorities = ['low', 'medium', 'high'];
  const docStatuses = ['draft', 'submitted', 'approved', 'obsolete'];
  const providers = ['google_drive', 'sharepoint', 'dropbox', 'other'];

  for (const company of companies) {
    const companyRequirements: { id: number; levelId: number }[] = [];
    for (const requirement of requirements) {
      const status = pickRandom(statuses);
      const priority = pickRandom(priorities);
      const owner = Math.random() < 0.7 ? pickRandom(consultants) : null;
      const dueDate = Math.random() < 0.8 ? new Date(Date.now() + (Math.random() * 120 - 30) * 24 * 60 * 60 * 1000) : null;
      const level = levels.find((l) => l.id === requirement.defaultLevelId) ?? pickRandom(levels);

      const cr = await prisma.companyRequirement.create({
        data: {
          companyId: company.id,
          requirementId: requirement.id,
          levelId: level.id,
          status,
          priority,
          ownerUserId: owner?.id ?? null,
          dueDate,
          lastUpdatedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          notes: 'Initial assessment based on TMAC engagement.',
        },
      });
      companyRequirements.push(cr);
    }

    // Base document templates per level
    for (const template of BASE_DOCUMENT_TEMPLATES) {
      const level = levels.find((l) => l.order === template.levelOrder || l.shortName === `L${template.levelOrder}`);
      if (!level) continue;
      const crForLevel = companyRequirements.find((cr) => cr.levelId === level.id);
      if (!crForLevel) continue;
      for (let i = 0; i < template.names.length; i++) {
        const name = template.names[i];
        await prisma.document.create({
          data: {
            companyRequirementId: crForLevel.id,
            name,
            description: `Base template: ${name}`,
            levelId: level.id,
            status: 'pending',
            cloudProvider: 'google_drive',
            cloudUrl: `https://drive.google.com/drive/folders/${company.id}/${encodeURIComponent(name)}`,
            version: '1.0',
            createdById: creatorId,
            approvedById: null,
          },
        });
      }
    }

    // Settings
    await prisma.companySettings.create({
      data: {
        companyId: company.id,
        mainCloudProvider: 'google_drive',
        mainCloudUrl: `https://drive.google.com/drive/folders/${company.id}`,
        implementationStartDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        targetCertificationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function createPlaybook(companies: Awaited<ReturnType<typeof createCompaniesAndAssignments>>) {
  const steps = [
    {
      order: 1,
      title: 'Define scope & context',
      description: 'Clarify organizational context, interested parties, and scope of QMS.',
    },
    {
      order: 2,
      title: 'Leadership & planning',
      description: 'Engage leadership, define policy, objectives, and risk planning.',
    },
    {
      order: 3,
      title: 'Documentation & process mapping',
      description: 'Map processes, create policies and procedures, and define responsibilities.',
    },
    {
      order: 4,
      title: 'Implementation & training',
      description: 'Deploy processes, conduct training, and begin using QMS artifacts.',
    },
    {
      order: 5,
      title: 'Internal audit & corrective actions',
      description: 'Plan and execute internal audits, address nonconformities and corrective actions.',
    },
    {
      order: 6,
      title: 'Certification audit preparation',
      description: 'Finalize evidence, perform readiness review, and support certification audit.',
    },
  ];

  const createdSteps = [];
  for (const step of steps) {
    createdSteps.push(await prisma.playbookStep.create({ data: step }));
  }

  for (const company of companies) {
    for (const step of createdSteps) {
      const taskTemplates = [
        `Complete key activities for "${step.title}"`,
        `Review progress for "${step.title}" with company leadership`,
        `Update TMAC tracker for "${step.title}"`,
      ];

      for (const title of taskTemplates) {
        await prisma.companyPlaybookTask.create({
          data: {
            companyId: company.id,
            stepId: step.id,
            title,
            description: `Checklist item for ${step.title} phase.`,
            isDone: Math.random() < 0.4,
            lastUpdatedAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }
}

async function main() {
  console.log('Seeding database...');

  await prisma.passwordResetToken.deleteMany({});
  await prisma.meetingLog.deleteMany({});
  await prisma.companyPlaybookTask.deleteMany({});
  await prisma.playbookStep.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.companySettings.deleteMany({});
  await prisma.companyRequirement.deleteMany({});
  await prisma.userCompany.deleteMany({});
  await prisma.requirement.deleteMany({});
  await prisma.isoArea.deleteMany({});
  await prisma.documentLevel.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  const users = await createUsers();
  const levels = await createDocumentLevels();
  const { requirements } = await createIsoAreasAndRequirements(levels);
  const companies = await createCompaniesAndAssignments(users);

  await createCompanyRequirementsAndDocuments(
    companies,
    requirements,
    levels,
    [{ id: users.consultant1.id }, { id: users.consultantStudent.id }],
    users.adminFirst.id,
  );

  await createPlaybook(companies);

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

