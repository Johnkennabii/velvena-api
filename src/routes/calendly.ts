import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  oauthCallback,
  getIntegrationStatus,
  disconnectIntegration,
  triggerSync,
  getCalendlyEvents,
  handleWebhook,
} from "../controllers/calendlyController.js";

const router = express.Router();

/**
 * PUBLIC ROUTES (no authentication required)
 */

/**
 * @route POST /calendly/webhook
 * @desc Handle Calendly webhook events
 * @access Public (verified by webhook signature)
 */
router.post("/webhook", handleWebhook);

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
