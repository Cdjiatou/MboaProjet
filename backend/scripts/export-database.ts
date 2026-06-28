/**
 * @file export-database.ts
 * @description Script pour exporter toutes les données de la base de données
 * Exécution : npx ts-node scripts/export-database.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('📦 Début de l\'export de la base de données...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const exportDir = path.join(__dirname, '..', 'exports');
  const exportFile = path.join(exportDir, `mboa_db_export_${timestamp}.json`);

  // Créer le dossier exports s'il n'existe pas
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  try {
    // Exporter toutes les tables
    const data = {
      exportDate: new Date().toISOString(),
      database: 'mboa_db',
      tables: {
        users: await prisma.user.findMany(),
        categories: await prisma.category.findMany(),
        candidates: await prisma.candidate.findMany(),
        votes: await prisma.vote.findMany(),
        siteConfiguration: await prisma.siteConfiguration.findMany(),
        withdrawals: await prisma.withdrawal.findMany(),
        sponsors: await prisma.sponsor.findMany({
          include: { media: true },
        }),
      },
      statistics: {
        usersCount: await prisma.user.count(),
        categoriesCount: await prisma.category.count(),
        candidatesCount: await prisma.candidate.count(),
        votesCount: await prisma.vote.count(),
        sponsorsCount: await prisma.sponsor.count(),
        mediaCount: await prisma.sponsorMedia.count(),
      },
    };

    // Écrire les données dans un fichier JSON
    fs.writeFileSync(exportFile, JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ Export réussi !\n');
    console.log('📋 Statistiques:');
    console.log('━'.repeat(50));
    console.log(`👥 Utilisateurs:       ${data.statistics.usersCount}`);
    console.log(`📂 Catégories:         ${data.statistics.categoriesCount}`);
    console.log(`🎤 Candidats:          ${data.statistics.candidatesCount}`);
    console.log(`🗳️  Votes:              ${data.statistics.votesCount}`);
    console.log(`🤝 Sponsors:           ${data.statistics.sponsorsCount}`);
    console.log(`🖼️  Médias sponsors:    ${data.statistics.mediaCount}`);
    console.log('━'.repeat(50));
    console.log(`\n💾 Fichier d'export: ${exportFile}`);
    console.log(`📊 Taille du fichier: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
}

async function main() {
  try {
    await exportDatabase();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
