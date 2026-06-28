/**
 * @file sponsor.routes.ts
 * @description Routes pour la gestion des sponsors (admin uniquement)
 */

import { Router } from 'express';
import * as sponsorController from '../controllers/sponsor.controller';
import { authenticateAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Toutes les routes sont protégées par authenticateAdmin
router.use(authenticateAdmin);

// Routes pour les sponsors
router.get('/', sponsorController.getAllSponsors);
router.get('/:id', sponsorController.getSponsorById);
router.post('/', sponsorController.createSponsor);
router.patch('/:id', sponsorController.updateSponsor);
router.delete('/:id', sponsorController.deleteSponsor);

// Routes pour les médias d'un sponsor
router.get('/:id/media', sponsorController.getSponsorMedia);
router.post('/:id/media', sponsorController.addSponsorMedia);

// Routes pour gérer un média spécifique
router.patch('/media/:id', sponsorController.updateSponsorMedia);
router.delete('/media/:id', sponsorController.deleteSponsorMedia);

export default router;
