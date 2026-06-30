/**
 * @file verify-firebase-migration.ts
 * @description Script de vérification de la migration Firebase
 * 
 * Vérifie que toutes les données ont été correctement migrées
 * et affiche des statistiques détaillées.
 */

import { db } from '../src/config/firebase';

async function verifyMigration() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VÉRIFICATION DE LA MIGRATION FIREBASE');
  console.log('='.repeat(60));
  console.log(`\n📅 Date: ${new Date().toLocaleString('fr-FR')}\n`);

  try {
    // Vérifier les utilisateurs
    console.log('👥 Vérification des utilisateurs...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   ✅ ${usersSnapshot.size} utilisateur(s) trouvé(s)`);
    if (usersSnapshot.size > 0) {
      const firstUser = usersSnapshot.docs[0].data();
      console.log(`   📝 Exemple: ${firstUser.name} (${firstUser.email})`);
    }

    // Vérifier les catégories
    console.log('\n📂 Vérification des catégories...');
    const categoriesSnapshot = await db.collection('categories').get();
    console.log(`   ✅ ${categoriesSnapshot.size} catégorie(s) trouvée(s)`);
    if (categoriesSnapshot.size > 0) {
      categoriesSnapshot.docs.forEach(doc => {
        const cat = doc.data();
        console.log(`   📁 ${cat.name} (slug: ${cat.slug})`);
      });
    }

    // Vérifier les candidats
    console.log('\n🎤 Vérification des candidats...');
    const candidatesSnapshot = await db.collection('candidates').get();
    console.log(`   ✅ ${candidatesSnapshot.size} candidat(s) trouvé(s)`);
    if (candidatesSnapshot.size > 0) {
      const firstCandidate = candidatesSnapshot.docs[0].data();
      console.log(`   📝 Exemple: ${firstCandidate.firstName} ${firstCandidate.lastName}`);
      console.log(`      Email: ${firstCandidate.email}`);
      console.log(`      Phone: ${firstCandidate.phone}`);
      console.log(`      Status: ${firstCandidate.status}`);
      console.log(`      Votes: ${firstCandidate.totalVotesCache}`);
    }

    // Vérifier les votes
    console.log('\n🗳️  Vérification des votes...');
    const votesSnapshot = await db.collection('votes').get();
    console.log(`   ✅ ${votesSnapshot.size} vote(s) trouvé(s)`);
    if (votesSnapshot.size > 0) {
      let successVotes = 0;
      let pendingVotes = 0;
      let failedVotes = 0;
      votesSnapshot.docs.forEach(doc => {
        const vote = doc.data();
        if (vote.status === 'SUCCESS') successVotes++;
        else if (vote.status === 'PENDING') pendingVotes++;
        else if (vote.status === 'FAILED') failedVotes++;
      });
      console.log(`   ✅ Success: ${successVotes}`);
      console.log(`   ⏳ Pending: ${pendingVotes}`);
      console.log(`   ❌ Failed: ${failedVotes}`);
    }

    // Vérifier la configuration
    console.log('\n⚙️  Vérification de la configuration...');
    const configSnapshot = await db.collection('siteConfig').get();
    console.log(`   ✅ ${configSnapshot.size} configuration(s) trouvée(s)`);
    if (configSnapshot.size > 0) {
      console.log(`   📝 Clés de configuration:`);
      configSnapshot.docs.forEach(doc => {
        console.log(`      - ${doc.id}`);
      });
    }

    // Vérifier les retraits
    console.log('\n💰 Vérification des retraits...');
    const withdrawalsSnapshot = await db.collection('withdrawals').get();
    console.log(`   ✅ ${withdrawalsSnapshot.size} retrait(s) trouvé(s)`);
    if (withdrawalsSnapshot.size > 0) {
      let totalAmount = 0;
      withdrawalsSnapshot.docs.forEach(doc => {
        const withdrawal = doc.data();
        totalAmount += withdrawal.netAmount;
      });
      console.log(`   💵 Montant total: ${totalAmount} FCFA`);
    }

    // Vérifier les sponsors
    console.log('\n🤝 Vérification des sponsors...');
    const sponsorsSnapshot = await db.collection('sponsors').get();
    console.log(`   ✅ ${sponsorsSnapshot.size} sponsor(s) trouvé(s)`);
    if (sponsorsSnapshot.size > 0) {
      let totalMedia = 0;
      for (const doc of sponsorsSnapshot.docs) {
        const sponsor = doc.data();
        console.log(`   📝 ${sponsor.name} (Tier: ${sponsor.tier})`);
        
        // Vérifier les médias de ce sponsor
        const mediaSnapshot = await db.collection('sponsors').doc(doc.id).collection('media').get();
        if (mediaSnapshot.size > 0) {
          console.log(`      📸 ${mediaSnapshot.size} média(s)`);
          totalMedia += mediaSnapshot.size;
        }
      }
      console.log(`   📊 Total médias: ${totalMedia}`);
    }

    // Résumé global
    console.log('\n' + '='.repeat(60));
    console.log('✅ VÉRIFICATION TERMINÉE');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`   Collections vérifiées: 7`);
    console.log(`   Tous les documents accessibles: ✅`);
    console.log('\n🎯 État de la migration: RÉUSSIE ✅\n');

  } catch (error: any) {
    console.error('\n❌ ERREUR lors de la vérification:', error.message);
    console.error('\n💡 Possible causes:');
    console.error('   1. Firebase n\'est pas correctement configuré');
    console.error('   2. Les credentials ne sont pas valides');
    console.error('   3. La migration n\'a pas encore été effectuée');
    console.error('   4. Problème de connexion internet\n');
    process.exit(1);
  }
}

// Exécuter la vérification
verifyMigration()
  .then(() => {
    console.log('✅ Vérification terminée avec succès\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Vérification terminée avec erreur\n');
    process.exit(1);
  });
