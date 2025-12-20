import { Router, type Request, type Response } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  requestAccountDeletion,
  confirmAccountDeletion,
} from "../services/accountDeletionService.js";
import pino from "../lib/logger.js";

const router = Router();

/**
 * @route POST /account/request-deletion
 * @desc Request account deletion - sends validation code by email
 * @access Private (Owner/Admin only)
 */
router.post(
  "/request-deletion",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const organizationId = (req as any).user?.organizationId;

      if (!userId || !organizationId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      pino.info(
        { userId, organizationId },
        "📨 Account deletion request received"
      );

      const result = await requestAccountDeletion(organizationId, userId, req);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      pino.error({ error }, "❌ Error requesting account deletion");

      res.status(500).json({
        success: false,
        error: "Failed to process deletion request",
      });
    }
  }
);

/**
 * @route POST /account/confirm-deletion
 * @desc Confirm account deletion with validation code
 * @access Private (Owner/Admin only)
 * @body { validationCode: string }
 */
router.post(
  "/confirm-deletion",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const organizationId = (req as any).user?.organizationId;
      const { validationCode } = req.body;

      if (!userId || !organizationId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Validation code is optional for admins (they can send empty string or "ADMIN_BYPASS")
      // For owners, it's required
      const codeToUse = validationCode || "ADMIN_BYPASS";

      pino.info(
        { userId, organizationId },
        "🔐 Account deletion confirmation received"
      );

      const result = await confirmAccountDeletion(
        organizationId,
        codeToUse.toString(),
        userId,
        req
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.message,
        });
        return;
      }

      pino.info(
        { organizationId, deletedData: result.deletedData },
        "✅ Account successfully deleted"
      );

      res.status(200).json({
        success: true,
        message: result.message,
        deletedData: result.deletedData,
      });
    } catch (error) {
      pino.error({ error }, "❌ Error confirming account deletion");

      res.status(500).json({
        success: false,
        error: "Failed to complete account deletion",
      });
    }
  }
);

export default router;
