/**
 * @file env.ts
 * @description Module de configuration et de validation des variables d'environnement.
 *
 * Ce fichier centralise la lecture et la validation de TOUTES les variables
 * d'environnement nécessaires au fonctionnement de l'application.
 *
 * POURQUOI ce fichier existe :
 * - Éviter les erreurs silencieuses en production causées par des variables manquantes
 *   ou mal formatées (ex : une URL de base de données invalide).
 * - Fournir un point d'entrée UNIQUE pour accéder aux variables d'environnement,
 *   plutôt que d'appeler `process.env.XXX` un peu partout dans le code.
 * - Garantir le typage fort grâce à Zod : chaque variable est typée et validée
 *   au démarrage, ce qui élimine les `undefined` inattendus à l'exécution.
 */

// Zod est utilisé ici plutôt qu'une validation manuelle car il offre :
// - Un typage TypeScript automatique à partir du schéma (inférence)
// - Des messages d'erreur clairs et structurés en cas d'échec
// - Une API déclarative et concise pour décrire les contraintes
import { z } from 'zod';

// dotenv charge les variables depuis le fichier `.env` situé à la racine du projet
// et les injecte dans `process.env`. Cela permet de ne JAMAIS coder en dur
// des secrets (clés API, mots de passe) directement dans le code source.
import dotenv from 'dotenv';

// Appel immédiat pour que les variables soient disponibles
// AVANT toute tentative de lecture de `process.env`.
// C'est pourquoi ce fichier doit être importé le plus tôt possible dans l'application.
dotenv.config();

/**
 * Schéma de validation des variables d'environnement.
 *
 * Chaque propriété correspond à une variable attendue dans `process.env`.
 * Les contraintes appliquées ici servent de « contrat » : si une variable
 * ne respecte pas son contrat, l'application refuse de démarrer.
 */
const envSchema = z.object({
  // PORT : port d'écoute du serveur HTTP.
  // On utilise `z.string()` car `process.env` retourne toujours des chaînes.
  // La valeur par défaut '3000' permet un démarrage rapide en développement
  // sans avoir à définir explicitement cette variable.
  PORT: z.string().default('3000'),

  // DATABASE_URL : chaîne de connexion à la base de données (ex : PostgreSQL).
  // `.url()` garantit que la valeur est une URL valide, ce qui évite
  // des erreurs cryptiques de Prisma au moment de la connexion.
  DATABASE_URL: z.string().url(),

  // JWT_SECRET : clé secrète utilisée pour signer et vérifier les tokens JWT.
  // `.min(10)` impose une longueur minimale de 10 caractères pour empêcher
  // l'utilisation de secrets trop faibles (ex : "abc") qui compromettraient
  // la sécurité de l'authentification.
  JWT_SECRET: z.string().min(10),

  // MAVIANS_API_KEY : clé API fournie par Mavians pour interagir avec leur plateforme
  MAVIANS_API_KEY: z.string().min(10),
});

/**
 * Validation des variables d'environnement avec `safeParse`.
 *
 * POURQUOI `safeParse` plutôt que `parse` :
 * - `parse` lèverait une exception non gérée, ce qui produirait un stack trace
 *   peu lisible pour un problème de configuration.
 * - `safeParse` retourne un objet `{ success, data, error }` qui nous permet
 *   d'afficher un message d'erreur clair et personnalisé avant de quitter.
 */
const _env = envSchema.safeParse(process.env);

// Pattern « Fail-Fast » : si la configuration est invalide, on arrête
// immédiatement le processus plutôt que de laisser l'application démarrer
// dans un état incohérent. Cela évite des bugs difficiles à diagnostiquer
// qui ne se manifesteraient qu'au moment d'utiliser la variable manquante.
if (!_env.success) {
  console.error('❌ Configuration système invalide (Variables d\'environnement) :');
  // `.format()` produit un affichage structuré des erreurs, indiquant
  // précisément quelle variable pose problème et pourquoi.
  console.error(_env.error.format());
  // Code de sortie 1 = erreur. Le processus s'arrête immédiatement.
  process.exit(1);
}

/**
 * Objet `env` exporté : point d'accès unique et typé aux variables d'environnement.
 *
 * Grâce à l'inférence de Zod, `env` est automatiquement typé comme :
 * `{ PORT: string; DATABASE_URL: string; JWT_SECRET: string }`
 *
 * Utilisation dans le reste de l'application :
 * ```typescript
 * import { env } from './config/env';
 * console.log(env.PORT); // Typé, validé, garanti non-undefined
 * ```
 */
export const env = _env.data;
