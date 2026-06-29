/**
 * Script de test manuel pour la fonction de formatage de numéro de téléphone.
 * Exécuter avec : npx ts-node test-phone-formatter.ts
 */

import { formatPhoneNumber } from './src/utils/phoneFormatter';

console.log('🧪 Tests de formatage de numéro de téléphone\n');

const testCases = [
  { input: '691234567', expected: '+237691234567', description: 'Numéro local camerounais (9 chiffres, commence par 6)' },
  { input: '677123456', expected: '+237677123456', description: 'Autre numéro local camerounais' },
  { input: '6 91 23 45 67', expected: '+237691234567', description: 'Numéro avec espaces' },
  { input: '+237691234567', expected: '+237691234567', description: 'Numéro déjà formaté avec +237' },
  { input: '237691234567', expected: '+237691234567', description: 'Numéro avec 237 sans le +' },
  { input: '(691) 234-567', expected: '+237691234567', description: 'Numéro avec parenthèses et tirets' },
  { input: '+33612345678', expected: '+33612345678', description: 'Numéro français (ne doit pas être modifié)' },
  { input: '+1234567890', expected: '+1234567890', description: 'Numéro international autre pays' },
  { input: '791234567', expected: '+791234567', description: 'Numéro 9 chiffres ne commençant pas par 6' },
  { input: '6912345', expected: '+6912345', description: 'Numéro de moins de 9 chiffres' },
  { input: '6912345678', expected: '+6912345678', description: 'Numéro de plus de 9 chiffres' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, description }) => {
  const result = formatPhoneNumber(input);
  const isSuccess = result === expected;
  
  if (isSuccess) {
    console.log(`✅ PASS: ${description}`);
    console.log(`   Input:    "${input}"`);
    console.log(`   Expected: "${expected}"`);
    console.log(`   Got:      "${result}"\n`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${description}`);
    console.log(`   Input:    "${input}"`);
    console.log(`   Expected: "${expected}"`);
    console.log(`   Got:      "${result}"\n`);
    failed++;
  }
});

console.log(`\n📊 Résultats: ${passed} réussis, ${failed} échoués sur ${testCases.length} tests`);

if (failed === 0) {
  console.log('🎉 Tous les tests sont passés avec succès !');
  process.exit(0);
} else {
  console.log('⚠️  Certains tests ont échoué.');
  process.exit(1);
}
