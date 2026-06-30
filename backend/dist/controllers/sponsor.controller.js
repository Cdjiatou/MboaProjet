"use strict";
/**
 * @file sponsor.controller.ts
 * @description Contrôleur pour la gestion des sponsors et leurs médias
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicSponsors = exports.deleteSponsorMedia = exports.updateSponsorMedia = exports.getSponsorMedia = exports.addSponsorMedia = exports.deleteSponsor = exports.updateSponsor = exports.createSponsor = exports.getSponsorById = exports.getAllSponsors = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const sponsorService = __importStar(require("../services/sponsor.service"));
/**
 * GET /api/admin/sponsors
 * Récupère tous les sponsors
 */
exports.getAllSponsors = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const includeInactive = req.query.includeInactive === 'true';
    const sponsors = await sponsorService.getAllSponsors(includeInactive);
    res.json({
        success: true,
        data: sponsors,
    });
});
/**
 * GET /api/admin/sponsors/:id
 * Récupère un sponsor par son ID
 */
exports.getSponsorById = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sponsor = await sponsorService.getSponsorById(parseInt(req.params.id));
    res.json({
        success: true,
        data: sponsor,
    });
});
/**
 * POST /api/admin/sponsors
 * Crée un nouveau sponsor
 */
exports.createSponsor = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sponsor = await sponsorService.createSponsor(req.body);
    res.status(201).json({
        success: true,
        data: sponsor,
        message: 'Sponsor créé avec succès',
    });
});
/**
 * PATCH /api/admin/sponsors/:id
 * Met à jour un sponsor
 */
exports.updateSponsor = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sponsor = await sponsorService.updateSponsor(parseInt(req.params.id), req.body);
    res.json({
        success: true,
        data: sponsor,
        message: 'Sponsor mis à jour avec succès',
    });
});
/**
 * DELETE /api/admin/sponsors/:id
 * Supprime un sponsor
 */
exports.deleteSponsor = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const result = await sponsorService.deleteSponsor(parseInt(req.params.id));
    res.json({
        success: true,
        message: result.message,
    });
});
/**
 * POST /api/admin/sponsors/:id/media
 * Ajoute un média à un sponsor
 */
exports.addSponsorMedia = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
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
});
/**
 * GET /api/admin/sponsors/:id/media
 * Récupère tous les médias d'un sponsor
 */
exports.getSponsorMedia = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const media = await sponsorService.getSponsorMedia(parseInt(req.params.id));
    res.json({
        success: true,
        data: media,
    });
});
/**
 * PATCH /api/admin/media/:id
 * Met à jour un média
 */
exports.updateSponsorMedia = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const media = await sponsorService.updateSponsorMedia(parseInt(req.params.id), req.body);
    res.json({
        success: true,
        data: media,
        message: 'Média mis à jour avec succès',
    });
});
/**
 * DELETE /api/admin/media/:id
 * Supprime un média
 */
exports.deleteSponsorMedia = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const result = await sponsorService.deleteSponsorMedia(parseInt(req.params.id));
    res.json({
        success: true,
        message: result.message,
    });
});
/**
 * GET /api/sponsors
 * Récupère tous les sponsors actifs (route publique)
 */
exports.getPublicSponsors = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sponsors = await sponsorService.getAllSponsors(false);
    res.json({
        success: true,
        data: sponsors,
    });
});
