# Formatage des Numéros de Téléphone

## Vue d'ensemble

Le système de formatage des numéros de téléphone garantit que tous les numéros sont correctement formatés avec l'indicatif international du Cameroun (+237) pour l'envoi d'OTP via WhatsApp.

## Fichier principal

`backend/src/utils/phoneFormatter.ts`

## Fonction principale : `formatPhoneNumber(phone: string)`

### Règles de formatage

La fonction applique intelligemment les règles suivantes :

1. **Numéro local camerounais** (9 chiffres commençant par 6)
   - Input : `691234567`
   - Output : `+237691234567`
   - Le système ajoute automatiquement l'indicatif +237

2. **Numéro avec espaces/tirets/parenthèses**
   - Input : `6 91 23 45 67` ou `(691) 234-567`
   - Output : `+237691234567`
   - Les caractères de formatage sont supprimés

3. **Numéro déjà formaté avec +237**
   - Input : `+237691234567`
   - Output : `+237691234567`
   - Le numéro reste inchangé (sauf nettoyage)

4. **Numéro avec 237 sans le +**
   - Input : `237691234567`
   - Output : `+237691234567`
   - Le + est ajouté automatiquement

5. **Numéros internationaux d'autres pays**
   - Input : `+33612345678` (France)
   - Output : `+33612345678`
   - Les numéros internationaux sont conservés tels quels

## Exemples d'utilisation

### Dans le service des candidats

```typescript
import { formatPhoneNumber } from '../utils/phoneFormatter';

// Lors de la création d'un candidat
const formattedPhone = formatPhoneNumber(data.phone);
// "691234567" → "+237691234567"

// Le numéro formaté est ensuite stocké en base
const candidate = await prisma.candidate.create({
  data: {
    ...data,
    phone: formattedPhone,
  },
});
```

### Cas d'usage typiques

| Input utilisateur | Format stocké | Envoi WhatsApp |
|-------------------|---------------|----------------|
| `691234567` | `+237691234567` | ✅ Fonctionne |
| `6 91 23 45 67` | `+237691234567` | ✅ Fonctionne |
| `+237691234567` | `+237691234567` | ✅ Fonctionne |
| `237691234567` | `+237691234567` | ✅ Fonctionne |
| `(691) 234-567` | `+237691234567` | ✅ Fonctionne |

## Fonctions utilitaires

### `extractDigits(phone: string): string`

Extrait uniquement les chiffres d'un numéro de téléphone (sans le +).

```typescript
extractDigits('+237691234567') // → '237691234567'
extractDigits('6 91 23 45 67')  // → '691234567'
```

### `arePhoneNumbersEqual(phone1: string, phone2: string): boolean`

Compare deux numéros en ignorant le formatage.

```typescript
arePhoneNumbersEqual('+237691234567', '237691234567') // → true
arePhoneNumbersEqual('+237691234567', '691234567')    // → false
```

## Tests

Les tests sont disponibles dans `backend/test-phone-formatter.ts`.

Pour exécuter les tests :

```bash
cd backend
npx ts-node test-phone-formatter.ts
```

## Intégration avec WhatsApp

Le formatage est essentiel pour l'envoi d'OTP via WhatsApp. Le service WhatsApp (`whatsapp.service.ts`) attend des numéros au format international complet :

```typescript
// Format requis par WhatsApp
const jid = `${cleaned}@s.whatsapp.net`;
// Exemple : "237691234567@s.whatsapp.net"
```

Sans l'indicatif +237, les messages WhatsApp ne seront pas livrés aux numéros camerounais.

## Migration des données existantes

Si des candidats existent déjà en base avec des numéros non formatés, vous pouvez exécuter une migration :

```typescript
// Script de migration (à créer si nécessaire)
import { formatPhoneNumber } from './src/utils/phoneFormatter';
import prisma from './src/utils/prisma';

async function migratePhoneNumbers() {
  const candidates = await prisma.candidate.findMany();
  
  for (const candidate of candidates) {
    const formattedPhone = formatPhoneNumber(candidate.phone);
    
    if (formattedPhone !== candidate.phone) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { phone: formattedPhone },
      });
      console.log(`Migré: ${candidate.phone} → ${formattedPhone}`);
    }
  }
}
```

## Validation côté frontend

Il est recommandé d'ajouter une validation côté frontend pour guider l'utilisateur :

```typescript
// Exemple de validation React
const validatePhone = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '');
  
  // Numéro local camerounais
  if (digits.length === 9 && digits.startsWith('6')) {
    return null; // Valide
  }
  
  // Numéro avec indicatif
  if (digits.startsWith('237') && digits.length === 12) {
    return null; // Valide
  }
  
  return 'Format invalide. Utilisez un numéro camerounais (ex: 691234567)';
};
```

## Débogage

Si l'envoi d'OTP échoue, vérifiez :

1. Le format du numéro en base de données :
```sql
SELECT id, phone FROM candidates WHERE id = X;
```

2. Les logs du serveur lors de l'envoi :
```
[WhatsApp] Message envoyé avec succès à +237691234567 (237691234567@s.whatsapp.net)
```

3. Le statut de connexion WhatsApp :
```
[WhatsApp] Connexion ouverte ! WhatsApp est prêt.
```
