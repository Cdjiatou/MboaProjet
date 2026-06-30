/**
 * @file migrate-to-firebase.ts
 * @description Script de migration PostgreSQL → Firebase Firestore
 * 
 * Ce script migre toutes les données depuis l'export JSON PostgreSQL
 * vers Firebase Firestore en conservant la structure et les relations.
 */

import { db, admin } from '../src/config/firebase';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationStats {
  users: number;
  categories: number;
  candidates: number;
  votes: number;
  siteConfig: number;
  withdrawals: number;
  sponsors: number;
  sponsorMedia: number;
}

async function migrateToFirebase() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MIGRATION POSTGRESQL → FIREBASE FIRESTORE');
  console.log('='.repeat(60));
  console.log('\n📦 Projet: MBOA NEXT STAR');
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}\n`);

  // Trouver le fichier d'export le plus récent
  const exportsDir = path.join(__dirname, '../exports');
  const exportFiles = fs.readdirSync(exportsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  if (exportFiles.length === 0) {
    console.error('❌ Aucun fichier d\'export JSON trouvé dans backend/exports/');
    console.error('💡 Exécutez d\'abord: npx tsx scripts/export-database.ts\n');
    process.exit(1);
  }

  const exportPath = path.join(exportsDir, exportFiles[0]);
  console.log(`📁 Fichier d'export: ${exportFiles[0]}`);
  console.log(`📏 Taille: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB\n`);

  // Charger l'export JSON
  const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  const stats: MigrationStats = {
    users: 0,
    categories: 0,
    candidates: 0,
    votes: 0,
    siteConfig: 0,
    withdrawals: 0,
    sponsors: 0,
    sponsorMedia: 0,
  };

  try {
    // Migration des utilisateurs
    console.log('👥 Migration des utilisateurs...');
    if (data.tables.users && data.tables.users.length > 0) {
      for (const user of data.tables.users) {
        await db.collection('users').doc(user.id.toString()).set({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(user.createdAt))
        });
        stats.users++;
      }
      console.log(`   ✅ ${stats.users} utilisateur(s) migré(s)`);
    } else {
      console.log('   ⚠️  Aucun utilisateur à migrer');
    }

    // Migration des catégories
    console.log('\n📂 Migration des catégories...');
    if (data.tables.categories && data.tables.categories.length > 0) {
      for (const category of data.tables.categories) {
        await db.collection('categories').doc(category.id.toString()).set({
          id: category.id.toString(),
          name: category.name,
          slug: category.slug
        });
        stats.categories++;
      }
      console.log(`   ✅ ${stats.categories} catégorie(s) migrée(s)`);
    } else {
      console.log('   ⚠️  Aucune catégorie à migrer');
    }

    // Migration des candidats
    console.log('\n🎤 Migration des candidats...');
    if (data.tables.candidates && data.tables.candidates.length > 0) {
      for (const candidate of data.tables.candidates) {
        await db.collection('candidates').doc(candidate.id.toString()).set({
          id: candidate.id.toString(),
          categoryId: candidate.categoryId.toString(),
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          birthDate: candidate.birthDate ? admin.firestore.Timestamp.fromDate(new Date(candidate.birthDate)) : null,
          city: candidate.city || null,
          country: candidate.country || null,
          biography: candidate.biography || null,
          profilePhoto: candidate.profilePhoto || null,
          videoUrl: candidate.videoUrl || null,
          socialLinks: candidate.socialLinks || null,
          slug: candidate.slug || null,
          verificationCode: candidate.verificationCode || null,
          status: candidate.status,
          totalVotesCache: candidate.totalVotesCache || 0,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(candidate.createdAt)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(candidate.updatedAt))
        });
        stats.candidates++;
      }
      console.log(`   ✅ ${stats.candidates} candidat(s) migré(s)`);
    } else {
      console.log('   ⚠️  Aucun candidat à migrer');
    }

    // Migration des votes
    console.log('\n🗳️  Migration des votes...');
    if (data.tables.votes && data.tables.votes.length > 0) {
      for (const vote of data.tables.votes) {
        await db.collection('votes').doc(vote.id.toString()).set({
          id: vote.id.toString(),
          candidateId: vote.candidateId.toString(),
          voterIdentifier: vote.voterIdentifier,
          paymentReference: vote.paymentReference,
          amount: vote.amount,
          paymentMethod: vote.paymentMethod || null,
          maviansQuoteId: vote.maviansQuoteId || null,
          maviansPtn: vote.maviansPtn || null,
          paymentUrl: vote.paymentUrl || null,
          status: vote.status,
          paidAt: vote.paidAt ? admin.firestore.Timestamp.fromDate(new Date(vote.paidAt)) : null,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(vote.createdAt))
        });
        stats.votes++;
      }
      console.log(`   ✅ ${stats.votes} vote(s) migré(s)`);
    } else {
      console.log('   ⚠️  Aucun vote à migrer');
    }

    // Migration de la configuration du site
    console.log('\n⚙️  Migration de la configuration du site...');
    if (data.tables.site_configuration && data.tables.site_configuration.length > 0) {
      for (const config of data.tables.site_configuration) {
        await db.collection('siteConfig').doc(config.configKey).set({
          key: config.configKey,
          value: config.configValue,
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(config.updatedAt))
        });
        stats.siteConfig++;
      }
      console.log(`   ✅ ${stats.siteConfig} configuration(s) migrée(s)`);
    } else {
      console.log('   ⚠️  Aucune configuration à migrer');
    }

    // Migration des retraits
    console.log('\n💰 Migration des retraits...');
    if (data.tables.withdrawals && data.tables.withdrawals.length > 0) {
      for (const withdrawal of data.tables.withdrawals) {
        await db.collection('withdrawals').doc(withdrawal.id.toString()).set({
          id: withdrawal.id.toString(),
          requestedAmount: withdrawal.requestedAmount,
          feeAmount: withdrawal.feeAmount,
          netAmount: withdrawal.netAmount,
          status: withdrawal.status,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(withdrawal.createdAt))
        });
        stats.withdrawals++;
      }
      console.log(`   ✅ ${stats.withdrawals} retrait(s) migré(s)`);
    } else {
      console.log('   ⚠️  Aucun retrait à migrer');
    }

    // Migration des sponsors
    console.log('\n🤝 Migration des sponsors...');
    if (data.tables.sponsors && data.tables.sponsors.length > 0) {
      for (const sponsor of data.tables.sponsors) {
        // Créer le document sponsor
        await db.collection('sponsors').doc(sponsor.id.toString()).set({
          id: sponsor.id.toString(),
          name: sponsor.name,
          description: sponsor.description || null,
          websiteUrl: sponsor.websiteUrl || null,
          logoUrl: sponsor.logoUrl || null,
          tier: sponsor.tier,
          displayOrder: sponsor.displayOrder || 0,
          isActive: sponsor.isActive !== false,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(sponsor.createdAt)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(sponsor.updatedAt))
        });
        stats.sponsors++;

        // Migration des médias sponsors (sous-collection)
        if (data.tables.sponsor_media) {
          const sponsorMedia = data.tables.sponsor_media.filter((m: any) => m.sponsorId === sponsor.id);
          for (const media of sponsorMedia) {
            await db.collection('sponsors')
              .doc(sponsor.id.toString())
              .collection('media')
              .doc(media.id.toString())
              .set({
                id: media.id.toString(),
                mediaType: media.mediaType,
                mediaUrl: media.mediaUrl,
                thumbnailUrl: media.thumbnailUrl || null,
                title: media.title || null,
                description: media.description || null,
                displayOrder: media.displayOrder || 0,
                isActive: media.isActive !== false,
                createdAt: admin.firestore.Timestamp.fromDate(new Date(media.createdAt)),
                updatedAt: admin.firestore.Timestamp.fromDate(new Date(media.updatedAt))
              });
            stats.sponsorMedia++;
          }
        }
      }
      console.log(`   ✅ ${stats.sponsors} sponsor(s) migré(s)`);
      if (stats.sponsorMedia > 0) {
        console.log(`   ✅ ${stats.sponsorMedia} média(s) sponsor migré(s)`);
      }
    } else {
      console.log('   ⚠️  Aucun sponsor à migrer');
    }

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n📊 Statistiques de migration:');
    console.log(`   👥 Utilisateurs:          ${stats.users}`);
    console.log(`   📂 Catégories:            ${stats.categories}`);
    console.log(`   🎤 Candidats:             ${stats.candidates}`);
    console.log(`   🗳️  Votes:                 ${stats.votes}`);
    console.log(`   ⚙️  Configurations:        ${stats.siteConfig}`);
    console.log(`   💰 Retraits:              ${stats.withdrawals}`);
    console.log(`   🤝 Sponsors:              ${stats.sponsors}`);
    console.log(`   📸 Médias sponsors:       ${stats.sponsorMedia}`);
    
    const total = stats.users + stats.categories + stats.candidates + stats.votes + 
                  stats.siteConfig + stats.withdrawals + stats.sponsors + stats.sponsorMedia;
    console.log(`\n   📦 Total documents:       ${total}`);

    console.log('\n🎯 Prochaines étapes:');
    console.log('   1. Vérifier les données dans Firebase Console');
    console.log('   2. Tester les endpoints avec Firestore');
    console.log('   3. Configurer les règles de sécurité Firestore');
    console.log('   4. Adapter le code pour utiliser Firestore au lieu de Prisma\n');

  } catch (error: any) {
    console.error('\n❌ ERREUR lors de la migration:', error.message);
    console.error('\n💡 Vérifiez:');
    console.error('   1. Le fichier de credentials Firebase est correct');
    console.error('   2. Firestore est activé dans la console Firebase');
    console.error('   3. Votre connexion internet');
    console.error('   4. Les permissions du compte de service\n');
    throw error;
  }
}

// Exécuter la migration
migrateToFirebase()
  .then(() => {
    console.log('✅ Script terminé avec succès\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script terminé avec erreur\n');
    process.exit(1);
  });
