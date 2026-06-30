import { env } from './src/config/env';
import { initiateMaviansPayment } from './src/services/mavians.service';

async function testPayment() {
  console.log("=== TEST DE PAIEMENT REEL MAVIANCE ===");
  const phoneNumber = "699502505";
  const amount = 100; // 100 FCFA pour le test
  const reference = "TEST_" + Date.now();
  
  console.log(`Tentative de prélèvement de ${amount} FCFA sur le numéro ${phoneNumber}...`);
  console.log(`Référence: ${reference}`);
  
  // Note: 699... est un numéro Orange au Cameroun, on teste avec ORANGE_MOMO
  const result = await initiateMaviansPayment(phoneNumber, amount, reference, "ORANGE_MOMO");
  
  console.log("\n=== RESULTAT DE L'API ===");
  console.log(JSON.stringify(result, null, 2));
}

testPayment().catch(console.error);
