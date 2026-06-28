/**
 * @file sponsor.controller.ts
 * @description Contrôleur pour la gestion des sponsors et leurs médias
 */

import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as sponsorService from '../services/sponsor.service';

/**
 * GET /api/admin/sponsors
 * Récupère tous les sponsors
 */
export const getAllSponsors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const includeInactive = req.query.includeInactive === 'true';
    const sponsors = await sponsorService.getAllSponsors(includeInactive);

    res.json({
      success: true,
      data: sponsors,
    });
  }
);

/**
 * GET /api/admin/sponsors/:id
 * Récupère un sponsor par son ID
 */
export const getSponsorById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sponsor = await sponsorService.getSponsorById(
      parseInt(req.params.id)
    );

    res.json({
      success: true,
      data: sponsor,
    });
  }
);

/**
 * POST /api/admin/sponsors
 * Crée un nouveau sponsor
 */
export const createSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sponsor = await sponsorService.createSponsor(req.body);

    res.status(201).json({
      success: true,
      data: sponsor,
      message: 'Sponsor créé avec succès',
    });
  }
);

/**
 * PATCH /api/admin/sponsors/:id
 * Met à jour un sponsor
 */
export const updateSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sponsor = await sponsorService.updateSponsor(
      parseInt(req.params.id),
      req.body
    );

    res.json({
      success: true,
      data: sponsor,
      message: 'Sponsor mis à jour avec succès',
    });
  }
);

/**
 * DELETE /api/admin/sponsors/:id
 * Supprime un sponsor
 */
export const deleteSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await sponsorService.deleteSponsor(
      parseInt(req.params.id)
    );

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * POST /api/admin/sponsors/:id/media
 * Ajoute un média à un sponsor
 */
export const addSponsorMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sponsorId = parseInt(req.params.id);
    const media = await sponsorService.addSponsorMedia({
      ...req.body,
      sponsorId,
    });

    res.status(201).json({
      success: true,
      data: media,
      message: 'Média ajouté avec succès',
    });
  }
);

/**
 * GET /api/admin/sponsors/:id/media
 * Récupère tous les médias d'un sponsor
 */
export const getSponsorMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const media = await sponsorService.getSponsorMedia(
      parseInt(req.params.id)
    );

    res.json({
      success: true,
      data: media,
    });
  }
);

/**
 * PATCH /api/admin/media/:id
 * Met à jour un média
 */
export const updateSponsorMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const media = await sponsorService.updateSponsorMedia(
      parseInt(req.params.id),
      req.body
    );

    res.json({
      success: true,
      data: media,
      message: 'Média mis à jour avec succès',
    });
  }
);

/**
 * DELETE /api/admin/media/:id
 * Supprime un média
 */
export const deleteSponsorMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await sponsorService.deleteSponsorMedia(
      parseInt(req.params.id)
    );

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * GET /api/sponsors
 * Récupère tous les sponsors actifs (route publique)
 */
export const getPublicSponsors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sponsors = await sponsorService.getAllSponsors(false);

    res.json({
      success: true,
      data: sponsors,
    });
  }
);
