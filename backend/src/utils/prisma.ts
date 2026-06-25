/**
 * @file prisma.ts
 * @description Instance unique (Singleton) du client Prisma ORM.
 *
 * Ce fichier crée et exporte UNE SEULE instance de `PrismaClient`,
 * partagée par l'ensemble de l'application.
 *
 * POURQUOI un Singleton pour le client de base de données :
 * - Chaque instance de `PrismaClient` ouvre son propre pool de connexions
 *   vers la base de données. Créer plusieurs instances (par exemple une
 *   par fichier de service) multiplierait les connexions ouvertes,
 *   ce qui peut rapidement épuiser la limite de connexions du serveur
 *   de base de données (souvent 100 par défaut sur PostgreSQL).
 * - Une instance unique garantit une gestion optimale du pool de connexions :
 *   les requêtes sont mises en file d'attente et réutilisent les connexions
 *   existantes plutôt que d'en ouvrir de nouvelles.
 * - Cela facilite aussi la configuration globale (logging, middlewares Prisma)
 *   en un seul endroit.
 *
 * UTILISATION dans le reste de l'application :
 * ```typescript
 * import prisma from '../utils/prisma';
 *
 * // Toutes les requêtes passent par la même instance
 * const users = await prisma.user.findMany();
 * const post = await prisma.post.create({ data: { ... } });
 * ```
 */

// `PrismaClient` est la classe générée automatiquement par Prisma
// à partir du fichier `schema.prisma`. Elle contient un accesseur typé
// pour chaque modèle défini dans le schéma (ex : `prisma.user`, `prisma.post`).
// L'import depuis `@prisma/client` nécessite d'avoir exécuté `npx prisma generate`
// au préalable, sinon le module n'existe pas.
import { PrismaClient } from '@prisma/client';

/**
 * Instance unique du client Prisma, connectée à la base de données
 * définie par `DATABASE_URL` dans les variables d'environnement.
 *
 * Prisma utilise une connexion « lazy » : la connexion réelle à la base
 * de données n'est établie qu'au moment de la première requête, pas
 * lors de l'instanciation. Cela signifie que `new PrismaClient()` est
 * très léger et ne bloque pas le démarrage de l'application.
 *
 * Pour un environnement de développement avec hot-reload (nodemon, ts-node-dev),
 * il est recommandé d'attacher l'instance à `globalThis` pour éviter
 * de recréer un client à chaque rechargement. Cette optimisation n'est pas
 * implémentée ici car elle ajoute de la complexité inutile en production.
 */
const prisma = new PrismaClient();

// Export par défaut pour un import simple et concis :
// `import prisma from '../utils/prisma'` plutôt que `import { prisma } from ...`
// C'est une convention courante pour les instances Singleton.
export default prisma;
