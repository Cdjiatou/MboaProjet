/**
 * @file errorHandler.ts
 * @description Gestionnaire d'erreurs centralisé de l'application Express.
 *
 * Ce middleware est le DERNIER de la chaîne : il intercepte toutes les erreurs
 * propagées par `next(err)` ou lancées via `throw` dans les middlewares précédents.
 *
 * La philosophie est de distinguer deux catégories d'erreurs :
 * - **Opérationnelles** (`isOperational = true`) : erreurs prévisibles et métier
 *   (ex. : validation échouée, ressource introuvable). Leur message est sûr
 *   à renvoyer au client.
 * - **Non opérationnelles** : bugs, plantages inattendus. En production, on masque
 *   le message réel pour ne pas exposer de détails techniques sensibles.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Middleware Express de gestion globale des erreurs.
 *
 * Express reconnaît automatiquement un middleware d'erreur grâce à sa
 * signature à 4 paramètres `(err, req, res, next)`. C'est pourquoi
 * `next` est présent même s'il n'est pas utilisé dans le corps.
 *
 * @param err  - L'erreur interceptée (typée `any` car Express peut
 *               recevoir n'importe quel objet via `next(err)`)
 * @param req  - L'objet requête Express (utile pour du logging contextuel)
 * @param res  - L'objet réponse Express, utilisé pour envoyer la réponse d'erreur
 * @param next - Fonction next (requise par la signature Express, non appelée ici)
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // Extraction du code HTTP, du message et du code d'erreur applicatif.
  // On fournit des valeurs par défaut (500 / message générique) pour
  // couvrir les cas où l'erreur n'est pas une instance d'`AppError`.
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // Détection des erreurs NON opérationnelles (bugs, erreurs imprévues).
  // `isOperational` est un drapeau défini dans la classe `AppError`.
  // Si ce drapeau est absent ou faux, cela signifie que l'erreur n'a pas
  // été anticipée par le développeur — on la journalise donc intégralement
  // pour faciliter le débogage.
  if (!err.isOperational) {
    // Log complet de l'erreur côté serveur pour investigation.
    // L'emoji 🔥 permet de repérer visuellement ces erreurs critiques
    // dans un flux de logs dense.
    console.error('🔥 ERREUR NON GÉRÉE:', err);

    // En production, on remplace le message technique par un message
    // générique afin de ne pas exposer de détails d'implémentation
    // (noms de tables, chemins de fichiers, etc.) qui pourraient
    // être exploités par un attaquant.
    if (process.env.NODE_ENV === 'production') {
      message = 'Quelque chose a mal tourné, veuillez réessayer plus tard.';
    }
  }

  // Construction et envoi de la réponse JSON normalisée.
  // Le format est volontairement constant (`success`, `error`, `code`)
  // pour que le client frontend puisse traiter toutes les erreurs
  // de manière uniforme, quel que soit le type d'erreur.
  res.status(statusCode).json({
    success: false,
    error: message,
    code: errorCode,
    // En développement (et en staging), on inclut la stack trace complète
    // pour accélérer le débogage. En production, elle est omise pour
    // des raisons de sécurité (ne pas révéler la structure interne du code).
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
