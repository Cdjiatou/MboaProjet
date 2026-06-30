import { env } from './src/config/env';
import { calculateWithdrawalFees } from './src/services/admin.service';
import { initiateMaviansPayment } from './src/services/mavians.service';

async function test() {
  console.log("=== TEST 1: Calcul des 3% de frais ===");
  const amount = 100000;
  const fees = calculateWithdrawalFees(amount);
  console.log(`Montant demandé: ${amount} FCFA`);
  console.log(`Commission (3%): ${fees.feeAmount} FCFA`);
  console.log(`Montant net: ${fees.netAmount} FCFA`);
  
  if (fees.feeAmount === 3000 && fees.netAmount === 97000) {
    console.log("✅ Le calcul de la commission est PARFAIT.");
  } else {
    console.log("❌ Erreur dans le calcul de la commission.");
  }

  console.log("\n=== TEST 2: Connexion à l'API Maviance ===");
  console.log("Clé API présente :", !!env.MAVIANS_API_KEY);
  console.log("PayItem MTN présent :", !!env.MAVIANS_PAY_ITEM_MTN);

  // On lance une requête vers Maviance avec un faux numéro
  // Si la signature HMAC et les clés sont bonnes, Maviance va répondre
  // avec une erreur de numéro invalide ou autre, mais PAS une erreur d'authentification.
  console.log("Envoi d'une requête de test vers Maviance...");
  const result = await initiateMaviansPayment("670000000", 100, "TEST_VOTE_123", "MTN_MOMO");
  
  console.log("Réponse de Maviance :");
  console.log(result);
}

test().catch(console.error);
