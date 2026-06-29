/**
 * Script de test pour vérifier que l'upload vers Cloudinary fonctionne correctement
 */

// Charger les variables d'environnement
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { uploadToCloudinary, deleteFromCloudinary } from '../src/config/cloudinary';
import fs from 'fs';

async function testCloudinaryUpload() {
  console.log('\n🧪 Test de l\'intégration Cloudinary...\n');

  // Créer un fichier de test temporaire
  const testFilePath = path.join(__dirname, '../uploads/temp/test-upload.txt');
  const testContent = `Test Cloudinary Upload - ${new Date().toISOString()}`;
  
  try {
    // S'assurer que le dossier temp existe
    const tempDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Créer le fichier de test
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Fichier de test créé:', testFilePath);

    // Test 1: Upload d'un fichier
    console.log('\n📤 Test 1: Upload vers Cloudinary...');
    const { url, publicId } = await uploadToCloudinary(
      testFilePath,
      'test',
      'image'
    );
    
    console.log('✅ Upload réussi!');
    console.log(`   URL: ${url}`);
    console.log(`   Public ID: ${publicId}`);

    // Test 2: Suppression du fichier de Cloudinary
    console.log('\n🗑️  Test 2: Suppression depuis Cloudinary...');
    await deleteFromCloudinary(publicId, 'image');
    console.log('✅ Fichier supprimé de Cloudinary!');

    // Nettoyer le fichier temporaire local
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Fichier temporaire local supprimé');

    console.log('\n' + '='.repeat(60));
    console.log('✅ TOUS LES TESTS ONT RÉUSSI!');
    console.log('='.repeat(60));
    console.log('\n🎯 Cloudinary est correctement configuré et fonctionnel.');
    console.log('   Tous les nouveaux uploads utiliseront maintenant Cloudinary CDN.\n');

  } catch (error: any) {
    console.error('\n❌ ERREUR lors du test:', error.message);
    console.error('\n💡 Vérifiez:');
    console.error('   1. Les variables d\'environnement dans backend/.env');
    console.error('   2. La connexion internet');
    console.error('   3. Les identifiants Cloudinary\n');
    
    // Nettoyer le fichier temporaire même en cas d'erreur
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    } catch (cleanupError) {
      // Ignorer les erreurs de nettoyage
    }
    
    process.exit(1);
  }
}

testCloudinaryUpload().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
