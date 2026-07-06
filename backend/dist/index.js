"use strict";
/**
 * @file index.ts
 * @description Point d'entrée principal de l'API MBOA NEXT STAR.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
// Middlewares globaux (appliqués à TOUTES les routes)
// ──────────────────────────────────────────────────────────────────────────────
// ✅ CORRECTIF 1 — URL O2switch ajoutée dans la liste
const allowedOrigins = [
    'https://mboa-next-star.vercel.app', // ← remplacez par votre URL O2switch exacte
    'http://localhost:5173',
    'http://localhost:3000',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origine (ex: Postman, curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // ✅ CORRECTIF 2 — callback(null, false) au lieu de callback(new Error(...))
            // L'ancienne version causait les "🔥 ERREUR NON GÉRÉE" dans les logs Railway
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
// ──────────────────────────────────────────────────────────────────────────────
// Montage des routeurs sur leurs préfixes d'URL
// ──────────────────────────────────────────────────────────────────────────────
app.use('/api-mboa/auth', auth_routes_1.default);
app.use('/api-mboa/admin', admin_routes_1.default);
app.use('/api-mboa/candidates', candidate_routes_1.default);
app.use('/api-mboa', public_routes_1.default);
// ──────────────────────────────────────────────────────────────────────────────
// Routes utilitaires
// ──────────────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ success: true, message: 'API MBOA NEXT STAR opérationnelle.' });
});
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
    await promises_1.default.mkdir(path_1.default.join(__dirname, '../uploads/candidates'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(__dirname, '../uploads/sponsors'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(__dirname, '../uploads/media'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(__dirname, '../uploads/temp'), { recursive: true });
    console.log('🔄 Initialisation du service WhatsApp...');
    await (0, whatsapp_service_1.initWhatsApp)();
});
