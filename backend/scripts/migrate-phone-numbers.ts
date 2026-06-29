/**
 * Script de migration des numéros de téléphone existants.
 * 
 * Ce script reformate tous les numéros de téléphone en base de données
 * pour s'assurer qu'ils suivent le format international avec +237.
 * 
 * Exécution :
 *   npx ts-node scripts/migrate-phone-numbers.ts
 * 
 * Mode dry-run (affiche sans modifier) :
 *   npx ts-node scripts/migrate-phone-numbers.ts --dry-run
 */

import prisma from '../src/utils/prisma';
import { formatPhoneNumber } from '../src/utils/phoneFormatter';

const DRY_RUN = process.argv.includes('--dry-run');

async function migratePhoneNumbers() {
  console.log('🔄 Migration des numéros de téléphone');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY-RUN (simulation)' : '✏️  ÉCRITURE EN BASE'}\n`);

  try {
    // Récupérer tous les candidats
    const candidates = await prisma.candidate.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    console.log(`📊 ${candidates.length} candidats trouvés en base de données\n`);

    let migratedCount = 0;
    let unchangedCount = 0;
    const changes: Array<{ id: number; name: string; before: string; after: string }> = [];

    // Traiter chaque candidat
    for (const candidate of candidates) {
      const originalPhone = candidate.phone;
      const formattedPhone = formatPhoneNumber(originalPhone);

      if (formattedPhone !== originalPhone) {
        migratedCount++;
        const fullName = `${candidate.firstName} ${candidate.lastName}`;
        
        changes.push({
          id: candidate.id,
          name: fullName,
          before: originalPhone,
          after: formattedPhone,
        });

        if (!DRY_RUN) {
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: { phone: formattedPhone },
          });
        }
      } else {
        unchangedCount++;
      }
    }

    // Afficher les résultats
    console.log('📋 Résultats de la migration:\n');
    
    if (changes.length > 0) {
      console.log(`✅ ${migratedCount} numéro(s) ${DRY_RUN ? 'à migrer' : 'migré(s)'}:\n`);
      
      changes.forEach(({ id, name, before, after }) => {
        console.log(`  ID ${id} - ${name}`);
        console.log(`    Avant: ${before}`);
        console.log(`    Après: ${after}\n`);
      });
    }

    if (unchangedCount > 0) {
      console.log(`ℹ️  ${unchangedCount} numéro(s) déjà au bon format (aucune modification)\n`);
    }

    // Résumé final
    console.log('─'.repeat(60));
    console.log(`📊 Total: ${candidates.length} candidats`);
    console.log(`✅ Migrés: ${migratedCount}`);
    console.log(`ℹ️  Inchangés: ${unchangedCount}`);
    console.log('─'.repeat(60));

    if (DRY_RUN && migratedCount > 0) {
      console.log('\n💡 Pour appliquer ces changements, exécutez:');
      console.log('   npx ts-node scripts/migrate-phone-numbers.ts');
    } else if (!DRY_RUN && migratedCount > 0) {
      console.log('\n✅ Migration terminée avec succès!');
      console.log('   Les numéros de téléphone ont été reformatés en base de données.');
    } else {
      console.log('\n✅ Aucune migration nécessaire.');
      console.log('   Tous les numéros sont déjà au bon format.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
migratePhoneNumbers();
