import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  oauthCallback,
  getIntegrationStatus,
  disconnectIntegration,
  triggerSync,
  getCalendlyEvents,
} from "../controllers/calendlyController.js";

const router = express.Router();

/**
 * Note: /calendly/webhook is mounted directly in server.ts with raw body middleware
 * This allows proper signature verification before JSON parsing
 */

/**
 * AUTHENTICATED ROUTES
 */
// All routes below require authentication
router.use(authMiddleware);

/**
 * @route POST /calendly/oauth/callback
 * @desc Complete OAuth flow and exchange code for tokens
 * @access Private
 */
router.post("/oauth/callback", oauthCallback);

/**
 * @route GET /calendly/status
 * @desc Get current Calendly integration status
 * @access Private
 */
router.get("/status", getIntegrationStatus);

/**
 * @route DELETE /calendly/disconnect
 * @desc Disconnect Calendly integration
 * @access Private
 */
router.delete("/disconnect", disconnectIntegration);

/**
 * @route POST /calendly/sync
 * @desc Manually trigger Calendly events sync
 * @access Private
 */
router.post("/sync", triggerSync);

/**
 * @route GET /calendly/events
 * @desc Get synced Calendly events for the organization
 * @access Private
 */
router.get("/events", getCalendlyEvents);

export default router;
