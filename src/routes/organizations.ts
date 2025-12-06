import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMyOrganization,
  updateMyOrganization,
  getOrganizationStats,
  createOrganization,
  listOrganizations,
} from "../controllers/organizationController.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /organizations/me
 * @desc Get current user's organization
 * @access Private
 */
router.get("/me", getMyOrganization);

/**
 * @route PUT /organizations/me
 * @desc Update current user's organization
 * @access Private (Admin only - add role check middleware)
 */
router.put("/me", updateMyOrganization);

/**
 * @route GET /organizations/me/stats
 * @desc Get statistics for current user's organization
 * @access Private
 */
router.get("/me/stats", getOrganizationStats);

/**
 * SUPER ADMIN ROUTES
 * TODO: Add super-admin middleware to protect these routes
 */

/**
 * @route POST /organizations
 * @desc Create a new organization (super-admin only)
 * @access Private (Super Admin)
 */
router.post("/", createOrganization);

/**
 * @route GET /organizations
 * @desc List all organizations (super-admin only)
 * @access Private (Super Admin)
 */
router.get("/", listOrganizations);

export default router;
