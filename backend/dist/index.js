"use strict";
/**
 * @file index.ts
 * @description Point d'entrée principal de l'API MBOA NEXT STAR.
 *
 * Ce fichier est responsable de :
 * 1. La configuration de l'application Express (middlewares globaux).
 * 2. Le montage des routeurs sur leurs préfixes d'URL respectifs.
 * 3. La définition des routes utilitaires (health check, catch-all 404).
 * 4. Le démarrage du serveur HTTP sur le port configuré.
 *
 * L'architecture suit le pattern MVC adapté (sans vues, car c'est une API REST) :
 * index.ts → routes → controllers → services → Prisma/DB
 *
 * L'ordre de montage des middlewares est CRITIQUE en Express :
 * les middlewares de parsing (cors, json) doivent être montés AVANT les routes,
 * et le errorHandler APRÈS toutes les routes pour intercepter les erreurs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

// Chargement de la configuration d'environnement en tout premier.
const env_1 = require("./config/env");

// Framework Express
const express_1 = __importDefault(require("express"));

// CORS
const cors_1 = __importDefault(require("cors"));

// ──────────────────────────────────────────────────────────────────────────────
// Import des routeurs par domaine fonctionnel
// ──────────────────────────────────────────────────────────────────────────────
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const candidate_routes_1 = __importDefault(require("./routes/candidate.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const AppError_1 = require("./utils/AppError");

// ──────────────────────────────────────────────────────────────────────────────
// Initialisation de l'application Express
// ──────────────────────────────────────────────────────────────────────────────
const app = (0, express_1.default)();

// ──────────────────────────────────────────────────────────────────────────────
// Middlewares globaux
// ──────────────────────────────────────────────────────────────────────────────

// ✅ CORRECTIF CORS — Liste des origines autorisées
// Ajoutez ici l'URL EXACTE de votre frontend O2switch (avec https://)
const allowedOrigins = [
    'https://mboa-next-star.vercel.app/', // ← remplacez par votre URL O2switch exacte
    'http://localhost:5173',                 // Dev local Vite
    'http://localhost:3000',                 // Dev local alternative
];

app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origine (Postman, curl, apps mobiles)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // ✅ CORRECTIF : retourner false proprement au lieu de lancer une Error()
            // L'ancienne version avec callback(new Error(...)) causait les
            // "🔥 ERREUR NON GÉRÉE" qui polluaient les logs Railway.
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsing automatique du body JSON des requêtes entrantes.
app.use(express_1.default.json());

// Servir les fichiers statiques depuis le répertoire uploads
app.use('/uploads', express_1.default.static('uploads'));

// ──────────────────────────────────────────────────────────────────────────────
// Montage des routeurs sur leurs préfixes d'URL
// ──────────────────────────────────────────────────────────────────────────────

/** Routes d'authentification : POST /api-mboa/auth/login */
app.use('/api-mboa/auth', auth_routes_1.default);

/** Routes d'administration : /api-mboa/admin/* (protégées par JWT admin) */
app.use('/api-mboa/admin', admin_routes_1.default);

/** Routes candidat : /api-mboa/candidates/* */
app.use('/api-mboa/candidates', candidate_routes_1.default);

/** Routes publiques : /api-mboa/* */
app.use('/api-mboa', public_routes_1.default);

// ──────────────────────────────────────────────────────────────────────────────
// Routes utilitaires
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @route GET /
 * @description Health check — vérifie que l'API est opérationnelle.
 */
app.get('/', (req, res) => {
    res.json({ success: true, message: 'API MBOA NEXT STAR opérationnelle.' });
});

/**
 * @route ALL *
 * @description Catch-all pour les routes inexistantes (404).
 */
app.all('*', (req, res, next) => {
    next(new AppError_1.AppError(`La route ${req.originalUrl} n'existe pas sur ce serveur.`, 404));
});

// ──────────────────────────────────────────────────────────────────────────────
// Middleware de gestion des erreurs (DOIT être le DERNIER middleware monté)
// ──────────────────────────────────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);

// ──────────────────────────────────────────────────────────────────────────────
// Démarrage du serveur HTTP
// ──────────────────────────────────────────────────────────────────────────────
const whatsapp_service_1 = require("./services/whatsapp.service");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));

const PORT = parseInt(env_1.env.PORT, 10);

app.listen(PORT, async () => {
    console.log(`✅ Serveur MBOA NEXT STAR démarré sur le port ${PORT}`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);

    // Créer les dossiers d'upload si nécessaire
    await promises_1.default.mkdir(path_1.default.join(__dirname, '../uploads/candidates'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(__dirname, '../uploads/sponsors'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(__dirname, '../uploads/media'), { recursive: true });

    console.log('🔄 Initialisation du service WhatsApp...');
    await (0, whatsapp_service_1.initWhatsApp)();
});