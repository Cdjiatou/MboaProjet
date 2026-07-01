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

// Chargement de la configuration d'environnement en tout premier.
// Cet import doit être le premier pour que les variables d'environnement
// soient disponibles pour tous les modules importés ensuite.
// Le module `env` valide les variables requises (PORT, JWT_SECRET, DATABASE_URL, etc.)
// et lève une erreur explicite au démarrage si une variable est manquante.
import { env } from './config/env';

// Framework Express : choisi pour sa simplicité, son écosystème riche de
// middlewares et sa large adoption qui facilite le recrutement et la maintenance.
import express from 'express';

// CORS (Cross-Origin Resource Sharing) : nécessaire car le frontend et l'API
// sont hébergés sur des domaines/ports différents. Sans ce middleware, les
// navigateurs bloqueraient les requêtes du frontend vers l'API.
import cors from 'cors';

// ──────────────────────────────────────────────────────────────────────────────
// Import des routeurs par domaine fonctionnel
// ──────────────────────────────────────────────────────────────────────────────

// Routes d'authentification : login admin (POST /api/auth/login).
import authRoutes from './routes/auth.routes';

// Routes d'administration : CRUD candidats, stats, config, retraits, exports.
// Toutes protégées par le middleware authenticateAdmin.
import adminRoutes from './routes/admin.routes';

// Routes candidat : vérification OTP et complétion de profil.
import candidateRoutes from './routes/candidate.routes';

// Routes publiques : configuration, catégories, profils, votes, webhooks.
// Accessibles sans authentification.
import publicRoutes from './routes/public.routes';

// Middleware centralisé de gestion des erreurs : intercepte toutes les erreurs
// (AppError, erreurs Prisma, erreurs inattendues) et renvoie une réponse
// JSON formatée avec le code de statut approprié.
import { errorHandler } from './middlewares/errorHandler';

// Classe d'erreur personnalisée pour créer des erreurs HTTP structurées
// avec un code de statut et un message descriptif.
import { AppError } from './utils/AppError';

// ──────────────────────────────────────────────────────────────────────────────
// Initialisation de l'application Express
// ──────────────────────────────────────────────────────────────────────────────

const app = express();

// ──────────────────────────────────────────────────────────────────────────────
// Middlewares globaux (appliqués à TOUTES les routes)
// ──────────────────────────────────────────────────────────────────────────────

// Configuration CORS avec origines autorisées
// Accepte les requêtes provenant du frontend en production et en développement
const allowedOrigins = [
  'https://mboanextstar.com',
  'https://www.mboanextstar.com',
  'http://localhost:5173',      // Dev local Vite
  'http://localhost:3000',      // Dev local alternative
];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (ex: Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing automatique du body JSON des requêtes entrantes.
// Ce middleware transforme le corps brut de la requête en objet JavaScript
// accessible via `req.body`. Nécessaire pour tous les endpoints POST/PUT.
app.use(express.json());

// Servir les fichiers statiques depuis le répertoire uploads
// Les fichiers uploadés (photos de candidats) sont accessibles via /uploads/*
// Exemple: /uploads/candidates/1234567890_photo.jpg
app.use('/uploads', express.static('uploads'));

// ──────────────────────────────────────────────────────────────────────────────
// Montage des routeurs sur leurs préfixes d'URL
// ──────────────────────────────────────────────────────────────────────────────

// Chaque routeur est monté sur un préfixe qui correspond à son domaine fonctionnel.
// Cette organisation permet de :
// - Regrouper logiquement les routes par responsabilité.
// - Appliquer des middlewares spécifiques à un groupe de routes (ex: authenticateAdmin).
// - Faciliter la documentation et le versioning de l'API.

/** Routes d'authentification : POST /api-mboa/auth/login */
app.use('/api-mboa/auth', authRoutes);

/** Routes d'administration : /api-mboa/* (toutes protégées par JWT admin) */
app.use('/api-mboa/admin', adminRoutes);

/** Routes candidat : /api-mboa/candidates/* (verify-otp public, complete-profile protégé) */
app.use('/api-mboa/candidates', candidateRoutes);

/**
 * Routes publiques montées directement sur /api-mboa (sans sous-préfixe "public").
 * Exemples : GET /api-mboa/config, GET /api-mboa/categories, POST /api-mboa/votes/initiate.
 * Le choix de ne pas ajouter "/public" dans l'URL est délibéré : ces routes
 * sont les plus utilisées par le frontend et un chemin court améliore la lisibilité.
 */
app.use('/api-mboa', publicRoutes);

// ──────────────────────────────────────────────────────────────────────────────
// Routes utilitaires
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @route GET /
 * @description Health check / route racine.
 *
 * Cette route sert de point de vérification rapide pour confirmer que l'API
 * est opérationnelle. Utilisée par les outils de monitoring, les load balancers
 * et les scripts de déploiement pour vérifier que le serveur répond.
 */
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API MBOA NEXT STAR opérationnelle.' });
});

/**
 * @route ALL *
 * @description Catch-all pour les routes inexistantes (404).
 *
 * Ce handler doit être défini APRÈS toutes les routes valides. Il intercepte
 * toute requête ne correspondant à aucune route définie et crée une erreur 404
 * structurée via AppError. L'erreur est transmise au middleware errorHandler
 * via `next()` pour un formatage de réponse cohérent.
 *
 * L'utilisation de `app.all('*')` capture toutes les méthodes HTTP (GET, POST,
 * PUT, DELETE, etc.) sur n'importe quel chemin.
 */
app.all('*', (req, res, next) => {
  // Création d'une erreur 404 avec l'URL demandée pour faciliter le debugging.
  next(new AppError(`La route ${req.originalUrl} n'existe pas sur ce serveur.`, 404));
});

// ──────────────────────────────────────────────────────────────────────────────
// Middleware de gestion des erreurs (DOIT être le DERNIER middleware monté)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Middleware centralisé de gestion des erreurs.
 *
 * @description
 * Express reconnaît automatiquement les middlewares à 4 paramètres (err, req, res, next)
 * comme des gestionnaires d'erreurs. Ce middleware :
 * - Formate les erreurs AppError en réponses JSON structurées.
 * - Gère les erreurs Prisma (violations de contraintes, enregistrements non trouvés).
 * - Renvoie une erreur 500 générique pour les erreurs inattendues (sans exposer
 *   les détails internes en production).
 */
app.use(errorHandler);

// ──────────────────────────────────────────────────────────────────────────────
// Démarrage du serveur HTTP
// ──────────────────────────────────────────────────────────────────────────────

import { initWhatsApp } from './services/whatsapp.service';
import fs from 'fs/promises';
import path from 'path';

// Conversion explicite du port en nombre entier car les variables
// d'environnement sont toujours des strings.
const PORT = parseInt(env.PORT, 10);

/**
 * Démarrage de l'écoute sur le port configuré.
 */
app.listen(PORT, async () => {
  console.log(`✅ Serveur MBOA NEXT STAR démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);

  // Créer les dossiers d'upload si nécessaire
  await fs.mkdir(path.join(__dirname, '../uploads/candidates'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../uploads/sponsors'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../uploads/media'), { recursive: true });

  console.log('🔄 Initialisation du service WhatsApp...');
  await initWhatsApp();
});

