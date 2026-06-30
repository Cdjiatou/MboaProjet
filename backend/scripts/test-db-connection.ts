import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Testing connection to Supabase via Prisma...');
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('Connection successful! Query result:', result);
  } catch (error) {
    console.error('Connection failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
