import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const emailInput = process.env.RESET_EMAIL?.trim().toLowerCase();
  const password = process.env.RESET_PASSWORD?.trim();

  if (!emailInput) {
    throw new Error('Missing RESET_EMAIL env var.');
  }
  if (!password || password.length < 8) {
    throw new Error('RESET_PASSWORD must be set and at least 8 characters.');
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: emailInput, mode: 'insensitive' } },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`User not found: ${emailInput}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: emailInput,
      hashedPassword,
    },
  });

  console.log(`Password reset for ${emailInput}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
