"use strict";
/**
 * @file catchAsync.ts
 * @description Utilitaire pour capturer automatiquement les erreurs des
 *              fonctions asynchrones dans les routes Express.
 *
 * POURQUOI ce fichier est nécessaire :
 * Express (v4) ne gère PAS nativement les rejections de Promesses dans
 * les middlewares et contrôleurs. Si une fonction `async` lève une erreur
 * sans `try/catch`, Express ne la détecte pas et la requête reste « suspendue »
 * indéfiniment (timeout côté client), sans qu'aucun message d'erreur ne soit renvoyé.
 *
 * Sans `catchAsync`, chaque contrôleur devrait contenir un bloc `try/catch` :
 * ```typescript
 * // ❌ Répétitif et source d'oublis
 * export const getUser = async (req, res, next) => {
 *   try {
 *     const user = await findUser(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error); // Facile à oublier !
 *   }
 * };
 * ```
 *
 * Avec `catchAsync`, le code devient :
 * ```typescript
 * // ✅ Propre, DRY, aucun risque d'oublier le catch
 * export const getUser = catchAsync(async (req, res, next) => {
 *   const user = await findUser(req.params.id);
 *   res.json(user);
 * });
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
/**
 * Encapsule une fonction asynchrone Express pour capturer automatiquement
 * les erreurs et les transmettre au middleware de gestion d'erreurs.
 *
 * C'est une « Higher-Order Function » (fonction d'ordre supérieur) :
 * elle prend une fonction en paramètre et retourne une NOUVELLE fonction
 * qui ajoute la gestion d'erreurs autour de l'originale.
 *
 * @param fn - La fonction asynchrone du contrôleur à encapsuler.
 *             Elle doit retourner une Promise (c'est-à-dire être `async`).
 * @returns Une nouvelle fonction middleware Express qui :
 *          1. Exécute `fn` normalement
 *          2. En cas de rejet de la Promise, appelle `next(error)`
 *             pour déléguer l'erreur au middleware centralisé d'erreurs.
 *
 * @example
 * ```typescript
 * import { catchAsync } from '../utils/catchAsync';
 *
 * export const createUser = catchAsync(async (req, res, next) => {
 *   const user = await userService.create(req.body);
 *   res.status(201).json(user);
 *   // Pas besoin de try/catch : si `create` échoue, l'erreur
 *   // est automatiquement transmise à `next()`.
 * });
 * ```
 */
const catchAsync = (fn) => {
    // On retourne une fonction anonyme qui a la signature standard
    // d'un middleware Express : (req, res, next).
    return (req, res, next) => {
        // `fn(req, res, next)` retourne une Promise (car `fn` est async).
        // `.catch(next)` intercepte toute erreur rejetée par cette Promise
        // et la passe directement à `next()`, ce qui déclenche le middleware
        // de gestion d'erreurs d'Express (celui défini avec 4 paramètres :
        // `(err, req, res, next) => { ... }`).
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
