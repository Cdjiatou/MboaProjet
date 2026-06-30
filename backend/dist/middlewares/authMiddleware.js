"use strict";
/**
 * @file authMiddleware.ts
 * @description Middlewares d'authentification pour protéger les routes de l'API.
 *
 * Ce fichier définit deux middlewares distincts — un pour les administrateurs,
 * un pour les candidats — afin d'appliquer le principe de moindre privilège :
 * chaque type d'utilisateur ne peut accéder qu'aux routes qui lui sont destinées.
 *
 * La stratégie repose sur un token JWT transmis via l'en-tête HTTP `Authorization`
 * au format « Bearer <token> ». Le token est décodé et son champ `type` est vérifié
 * pour s'assurer que l'appelant possède bien le rôle requis.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateCandidate = exports.authenticateAdmin = void 0;
const jwt_1 = require("../utils/jwt");
const AppError_1 = require("../utils/AppError");
/**
 * Middleware d'authentification réservé aux administrateurs.
 *
 * Vérifie la présence et la validité d'un JWT dans l'en-tête `Authorization`,
 * puis s'assure que le token appartient bien à un utilisateur de type `admin`.
 *
 * @param req  - L'objet requête Express (enrichi avec `user` après validation)
 * @param res  - L'objet réponse Express (non utilisé directement ici)
 * @param next - Fonction pour passer au middleware/contrôleur suivant
 *
 * @throws {AppError} 401 si le token est absent, mal formaté, invalide ou
 *                     n'appartient pas à un administrateur.
 */
const authenticateAdmin = (req, res, next) => {
    // Récupération de l'en-tête Authorization.
    // On utilise le schéma « Bearer <token> » qui est le standard OAuth 2.0,
    // ce qui garantit l'interopérabilité avec la plupart des clients HTTP.
    const authHeader = req.headers.authorization;
    // Vérification de la présence ET du format correct de l'en-tête.
    // On rejette immédiatement si l'en-tête est absent ou ne commence pas
    // par « Bearer » pour éviter de traiter des données malformées.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError_1.AppError('Accès refusé. Token manquant.', 401);
    }
    // Extraction du token brut en ignorant le préfixe « Bearer ».
    // Le split sur l'espace permet de récupérer uniquement la partie JWT.
    const token = authHeader.split(' ')[1];
    // Décodage et vérification de la signature du token.
    // `verifyToken` retourne `null` si le token est expiré ou invalide,
    // ce qui permet de traiter tous les cas d'erreur de manière uniforme.
    const decoded = (0, jwt_1.verifyToken)(token);
    // Double vérification : le token doit être valide ET de type « admin ».
    // Cette séparation des rôles empêche un candidat authentifié d'accéder
    // aux routes d'administration, même avec un token valide.
    if (!decoded || decoded.type !== 'admin') {
        throw new AppError_1.AppError('Token invalide ou expiré.', 401);
    }
    // Injection du payload décodé dans l'objet `req` pour que les
    // contrôleurs en aval puissent identifier l'administrateur courant
    // (par exemple pour enregistrer qui a effectué une action).
    req.user = decoded;
    next();
};
exports.authenticateAdmin = authenticateAdmin;
/**
 * Middleware d'authentification réservé aux candidats.
 *
 * Fonctionne de manière identique à `authenticateAdmin`, mais vérifie
 * que le token appartient à un utilisateur de type `candidate`.
 *
 * On utilise un middleware séparé (plutôt qu'un paramètre de rôle)
 * pour rendre les déclarations de routes plus explicites et lisibles :
 * `router.get('/profil', authenticateCandidate, ...)` indique clairement
 * que seule la population « candidat » est visée.
 *
 * @param req  - L'objet requête Express
 * @param res  - L'objet réponse Express
 * @param next - Fonction pour passer au middleware/contrôleur suivant
 *
 * @throws {AppError} 401 si le token est absent, mal formaté, invalide ou
 *                     n'appartient pas à un candidat.
 */
const authenticateCandidate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError_1.AppError('Accès refusé. Token manquant.', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = (0, jwt_1.verifyToken)(token);
    // Vérification que le type du token est bien « candidate ».
    // Un admin ne pourra pas utiliser ce middleware, ce qui isole
    // complètement les flux d'accès entre les deux populations.
    if (!decoded || decoded.type !== 'candidate') {
        throw new AppError_1.AppError('Token invalide ou expiré.', 401);
    }
    req.user = decoded;
    next();
};
exports.authenticateCandidate = authenticateCandidate;
