import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getPricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePriceEndpoint,
} from "../controllers/pricingRuleController.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /pricing-rules
 * @desc Get all pricing rules (global + org-specific)
 * @access Private
 */
router.get("/", getPricingRules);

/**
 * @route POST /pricing-rules/calculate
 * @desc Calculate price for a given context
 * @access Private
 */
router.post("/calculate", calculatePriceEndpoint);

/**
 * @route GET /pricing-rules/:id
 * @desc Get pricing rule by ID
 * @access Private
 */
router.get("/:id", getPricingRuleById);

/**
 * @route POST /pricing-rules
 * @desc Create a new pricing rule (org-specific)
 * @access Private (Admin)
 */
router.post("/", createPricingRule);

/**
 * @route PUT /pricing-rules/:id
 * @desc Update pricing rule
 * @access Private (Admin)
 */
router.put("/:id", updatePricingRule);

/**
 * @route DELETE /pricing-rules/:id
 * @desc Delete pricing rule (soft delete)
 * @access Private (Admin)
 */
router.delete("/:id", deletePricingRule);

export default router;
