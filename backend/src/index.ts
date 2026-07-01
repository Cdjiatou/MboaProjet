/**
 * @file index.ts
 * @description Point d'entrée principal de l'API MBOA NEXT STAR.
 */

import { env } from './config/env';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import candidateRoutes from './routes/candidate.routes';
import publicRoutes from './routes/public.routes';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/AppError';

// ──────────────────────────────────────────────────────────────────────────────
// Initialisation de l'application Express
// ──────────────────────────────────────────────────────────────────────────────

const app = express();

// ──────────────────────────────────────────────────────────────────────────────
// Middlewares globaux (appliqués à TOUTES les routes)
// ──────────────────────────────────────────────────────────────────────────────

// ✅ CORRECTIF 1 — URL O2switch ajoutée dans la liste
const allowedOrigins = [
  'https://mboa-next-star.vercel.app', // ← remplacez par votre URL O2switch exacte
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (ex: Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // ✅ CORRECTIF 2 — callback(null, false) au lieu de callback(new Error(...))
      // L'ancienne version causait les "🔥 ERREUR NON GÉRÉE" dans les logs Railway
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ──────────────────────────────────────────────────────────────────────────────
// Montage des routeurs sur leurs préfixes d'URL
// ──────────────────────────────────────────────────────────────────────────────

app.use('/api-mboa/auth', authRoutes);
app.use('/api-mboa/admin', adminRoutes);
app.use('/api-mboa/candidates', candidateRoutes);
app.use('/api-mboa', publicRoutes);

// ──────────────────────────────────────────────────────────────────────────────
// Routes utilitaires
// ──────────────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API MBOA NEXT STAR opérationnelle.' });
});

app.all('*', (req, res, next) => {
  next(new AppError(`La route ${req.originalUrl} n'existe pas sur ce serveur.`, 404));
});

// ──────────────────────────────────────────────────────────────────────────────
// Middleware de gestion des erreurs (DOIT être le DERNIER middleware monté)
// ──────────────────────────────────────────────────────────────────────────────

app.use(errorHandler);

// ──────────────────────────────────────────────────────────────────────────────
// Démarrage du serveur HTTP
// ──────────────────────────────────────────────────────────────────────────────

import { initWhatsApp } from './services/whatsapp.service';
import fs from 'fs/promises';
import path from 'path';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, async () => {
  console.log(`✅ Serveur MBOA NEXT STAR démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);

  await fs.mkdir(path.join(__dirname, '../uploads/candidates'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../uploads/sponsors'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../uploads/media'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../uploads/temp'), { recursive: true });

  console.log('🔄 Initialisation du service WhatsApp...');
  await initWhatsApp();
});