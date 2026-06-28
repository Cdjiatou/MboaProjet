/**
 * Répare la liste sponsors en DB en fusionnant avec les partenaires par défaut.
 * Usage : npx ts-node scripts/repair-sponsors.ts
 */
import { repairSponsorsConfigIfNeeded } from '../src/services/admin.service';
import prisma from '../src/utils/prisma';

async function main() {
  const repaired = await repairSponsorsConfigIfNeeded();
  console.log(`✅ ${repaired.length} sponsor(s) enregistré(s) :`);
  for (const s of repaired) {
    console.log(`  - ${s.name}`);
  }
}

main().finally(() => prisma.$disconnect());
