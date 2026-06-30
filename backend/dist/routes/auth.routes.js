"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
// Router Express : permet de regrouper les routes par domaine fonctionnel
// et de les monter sur un préfixe commun dans index.ts (/api/auth).
const express_1 = require("express");
// Contrôleur d'authentification : contient la logique HTTP (extraction body,
// formatage réponse). La logique métier est déléguée au service.
const auth_controller_1 = require("../controllers/auth.controller");
// Middleware de validation générique : prend un schéma Zod et valide la
// requête (body, params, query) avant de passer au handler suivant.
// Si la validation échoue, une erreur 400 est renvoyée automatiquement.
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
// Zod : bibliothèque de validation de schémas choisie pour sa syntaxe
// déclarative, son inférence TypeScript native et ses messages d'erreur
// personnalisables. Préféré à Joi/Yup pour sa meilleure intégration TS.
const zod_1 = require("zod");
// Création d'une instance de routeur isolée pour les routes d'authentification.
const router = (0, express_1.Router)();
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
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email invalide'),
        password: zod_1.z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères')
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
router.post('/login', (0, validationMiddleware_1.validate)(loginSchema), auth_controller_1.login);
// Export par défaut du routeur pour permettre son montage dans index.ts
// via `app.use('/api/auth', authRoutes)`.
exports.default = router;
