/**
 * @file AppError.ts
 * @description Classe d'erreur personnalisée pour l'application.
 *
 * POURQUOI une classe d'erreur personnalisée :
 * - La classe native `Error` de JavaScript ne porte pas de code HTTP (`statusCode`),
 *   ce qui oblige à gérer le mapping erreur → code HTTP à chaque endroit du code.
 * - `AppError` encapsule à la fois le message, le code HTTP et la nature de l'erreur,
 *   permettant au middleware de gestion d'erreurs de répondre automatiquement
 *   avec le bon statut HTTP.
 * - Elle introduit la distinction entre erreurs « opérationnelles » (prévisibles,
 *   gérables) et erreurs de « programmation » (bugs), ce qui est essentiel
 *   pour décider si l'application doit continuer à tourner ou s'arrêter.
 */

/**
 * Classe `AppError` — Erreur applicative avec code HTTP intégré.
 *
 * Cette classe étend `Error` pour y ajouter :
 * - `statusCode` : le code de statut HTTP associé (ex : 404, 400, 500).
 * - `isOperational` : un booléen qui distingue les erreurs attendues (ex : ressource
 *   non trouvée, données invalides) des erreurs inattendues (bugs, pannes).
 *
 * @example
 * ```typescript
 * // Utilisation dans un contrôleur ou un service
 * throw new AppError('Utilisateur non trouvé', 404);
 * throw new AppError('Email déjà utilisé', 409);
 * throw new AppError('Accès refusé', 403);
 * ```
 */
export class AppError extends Error {
  /**
   * Code de statut HTTP associé à cette erreur.
   *
   * `readonly` empêche toute modification après la création de l'instance,
   * car changer le code HTTP d'une erreur en cours de route serait un anti-pattern
   * source de confusion dans les logs et les réponses API.
   */
  public readonly statusCode: number;

  /**
   * Indique si l'erreur est « opérationnelle » (true) ou un bug (false).
   *
   * POURQUOI cette distinction est cruciale :
   * - Erreur opérationnelle (true) : situation prévisible et gérée
   *   (ex : validation échouée, ressource inexistante). L'application peut
   *   continuer à fonctionner normalement après avoir renvoyé une réponse d'erreur.
   * - Erreur de programmation (false) : bug inattendu (ex : `TypeError`,
   *   `ReferenceError`). Dans ce cas, le middleware d'erreurs peut décider
   *   de redémarrer le processus car l'état de l'application est potentiellement
   *   corrompu.
   *
   * Ici, `isOperational` est toujours `true` car `AppError` est conçu
   * pour être lancé intentionnellement par le développeur. Les erreurs
   * non-opérationnelles sont celles qui ne sont PAS des instances d'`AppError`.
   */
  public readonly isOperational: boolean;

  /**
   * Crée une nouvelle instance d'erreur applicative.
   *
   * @param message - Message descriptif de l'erreur, destiné à être renvoyé
   *                  dans la réponse API (doit donc être compréhensible par le client).
   * @param statusCode - Code HTTP correspondant à la nature de l'erreur
   *                     (4xx pour les erreurs client, 5xx pour les erreurs serveur).
   */
  constructor(message: string, statusCode: number) {
    // Appel au constructeur parent `Error` pour initialiser `this.message`
    // et garantir que l'instance est bien reconnue comme une `Error` native
    // (ce qui est important pour `instanceof` et les outils de logging).
    super(message);

    this.statusCode = statusCode;

    // Toujours `true` : toute erreur créée via `new AppError(...)` est par
    // définition opérationnelle, car le développeur l'a lancée volontairement.
    this.isOperational = true;

    // `captureStackTrace` est une API V8 (Node.js / Chrome) qui enregistre
    // la pile d'appels au moment de la création de l'erreur.
    // Le second argument `this.constructor` exclut le constructeur d'`AppError`
    // lui-même de la stack trace, ce qui la rend plus lisible :
    // on voit directement la ligne qui a fait `throw new AppError(...)`,
    // sans le bruit du constructeur intermédiaire.
    Error.captureStackTrace(this, this.constructor);
  }
}
