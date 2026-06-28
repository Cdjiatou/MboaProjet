/**
 * @file export-to-sql.ts
 * @description Script pour exporter la base de données en format SQL
 * Exécution : npx ts-node scripts/export-to-sql.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function escapeString(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'string') return escapeString(value);
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return escapeString(value.toISOString());
  if (typeof value === 'object') return escapeString(JSON.stringify(value));
  return escapeString(String(value));
}

async function exportToSQL() {
  console.log('📦 Début de l\'export SQL...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const exportDir = path.join(__dirname, '..', 'exports');
  const exportFile = path.join(exportDir, `mboa_db_export_${timestamp}.sql`);

  // Créer le dossier exports s'il n'existe pas
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  let sqlContent = `-- MBOA NEXT STAR Database Export
-- Export Date: ${new Date().toISOString()}
-- Database: mboa_db

SET CLIENT_ENCODING TO 'UTF8';
SET STANDARD_CONFORMING_STRINGS TO ON;

BEGIN;

`;

  try {
    // Export Users
    const users = await prisma.user.findMany();
    if (users.length > 0) {
      sqlContent += `\n-- Users (${users.length} records)\n`;
      for (const user of users) {
        sqlContent += `INSERT INTO "User" (id, name, email, password, role, "createdAt") VALUES (${user.id}, ${formatValue(user.name)}, ${formatValue(user.email)}, ${formatValue(user.password)}, ${formatValue(user.role)}, ${formatValue(user.createdAt)});\n`;
      }
    }

    // Export Categories
    const categories = await prisma.category.findMany();
    if (categories.length > 0) {
      sqlContent += `\n-- Categories (${categories.length} records)\n`;
      for (const category of categories) {
        sqlContent += `INSERT INTO "Category" (id, name, slug) VALUES (${category.id}, ${formatValue(category.name)}, ${formatValue(category.slug)});\n`;
      }
    }

    // Export Candidates
    const candidates = await prisma.candidate.findMany();
    if (candidates.length > 0) {
      sqlContent += `\n-- Candidates (${candidates.length} records)\n`;
      for (const candidate of candidates) {
        sqlContent += `INSERT INTO "Candidate" (id, "categoryId", "firstName", "lastName", email, phone, "birthDate", city, country, biography, "profilePhoto", "videoUrl", "socialLinks", slug, "verificationCode", status, "totalVotesCache", "createdAt", "updatedAt") VALUES (${candidate.id}, ${candidate.categoryId}, ${formatValue(candidate.firstName)}, ${formatValue(candidate.lastName)}, ${formatValue(candidate.email)}, ${formatValue(candidate.phone)}, ${formatValue(candidate.birthDate)}, ${formatValue(candidate.city)}, ${formatValue(candidate.country)}, ${formatValue(candidate.biography)}, ${formatValue(candidate.profilePhoto)}, ${formatValue(candidate.videoUrl)}, ${formatValue(candidate.socialLinks)}, ${formatValue(candidate.slug)}, ${formatValue(candidate.verificationCode)}, ${formatValue(candidate.status)}, ${candidate.totalVotesCache}, ${formatValue(candidate.createdAt)}, ${formatValue(candidate.updatedAt)});\n`;
      }
    }

    // Export Votes
    const votes = await prisma.vote.findMany();
    if (votes.length > 0) {
      sqlContent += `\n-- Votes (${votes.length} records)\n`;
      for (const vote of votes) {
        sqlContent += `INSERT INTO "Vote" (id, "candidateId", "voterIdentifier", "paymentReference", amount, status, "paidAt", "createdAt") VALUES (${vote.id}, ${vote.candidateId}, ${formatValue(vote.voterIdentifier)}, ${formatValue(vote.paymentReference)}, ${vote.amount}, ${formatValue(vote.status)}, ${formatValue(vote.paidAt)}, ${formatValue(vote.createdAt)});\n`;
      }
    }

    // Export Site Configuration
    const configs = await prisma.siteConfiguration.findMany();
    if (configs.length > 0) {
      sqlContent += `\n-- Site Configuration (${configs.length} records)\n`;
      for (const config of configs) {
        sqlContent += `INSERT INTO "SiteConfiguration" (id, "configKey", "configValue", "updatedAt") VALUES (${config.id}, ${formatValue(config.configKey)}, ${formatValue(config.configValue)}, ${formatValue(config.updatedAt)});\n`;
      }
    }

    // Export Withdrawals
    const withdrawals = await prisma.withdrawal.findMany();
    if (withdrawals.length > 0) {
      sqlContent += `\n-- Withdrawals (${withdrawals.length} records)\n`;
      for (const withdrawal of withdrawals) {
        sqlContent += `INSERT INTO "Withdrawal" (id, "requestedAmount", "feeAmount", "netAmount", status, "createdAt") VALUES (${withdrawal.id}, ${withdrawal.requestedAmount}, ${withdrawal.feeAmount}, ${withdrawal.netAmount}, ${formatValue(withdrawal.status)}, ${formatValue(withdrawal.createdAt)});\n`;
      }
    }

    // Export Sponsors
    const sponsors = await prisma.sponsor.findMany();
    if (sponsors.length > 0) {
      sqlContent += `\n-- Sponsors (${sponsors.length} records)\n`;
      for (const sponsor of sponsors) {
        sqlContent += `INSERT INTO "Sponsor" (id, name, description, "websiteUrl", "logoUrl", tier, "displayOrder", "isActive", "createdAt", "updatedAt") VALUES (${sponsor.id}, ${formatValue(sponsor.name)}, ${formatValue(sponsor.description)}, ${formatValue(sponsor.websiteUrl)}, ${formatValue(sponsor.logoUrl)}, ${formatValue(sponsor.tier)}, ${sponsor.displayOrder}, ${sponsor.isActive}, ${formatValue(sponsor.createdAt)}, ${formatValue(sponsor.updatedAt)});\n`;
      }
    }

    // Export Sponsor Media
    const media = await prisma.sponsorMedia.findMany();
    if (media.length > 0) {
      sqlContent += `\n-- Sponsor Media (${media.length} records)\n`;
      for (const m of media) {
        sqlContent += `INSERT INTO "SponsorMedia" (id, "sponsorId", "mediaType", "mediaUrl", "thumbnailUrl", title, description, "displayOrder", "isActive", "createdAt", "updatedAt") VALUES (${m.id}, ${m.sponsorId}, ${formatValue(m.mediaType)}, ${formatValue(m.mediaUrl)}, ${formatValue(m.thumbnailUrl)}, ${formatValue(m.title)}, ${formatValue(m.description)}, ${m.displayOrder}, ${m.isActive}, ${formatValue(m.createdAt)}, ${formatValue(m.updatedAt)});\n`;
      }
    }

    // Update sequences
    sqlContent += `\n-- Update sequences\n`;
    if (users.length > 0) {
      const maxUserId = Math.max(...users.map(u => u.id));
      sqlContent += `SELECT setval('"User_id_seq"', ${maxUserId}, true);\n`;
    }
    if (categories.length > 0) {
      const maxCategoryId = Math.max(...categories.map(c => c.id));
      sqlContent += `SELECT setval('"Category_id_seq"', ${maxCategoryId}, true);\n`;
    }
    if (candidates.length > 0) {
      const maxCandidateId = Math.max(...candidates.map(c => c.id));
      sqlContent += `SELECT setval('"Candidate_id_seq"', ${maxCandidateId}, true);\n`;
    }
    if (votes.length > 0) {
      const maxVoteId = Math.max(...votes.map(v => v.id));
      sqlContent += `SELECT setval('"Vote_id_seq"', ${maxVoteId}, true);\n`;
    }
    if (sponsors.length > 0) {
      const maxSponsorId = Math.max(...sponsors.map(s => s.id));
      sqlContent += `SELECT setval('"Sponsor_id_seq"', ${maxSponsorId}, true);\n`;
    }
    if (media.length > 0) {
      const maxMediaId = Math.max(...media.map(m => m.id));
      sqlContent += `SELECT setval('"SponsorMedia_id_seq"', ${maxMediaId}, true);\n`;
    }

    sqlContent += `\nCOMMIT;

-- Export completed successfully
`;

    // Écrire le fichier SQL
    fs.writeFileSync(exportFile, sqlContent, 'utf-8');

    console.log('✅ Export SQL réussi !\n');
    console.log('📋 Statistiques:');
    console.log('━'.repeat(50));
    console.log(`👥 Utilisateurs:       ${users.length}`);
    console.log(`📂 Catégories:         ${categories.length}`);
    console.log(`🎤 Candidats:          ${candidates.length}`);
    console.log(`🗳️  Votes:              ${votes.length}`);
    console.log(`⚙️  Configurations:     ${configs.length}`);
    console.log(`💰 Retraits:           ${withdrawals.length}`);
    console.log(`🤝 Sponsors:           ${sponsors.length}`);
    console.log(`🖼️  Médias sponsors:    ${media.length}`);
    console.log('━'.repeat(50));
    console.log(`\n💾 Fichier SQL: ${exportFile}`);
    console.log(`📊 Taille: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
}

async function main() {
  try {
    await exportToSQL();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
