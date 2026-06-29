import { formatPhoneNumber } from './src/utils/phoneFormatter';

console.log('Test avec espaces:\n');

const testCases = [
  '+237 650 240 560',
  '+237 650240560',
  '650 240 560',
  ' 650240560 ',
];

testCases.forEach(input => {
  const output = formatPhoneNumber(input);
  console.log(`Input:  "${input}"`);
  console.log(`Output: "${output}"`);
  console.log(`Contient espaces: ${output.includes(' ') ? 'OUI ❌' : 'NON ✅'}`);
  console.log('---\n');
});
