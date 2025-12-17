/**
 * POC Routes - Unified Template System
 */

import express from "express";
import {
  renderDemoTemplate,
  renderTemplateWithContract,
  getTemplateStructure,
  saveTemplateStructure,
} from "../controllers/pocTemplateController.js";

const router = express.Router();

/**
 * @route   GET /poc/template/demo
 * @desc    Rendre le template de démo avec données fictives
 * @access  Public (pour le POC)
 */
router.get("/demo", renderDemoTemplate);

/**
 * @route   GET /poc/template/contract/:contractId
 * @desc    Rendre le template avec un vrai contrat
 * @access  Public (pour le POC)
 */
router.get("/contract/:contractId", renderTemplateWithContract);

/**
 * @route   GET /poc/template/structure
 * @desc    Obtenir la structure JSON du template
 * @access  Public (pour le POC)
 */
router.get("/structure", getTemplateStructure);

/**
 * @route   POST /poc/template/structure
 * @desc    Sauvegarder/valider une structure de template
 * @access  Public (pour le POC)
 */
router.post("/structure", saveTemplateStructure);

export default router;
