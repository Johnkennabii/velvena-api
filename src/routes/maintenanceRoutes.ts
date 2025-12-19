// src/routes/maintenanceRoutes.ts

import express from "express";
import { toggleMaintenance } from "../controllers/maintenanceController.js";
import {
  runSubscriptionMaintenanceJobs,
  processExpiredTrials,
  processExpiredSubscriptions,
} from "../jobs/trialExpirationJob.js";
import { getSchedulerInfo } from "../jobs/scheduler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/webhook/maintenance
router.post("/webhook/maintenance", toggleMaintenance);

// GET /maintenance/jobs/scheduler-info - Informations sur le scheduler
router.get("/jobs/scheduler-info", authMiddleware, async (req, res) => {
  try {
    const info = getSchedulerInfo();
    res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /maintenance/jobs/run-all - Exécuter tous les jobs de maintenance manuellement
router.post("/jobs/run-all", authMiddleware, async (req, res) => {
  try {
    const results = await runSubscriptionMaintenanceJobs();
    res.status(200).json({
      success: true,
      message: "Jobs de maintenance exécutés avec succès",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /maintenance/jobs/expired-trials - Traiter uniquement les trials expirés
router.post("/jobs/expired-trials", authMiddleware, async (req, res) => {
  try {
    const result = await processExpiredTrials();
    res.status(200).json({
      success: true,
      message: "Traitement des trials expirés terminé",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /maintenance/jobs/expired-subscriptions - Traiter uniquement les souscriptions expirées
router.post("/jobs/expired-subscriptions", authMiddleware, async (req, res) => {
  try {
    const result = await processExpiredSubscriptions();
    res.status(200).json({
      success: true,
      message: "Traitement des souscriptions expirées terminé",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
