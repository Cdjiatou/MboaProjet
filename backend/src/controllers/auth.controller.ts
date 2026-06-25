/**
 * @file auth.controller.ts
 * @description Contrôleur dédié à l'authentification des administrateurs.
 *
 * Ce fichier ne gère qu'un seul endpoint (login) car l'application adopte
 * un modèle d'authentification simplifié : seuls les administrateurs se
 * connectent via email/mot de passe. Les candidats, eux, s'authentifient
 * via OTP (voir candidate.controller.ts).
 */

// Import des types Express pour typer explicitement les paramètres des handlers.
// Cela garantit l'autocomplétion et la vérification statique des propriétés
// de la requête (body, params, query) et de la réponse (json, status, etc.).
import { Request, Response } from 'express';

// Le service d'authentification encapsule toute la logique métier (vérification
// du mot de passe, génération du JWT, etc.) afin de garder le contrôleur mince
// et testable indépendamment de la couche HTTP.
import { loginAdmin } from '../services/auth.service';

// catchAsync est un wrapper qui intercepte les erreurs asynchrones et les
// transmet automatiquement au middleware errorHandler d'Express via next().
// Sans lui, chaque handler nécessiterait un bloc try/catch explicite.
import { catchAsync } from '../utils/catchAsync';

/**
 * Authentifie un administrateur via ses identifiants email/mot de passe.
 *
 * @route POST /api/auth/login
 * @param {Request} req - La requête HTTP contenant `email` et `password` dans le body.
 * @param {Response} res - La réponse HTTP renvoyée au client.
 * @returns {void} Renvoie un objet JSON contenant `success: true` et les données
 *   d'authentification (token JWT, informations de l'admin) issues du service.
 *
 * @description
 * Le contrôleur se contente d'extraire les champs du body, de déléguer au
 * service métier, puis de formater la réponse. La validation du format des
 * données (email valide, longueur du mot de passe) est effectuée en amont
 * par le middleware de validation Zod dans les routes.
 *
 * Le spread `...result` permet de renvoyer dynamiquement toutes les propriétés
 * retournées par le service (token, admin, etc.) sans coupler le contrôleur
 * à une structure de réponse rigide.
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  // Déstructuration des identifiants depuis le corps de la requête.
  // À ce stade, les données ont déjà été validées par le schéma Zod
  // défini dans auth.routes.ts, donc on est sûr de leur format.
  const { email, password } = req.body;

  // Délégation au service métier qui gère la recherche de l'admin en base,
  // la comparaison du hash bcrypt et la génération du token JWT.
  const result = await loginAdmin(email, password);

  // Réponse formatée de manière uniforme avec le flag `success` pour
  // permettre au frontend de gérer facilement les cas succès/erreur.
  res.json({ success: true, ...result });
});
