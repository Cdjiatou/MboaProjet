/**
 * @file auth.routes.ts
 * @description Définition des routes d'authentification de l'API.
 *
 * Ce module configure le routeur Express dédié à l'authentification des
 * administrateurs. Il n'expose qu'une seule route (POST /login) car les
 * candidats utilisent un mécanisme OTP distinct (voir candidate.routes.ts).
 *
 * La validation des données est effectuée AVANT l'exécution du contrôleur
 * grâce à un middleware Zod, ce qui garantit que le contrôleur reçoit
 * toujours des données conformes au schéma attendu.
 */

// Router Express : permet de regrouper les routes par domaine fonctionnel
// et de les monter sur un préfixe commun dans index.ts (/api/auth).
import { Router } from 'express';

// Contrôleur d'authentification : contient la logique HTTP (extraction body,
// formatage réponse). La logique métier est déléguée au service.
import { login } from '../controllers/auth.controller';

// Middleware de validation générique : prend un schéma Zod et valide la
// requête (body, params, query) avant de passer au handler suivant.
// Si la validation échoue, une erreur 400 est renvoyée automatiquement.
import { validate } from '../middlewares/validationMiddleware';

// Zod : bibliothèque de validation de schémas choisie pour sa syntaxe
// déclarative, son inférence TypeScript native et ses messages d'erreur
// personnalisables. Préféré à Joi/Yup pour sa meilleure intégration TS.
import { z } from 'zod';

// Création d'une instance de routeur isolée pour les routes d'authentification.
const router = Router();

/**
 * Schéma de validation Zod pour la route de connexion.
 *
 * @description
 * Le schéma enveloppe les champs dans `body` pour correspondre à la structure
 * de l'objet Request Express. Cette convention permet au middleware `validate`
 * de savoir quelles parties de la requête valider (body, params, query).
 *
 * Règles de validation :
 * - `email` : doit être une adresse email syntaxiquement valide.
 * - `password` : minimum 6 caractères, seuil de sécurité de base.
 *
 * Les messages d'erreur sont en français pour être directement affichables
 * dans l'interface utilisateur sans traduction côté frontend.
 */
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères')
  })
});

/**
 * @route POST /login
 * @description Authentifie un administrateur via email et mot de passe.
 *
 * Pipeline de traitement :
 * 1. `validate(loginSchema)` — Vérifie la conformité du body au schéma Zod.
 * 2. `login` — Exécute la logique d'authentification et renvoie un token JWT.
 *
 * Cette route est publique (pas de middleware d'authentification) car elle
 * constitue le point d'entrée pour obtenir un token.
 */
router.post('/login', validate(loginSchema), login);

// Export par défaut du routeur pour permettre son montage dans index.ts
// via `app.use('/api/auth', authRoutes)`.
export default router;
