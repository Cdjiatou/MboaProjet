/**
 * Script de test pour envoyer un OTP à un numéro spécifique.
 * Usage: npx ts-node scripts/test-send-otp.ts [numéro]
 */

import { sendWhatsAppMessage } from '../src/services/whatsapp.service';
import { getWhatsAppStatus } from '../src/services/whatsapp.service';

const phone = process.argv[2] || '+237650240560';
const testOTP = '123456';

async function testSendOTP() {
  console.log('🧪 Test d\'envoi d\'OTP\n');
  console.log(`Numéro destinataire: ${phone}`);
  console.log(`Code OTP de test: ${testOTP}\n`);

  // Vérifier le statut WhatsApp
  const status = getWhatsAppStatus();
  console.log('📡 Statut WhatsApp:');
  console.log(`  Connecté: ${status.connected ? '✅ OUI' : '❌ NON'}`);
  console.log(`  État: ${status.state}`);
  console.log(`  Erreur: ${status.lastError || 'Aucune'}\n`);

  if (!status.connected) {
    console.log('❌ WhatsApp n\'est pas connecté. Impossible d\'envoyer le message.');
    return;
  }

  // Tenter l'envoi
  console.log('📤 Envoi du message...\n');
  const message = `Bienvenue sur MBOA NEXT STAR ! 🌟\n\nVotre code de vérification est : *${testOTP}*\n\nNe partagez ce code avec personne.`;
  
  try {
    const success = await sendWhatsAppMessage(phone, message);
    
    if (success) {
      console.log('✅ Message envoyé avec succès !');
      console.log('   Vérifiez le téléphone du destinataire.');
    } else {
      console.log('❌ Échec de l\'envoi du message.');
      console.log('   Consultez les logs ci-dessus pour plus de détails.');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
  }
}

// Attendre un peu pour que la connexion WhatsApp soit prête
setTimeout(testSendOTP, 2000);
