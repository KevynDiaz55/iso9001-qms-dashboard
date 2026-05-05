/**
 * Upsert TMAC accounts into the current DATABASE_URL database.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="postgresql://..."
 *   npm.cmd exec ts-node prisma/add-tmac-users.ts
 *
 * Optional: $env:TMAC_BOOTSTRAP_PASSWORD="YourStrongPassword!" (min 8 chars)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type Role = 'admin' | 'consultant' | 'viewer';

const ACCOUNTS: { email: string; name: string; role: Role }[] = [
  { email: 'kidiaz2@miners.utep.edu', name: 'Kevyn Diaz', role: 'admin' },
  { email: 'rramirez72@miners.utep.edu', name: 'Ricardo Ramirez', role: 'admin' },
  { email: 'rramirezriver@utep.edu', name: 'Ricardo Ramirez', role: 'admin' },
  { email: 'revivas2@utep.edu', name: 'Rolando Vivas', role: 'admin' },
  { email: 'ajlopes@utep.edu', name: 'Amit Lopes', role: 'admin' },
  { email: 'cmsanchez15@miners.utep.edu', name: 'Catalina Sanchez', role: 'admin' },
  { email: 'mrochoa3@miners.utep.edu', name: '', role: 'consultant' },
  { email: 'daperezgutierr@miners.utep.edu', name: 'Diego Perez', role: 'admin' },
  { email: 'ohsalcedo@utep.edu', name: 'Oscar Salcedo', role: 'admin' },
];

async function upsertUser(emailRaw: string, name: string, role: Role, hashedPassword: string) {
  const email = emailRaw.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  const data = {
    email,
    name: name || null,
    hashedPassword,
    role,
  };

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data,
      select: { id: true, email: true, role: true },
    });
    return { user, created: false as const };
  }

  const user = await prisma.user.create({
    data,
    select: { id: true, email: true, role: true },
  });
  return { user, created: true as const };
}

async function linkConsultantToAllCompanies(userId: string) {
  const companies = await prisma.company.findMany({ select: { id: true } });
  for (const { id } of companies) {
    await prisma.userCompany.upsert({
      where: { userId_companyId: { userId, companyId: id } },
      create: { userId, companyId: id, roleInCompany: 'consultant' },
      update: { roleInCompany: 'consultant' },
    });
  }
}

async function main() {
  const password = process.env.TMAC_BOOTSTRAP_PASSWORD?.trim() || 'Password123!';
  if (password.length < 8) {
    throw new Error('TMAC_BOOTSTRAP_PASSWORD must be at least 8 characters.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  for (const row of ACCOUNTS) {
    const { user, created } = await upsertUser(row.email, row.name, row.role, hashedPassword);
    console.log(`${created ? 'Created' : 'Updated'} ${user.email} (${user.role})`);
    if (user.role === 'consultant') {
      await linkConsultantToAllCompanies(user.id);
      console.log(`  Linked to all companies as consultant`);
    }
  }

  console.log('\nBootstrap password:', password === 'Password123!' ? 'Password123! (change in production)' : '(from TMAC_BOOTSTRAP_PASSWORD)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
