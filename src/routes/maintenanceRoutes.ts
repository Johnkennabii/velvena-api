// src/routes/maintenanceRoutes.ts

import express from "express";
import { toggleMaintenance } from "../controllers/maintenanceController.js";

const router = express.Router();

// POST /api/webhook/maintenance
router.post("/webhook/maintenance", toggleMaintenance);

export default router;
