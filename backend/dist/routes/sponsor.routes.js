"use strict";
/**
 * @file sponsor.routes.ts
 * @description Routes pour la gestion des sponsors (admin uniquement)
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
const express_1 = require("express");
const sponsorController = __importStar(require("../controllers/sponsor.controller"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Toutes les routes sont protégées par authenticateAdmin
router.use(authMiddleware_1.authenticateAdmin);
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
exports.default = router;
