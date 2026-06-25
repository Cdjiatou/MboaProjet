/**
 * @file validationMiddleware.ts
 * @description Middleware de validation des requêtes HTTP basé sur Zod.
 *
 * Ce module utilise la bibliothèque Zod pour valider de manière déclarative
 * le contenu des requêtes entrantes (body, query string et paramètres d'URL).
 *
 * L'intérêt de centraliser la validation dans un middleware est double :
 * 1. **Séparation des responsabilités** : les contrôleurs ne gèrent que
 *    la logique métier, sans se soucier de la forme des données.
 * 2. **Cohérence** : toutes les erreurs de validation suivent le même
 *    format de réponse, facilitant l'intégration côté client.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Fabrique un middleware de validation à partir d'un schéma Zod.
 *
 * C'est une **higher-order function** (fonction qui retourne une fonction) :
 * on l'appelle avec un schéma au moment de la déclaration de la route,
 * et elle produit le middleware réel qui sera exécuté à chaque requête.
 *
 * Exemple d'utilisation dans un routeur :
 * ```ts
 * router.post('/candidats', validate(createCandidateSchema), candidateController.create);
 * ```
 *
 * @param schema - Un objet Zod décrivant la structure attendue de la requête.
 *                 Le schéma doit définir les clés `body`, `query` et/ou `params`
 *                 selon les parties de la requête à valider.
 *
 * @returns Un middleware Express asynchrone qui valide la requête
 *          et passe au suivant si elle est conforme, ou propage
 *          une `AppError` 400 en cas d'échec de validation.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validation asynchrone des trois sources de données de la requête.
      // On les regroupe dans un seul objet pour permettre au schéma Zod
      // de définir des règles croisées (ex. : un champ du body qui dépend
      // d'un paramètre d'URL). `parseAsync` est utilisé au lieu de `parse`
      // pour supporter les validations asynchrones (ex. : `.refine` avec
      // un appel à la base de données).
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Si la validation réussit, on passe la main au middleware suivant
      // sans modifier la requête (les données validées restent dans
      // leurs emplacements d'origine : req.body, req.query, req.params).
      next();
    } catch (error) {
      // Traitement spécifique des erreurs de validation Zod.
      // On vérifie explicitement le type pour ne pas masquer d'autres
      // erreurs inattendues (ex. : erreur de connexion DB dans un refine).
      if (error instanceof ZodError) {
        // Construction d'un message lisible à partir de toutes les erreurs
        // de validation. Chaque erreur inclut le chemin du champ fautif
        // (ex. : « body.email ») et le message d'erreur Zod associé.
        // Le séparateur « | » permet au client de splitter facilement
        // le message pour afficher les erreurs champ par champ.
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ');

        // Création d'une AppError avec un code HTTP 400 (Bad Request),
        // car l'erreur provient du client (données invalides).
        const appError = new AppError(message, 400);

        // Ajout d'un code d'erreur applicatif « VALIDATION_ERROR » pour
        // que le client frontend puisse identifier programmatiquement
        // ce type d'erreur et afficher un feedback adapté (ex. : surligner
        // les champs invalides dans un formulaire).
        (appError as any).errorCode = 'VALIDATION_ERROR';

        // Propagation de l'erreur vers le gestionnaire d'erreurs centralisé
        // via `next(appError)` au lieu d'un `throw`, car nous sommes dans
        // un contexte asynchrone et Express ne capture pas automatiquement
        // les rejets de promesses dans les versions < 5.
        next(appError);
      } else {
        // Pour toute erreur non liée à Zod, on la propage telle quelle
        // vers le gestionnaire d'erreurs centralisé, qui décidera
        // du code HTTP et du message appropriés.
        next(error);
      }
    }
  };
};
