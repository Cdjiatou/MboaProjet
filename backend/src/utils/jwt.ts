/**
 * @file jwt.ts
 * @description Module utilitaire pour la gestion des JSON Web Tokens (JWT).
 *
 * Ce fichier centralise la création et la vérification des tokens JWT,
 * utilisés pour l'authentification stateless de l'application.
 *
 * POURQUOI JWT plutôt que des sessions côté serveur :
 * - Scalabilité : pas besoin de stocker l'état de session en mémoire ou en BDD.
 *   Chaque requête porte son propre token, ce qui permet de répartir la charge
 *   sur plusieurs serveurs sans synchronisation de sessions.
 * - Découplage : le token contient toutes les informations nécessaires
 *   (id utilisateur, rôle), ce qui évite un aller-retour en base de données
 *   à chaque requête pour vérifier l'identité.
 */

// `jsonwebtoken` est la bibliothèque de référence pour manipuler les JWT en Node.js.
// Elle gère la signature (HMAC SHA256 par défaut), la vérification et le décodage.
import jwt from 'jsonwebtoken';

// On importe le secret JWT depuis le module de configuration centralisé.
// Cela garantit que la valeur a été validée au démarrage (voir `env.ts`),
// et évite un accès direct à `process.env` qui pourrait être `undefined`.
import { env } from '../config/env';

// Extraction du secret dans une constante locale pour améliorer la lisibilité
// et éviter de répéter `env.JWT_SECRET` dans chaque fonction.
const JWT_SECRET = env.JWT_SECRET;

/**
 * Durée de validité des tokens : 1 jour.
 *
 * POURQUOI 1 jour :
 * - Assez long pour ne pas forcer l'utilisateur à se reconnecter trop souvent
 *   (bonne expérience utilisateur).
 * - Assez court pour limiter la fenêtre d'exploitation en cas de vol du token.
 * - Pour une sécurité renforcée, on pourrait utiliser des refresh tokens
 *   avec une durée d'accès plus courte (ex : 15 min access + 7j refresh).
 */
const JWT_EXPIRES_IN = '1d';

/**
 * Interface décrivant la structure du payload stocké dans le token JWT.
 *
 * POURQUOI une interface plutôt qu'un type `any` :
 * - Garantit que seules les données prévues sont incluses dans le token.
 * - Fournit l'autocomplétion et la vérification de types lors de la lecture
 *   du payload après vérification du token.
 * - Documente explicitement les informations disponibles dans chaque token.
 */
export interface TokenPayload {
  /** Identifiant unique de l'utilisateur en base de données */
  id: number;

  /**
   * Rôle de l'utilisateur (ex : 'admin', 'user', 'moderator').
   * Optionnel car certains tokens pourraient être émis avant
   * que le rôle ne soit déterminé (ex : lors de l'inscription).
   */
  role?: string;

  /**
   * Type de compte : 'admin' ou 'candidate'.
   * Permet de distinguer les flux d'authentification et les permissions
   * selon le type d'utilisateur, sans avoir à interroger la base de données.
   */
  type?: 'admin' | 'candidate';
}

/**
 * Génère un token JWT signé à partir d'un payload utilisateur.
 *
 * Cette fonction est appelée lors de la connexion (login) ou de l'inscription
 * pour fournir au client un token qu'il inclura dans le header `Authorization`
 * de ses futures requêtes.
 *
 * @param payload - Les données à encoder dans le token (id, rôle, type).
 *                  ⚠️ Ne JAMAIS inclure de données sensibles (mot de passe, email)
 *                  car le contenu d'un JWT est lisible par quiconque possède le token
 *                  (il est encodé en Base64, PAS chiffré).
 * @returns Le token JWT sous forme de chaîne de caractères.
 *
 * @example
 * ```typescript
 * const token = generateToken({ id: 42, role: 'admin', type: 'admin' });
 * res.json({ token }); // Envoyé au client
 * ```
 */
export const generateToken = (payload: TokenPayload): string => {
  // `jwt.sign` crée le token en trois parties : Header.Payload.Signature
  // - Header : algorithme utilisé (HS256 par défaut)
  // - Payload : les données + la date d'expiration (ajoutée automatiquement via `expiresIn`)
  // - Signature : HMAC du header+payload avec JWT_SECRET, garantissant l'intégrité
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Vérifie et décode un token JWT.
 *
 * Cette fonction est utilisée par le middleware d'authentification pour
 * valider le token envoyé par le client et extraire les informations
 * de l'utilisateur (id, rôle, type).
 *
 * @param token - Le token JWT à vérifier (généralement extrait du header
 *                `Authorization: Bearer <token>`).
 * @returns Le payload décodé si le token est valide, ou `null` si :
 *          - Le token a expiré (date d'expiration dépassée)
 *          - La signature est invalide (token modifié ou secret incorrect)
 *          - Le format du token est malformé
 *
 * POURQUOI retourner `null` plutôt que lever une exception :
 * - Un token invalide est une situation NORMALE et fréquente (expiration,
 *   déconnexion, tentative d'accès non autorisé). Ce n'est pas une erreur
 *   « exceptionnelle » qui mérite un stack trace.
 * - Retourner `null` permet au code appelant de gérer ce cas avec un simple
 *   `if (!payload)` plutôt qu'un try/catch, ce qui est plus lisible.
 *
 * @example
 * ```typescript
 * const payload = verifyToken(token);
 * if (!payload) {
 *   throw new AppError('Token invalide ou expiré', 401);
 * }
 * // payload.id est maintenant disponible et typé
 * ```
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    // `jwt.verify` effectue trois vérifications :
    // 1. Le format du token est valide (trois segments Base64 séparés par des points)
    // 2. La signature correspond au contenu (intégrité garantie par JWT_SECRET)
    // 3. Le token n'a pas expiré (champ `exp` du payload)
    // Le cast `as TokenPayload` est nécessaire car `jwt.verify` retourne
    // `string | JwtPayload`, mais nous savons que notre payload suit `TokenPayload`.
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    // En cas d'échec (expiration, signature invalide, format corrompu),
    // on retourne `null` silencieusement. Le middleware d'authentification
    // se chargera de renvoyer une réponse 401 appropriée.
    return null;
  }
};
