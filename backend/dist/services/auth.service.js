"use strict";
// =============================================================================
// SERVICE D'AUTHENTIFICATION — auth.service.ts
// =============================================================================
// Ce service gère l'authentification des administrateurs de la plateforme.
// Il repose sur une vérification par email/mot de passe avec hachage bcrypt,
// puis délivre un JWT (JSON Web Token) pour les sessions authentifiées.
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = void 0;
// --- Imports des dépendances ---
// Client Prisma pour interagir avec la base de données (ORM)
const prisma_1 = __importDefault(require("../utils/prisma"));
// Bibliothèque de hachage de mots de passe — utilisée ici pour comparer
// le mot de passe fourni avec le hash stocké en base de données
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Utilitaire interne pour générer des tokens JWT signés
const jwt_1 = require("../utils/jwt");
// Classe d'erreur personnalisée qui permet de lever des exceptions HTTP
// avec un code de statut et un message exploitables par le middleware d'erreurs
const AppError_1 = require("../utils/AppError");
// =============================================================================
// FONCTION : loginAdmin
// =============================================================================
/**
 * Authentifie un administrateur à partir de ses identifiants (email + mot de passe).
 *
 * Le processus suit les étapes suivantes :
 * 1. Recherche de l'utilisateur en base par son email.
 * 2. Vérification du mot de passe via bcrypt (comparaison avec le hash stocké).
 * 3. Génération d'un token JWT contenant l'identité et le rôle de l'utilisateur.
 * 4. Renvoi des informations publiques de l'utilisateur accompagnées du token.
 *
 * @param email    - Adresse email de l'administrateur tentant de se connecter.
 * @param password - Mot de passe en clair fourni par l'administrateur.
 * @returns Un objet contenant les données publiques de l'utilisateur et son token JWT.
 * @throws {AppError} 401 — Si l'email n'existe pas ou si le mot de passe est incorrect.
 *                          Le message reste volontairement générique ("Identifiants invalides")
 *                          afin de ne pas révéler si c'est l'email ou le mot de passe qui est faux
 *                          (bonne pratique de sécurité).
 */
const loginAdmin = async (email, password) => {
    // Étape 1 : Recherche de l'utilisateur par email (clé unique)
    // On utilise `findUnique` car l'email est indexé en tant que champ unique dans le schéma Prisma
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    // Si aucun utilisateur ne correspond, on lève une erreur 401 (non autorisé)
    if (!user) {
        throw new AppError_1.AppError('Identifiants invalides.', 401);
    }
    // Étape 2 : Comparaison sécurisée du mot de passe fourni avec le hash en base
    // bcrypt.compare gère automatiquement l'extraction du sel depuis le hash stocké
    const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
    // Même message d'erreur que pour l'utilisateur non trouvé,
    // afin d'empêcher l'énumération des comptes (sécurité par obscurité contrôlée)
    if (!isValidPassword) {
        throw new AppError_1.AppError('Identifiants invalides.', 401);
    }
    // Étape 3 : Génération du token JWT
    // Le payload contient l'ID de l'utilisateur, son rôle (ex: SUPER_ADMIN, ADMIN)
    // et le type 'admin' pour distinguer les tokens admin des tokens candidat
    const token = (0, jwt_1.generateToken)({
        id: user.id,
        role: user.role,
        type: 'admin'
    });
    // Étape 4 : Construction de la réponse
    // On ne renvoie que les champs publics de l'utilisateur (jamais le mot de passe hashé)
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    };
};
exports.loginAdmin = loginAdmin;
