/**
 * Data Export Routes
 *
 * API endpoints for exporting organization data
 * - Export all data as ZIP (contracts, invoices, clients, prospects)
 * - Download exported ZIP file
 *
 * Feature gate: export_data (Enterprise plan only)
 */

import { Router, type Request, type Response } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkFeature } from "../utils/subscriptionManager.js";
import {
  exportOrganizationData,
  cleanupOldExports,
} from "../services/dataExportService.js";
import pino from "../lib/logger.js";
import fs from "fs";
import path from "path";

const router = Router();

/**
 * @route POST /api/data-export/create
 * @desc Create a data export (ZIP file) for the organization
 * @access Private (requires export_data feature - Enterprise plan)
 */
router.post(
  "/create",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;
      const userId = (req as any).user?.id;

      if (!organizationId) {
        res.status(401).json({
          success: false,
          error: "Organization context required",
        });
        return;
      }

      // Check if organization has access to export_data feature
      const featureCheck = await checkFeature(organizationId, "export_data");

      if (!featureCheck.allowed) {
        res.status(403).json({
          success: false,
          error: "Data export feature not available in your plan",
          upgrade_required: featureCheck.upgrade_required,
          message: `Please upgrade to ${featureCheck.upgrade_required || "Enterprise"} plan to export your data`,
        });
        return;
      }

      pino.info(
        { organizationId, userId },
        "🗜️ Starting data export request"
      );

      // Create the export
      const result = await exportOrganizationData(organizationId);

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error || "Failed to create data export",
        });
        return;
      }

      // Get file name from path
      const fileName = result.zipPath ? path.basename(result.zipPath) : undefined;

      pino.info(
        { organizationId, stats: result.stats },
        "✅ Data export created successfully"
      );

      res.status(200).json({
        success: true,
        message: "Data export created successfully",
        fileName,
        stats: result.stats,
        downloadUrl: `/api/data-export/download/${fileName}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      });
    } catch (error) {
      pino.error({ error }, "❌ Error creating data export");

      res.status(500).json({
        success: false,
        error: "Failed to create data export",
      });
    }
  }
);

/**
 * @route GET /api/data-export/download/:filename
 * @desc Download an exported ZIP file
 * @access Private (requires export_data feature - Enterprise plan)
 */
router.get(
  "/download/:filename",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;
      const { filename } = req.params;

      if (!organizationId) {
        res.status(401).json({
          success: false,
          error: "Organization context required",
        });
        return;
      }

      if (!filename) {
        res.status(400).json({
          success: false,
          error: "Filename is required",
        });
        return;
      }

      // Check if organization has access to export_data feature
      const featureCheck = await checkFeature(organizationId, "export_data");

      if (!featureCheck.allowed) {
        res.status(403).json({
          success: false,
          error: "Data export feature not available in your plan",
        });
        return;
      }

      // Security: Verify filename belongs to this organization
      if (!filename.includes(`organization_${organizationId}_`)) {
        res.status(403).json({
          success: false,
          error: "Unauthorized access to this file",
        });
        return;
      }

      // Sanitize filename to prevent directory traversal
      const sanitizedFilename = path.basename(filename);
      const filePath = path.join(
        process.cwd(),
        "temp",
        "exports",
        sanitizedFilename
      );

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: "Export file not found or has expired",
        });
        return;
      }

      pino.info(
        { organizationId, filename: sanitizedFilename },
        "📥 Downloading data export"
      );

      // Send file
      res.download(filePath, sanitizedFilename, (err) => {
        if (err) {
          pino.error({ err }, "❌ Error downloading file");
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: "Failed to download file",
            });
          }
        }
      });
    } catch (error) {
      pino.error({ error }, "❌ Error downloading data export");

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to download data export",
        });
      }
    }
  }
);

/**
 * @route POST /api/data-export/cleanup
 * @desc Manually trigger cleanup of old export files (admin only)
 * @access Private (Admin only)
 */
router.post(
  "/cleanup",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Add admin role check here when role-based access control is implemented

      pino.info("🗑️ Manual cleanup of old exports triggered");

      await cleanupOldExports();

      res.status(200).json({
        success: true,
        message: "Old export files cleaned up successfully",
      });
    } catch (error) {
      pino.error({ error }, "❌ Error cleaning up old exports");

      res.status(500).json({
        success: false,
        error: "Failed to cleanup old exports",
      });
    }
  }
);

export default router;
