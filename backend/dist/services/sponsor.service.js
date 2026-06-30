"use strict";
/**
 * @file sponsor.service.ts
 * @description Service de gestion des sponsors et leurs médias
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSponsorMedia = exports.deleteSponsorMedia = exports.updateSponsorMedia = exports.addSponsorMedia = exports.deleteSponsor = exports.updateSponsor = exports.createSponsor = exports.getSponsorById = exports.getAllSponsors = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
/**
 * Récupère tous les sponsors actifs avec leurs médias
 */
const getAllSponsors = async (includeInactive = false) => {
    const sponsors = await prisma_1.default.sponsor.findMany({
        where: includeInactive ? undefined : { isActive: true },
        include: {
            media: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
            },
        },
        orderBy: { displayOrder: 'asc' },
    });
    return sponsors;
};
exports.getAllSponsors = getAllSponsors;
/**
 * Récupère un sponsor par son ID
 */
const getSponsorById = async (id) => {
    const sponsor = await prisma_1.default.sponsor.findUnique({
        where: { id },
        include: {
            media: {
                orderBy: { displayOrder: 'asc' },
            },
        },
    });
    if (!sponsor) {
        throw new AppError_1.AppError('Sponsor introuvable', 404);
    }
    return sponsor;
};
exports.getSponsorById = getSponsorById;
/**
 * Crée un nouveau sponsor
 */
const createSponsor = async (data) => {
    const sponsor = await prisma_1.default.sponsor.create({
        data: {
            name: data.name,
            description: data.description,
            websiteUrl: data.websiteUrl,
            logoUrl: data.logoUrl,
            tier: data.tier || 'PARTNER',
            displayOrder: data.displayOrder || 0,
            isActive: data.isActive !== undefined ? data.isActive : true,
        },
        include: {
            media: true,
        },
    });
    return sponsor;
};
exports.createSponsor = createSponsor;
/**
 * Met à jour un sponsor
 */
const updateSponsor = async (id, data) => {
    // Vérifier que le sponsor existe
    await (0, exports.getSponsorById)(id);
    const sponsor = await prisma_1.default.sponsor.update({
        where: { id },
        data,
        include: {
            media: {
                orderBy: { displayOrder: 'asc' },
            },
        },
    });
    return sponsor;
};
exports.updateSponsor = updateSponsor;
/**
 * Supprime un sponsor
 */
const deleteSponsor = async (id) => {
    // Vérifier que le sponsor existe
    await (0, exports.getSponsorById)(id);
    await prisma_1.default.sponsor.delete({
        where: { id },
    });
    return { message: 'Sponsor supprimé avec succès' };
};
exports.deleteSponsor = deleteSponsor;
/**
 * Ajoute un média à un sponsor
 */
const addSponsorMedia = async (data) => {
    // Vérifier que le sponsor existe
    await (0, exports.getSponsorById)(data.sponsorId);
    const media = await prisma_1.default.sponsorMedia.create({
        data: {
            sponsorId: data.sponsorId,
            mediaType: data.mediaType,
            mediaUrl: data.mediaUrl,
            thumbnailUrl: data.thumbnailUrl,
            title: data.title,
            description: data.description,
            displayOrder: data.displayOrder || 0,
            isActive: data.isActive !== undefined ? data.isActive : true,
        },
    });
    return media;
};
exports.addSponsorMedia = addSponsorMedia;
/**
 * Met à jour un média
 */
const updateSponsorMedia = async (id, data) => {
    const media = await prisma_1.default.sponsorMedia.findUnique({
        where: { id },
    });
    if (!media) {
        throw new AppError_1.AppError('Média introuvable', 404);
    }
    const updatedMedia = await prisma_1.default.sponsorMedia.update({
        where: { id },
        data,
    });
    return updatedMedia;
};
exports.updateSponsorMedia = updateSponsorMedia;
/**
 * Supprime un média
 */
const deleteSponsorMedia = async (id) => {
    const media = await prisma_1.default.sponsorMedia.findUnique({
        where: { id },
    });
    if (!media) {
        throw new AppError_1.AppError('Média introuvable', 404);
    }
    await prisma_1.default.sponsorMedia.delete({
        where: { id },
    });
    return { message: 'Média supprimé avec succès' };
};
exports.deleteSponsorMedia = deleteSponsorMedia;
/**
 * Récupère tous les médias d'un sponsor
 */
const getSponsorMedia = async (sponsorId) => {
    const media = await prisma_1.default.sponsorMedia.findMany({
        where: { sponsorId },
        orderBy: { displayOrder: 'asc' },
    });
    return media;
};
exports.getSponsorMedia = getSponsorMedia;
