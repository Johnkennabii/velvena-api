/**
 * Contract Template Routes
 * Routes pour gérer les templates de contrats
 */

import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  softDeleteTemplate,
  duplicateTemplate,
  previewTemplate,
  validateTemplateSyntax,
} from "../controllers/contractTemplateController.js";

const router = Router();

/**
 * @route   GET /api/contract-templates
 * @desc    Get all contract templates (filtered by organization)
 * @access  Private
 * @query   ?contract_type_id=xxx&is_active=true
 */
router.get("/", authMiddleware, getAllTemplates);

/**
 * @route   GET /api/contract-templates/:id
 * @desc    Get template by ID
 * @access  Private
 */
router.get("/:id", authMiddleware, getTemplateById);

/**
 * @route   POST /api/contract-templates
 * @desc    Create a new template
 * @access  Private
 * @body    { name, description?, contract_type_id, content, is_default? }
 */
router.post("/", authMiddleware, createTemplate);

/**
 * @route   PUT /api/contract-templates/:id
 * @desc    Update template
 * @access  Private
 * @body    { name?, description?, content?, is_active?, is_default? }
 */
router.put("/:id", authMiddleware, updateTemplate);

/**
 * @route   DELETE /api/contract-templates/:id
 * @desc    Soft delete template
 * @access  Private
 */
router.delete("/:id", authMiddleware, softDeleteTemplate);

/**
 * @route   POST /api/contract-templates/:id/duplicate
 * @desc    Duplicate a template
 * @access  Private
 */
router.post("/:id/duplicate", authMiddleware, duplicateTemplate);

/**
 * @route   GET /api/contract-templates/:id/preview
 * @desc    Preview template with contract data
 * @access  Private
 * @query   ?contract_id=xxx (optional, uses demo data if not provided)
 */
router.get("/:id/preview", authMiddleware, previewTemplate);

/**
 * @route   POST /api/contract-templates/validate
 * @desc    Validate template syntax
 * @access  Private
 * @body    { content }
 */
router.post("/validate", authMiddleware, validateTemplateSyntax);

export default router;
