// routes/dressTypes.ts
import { Router } from "express";
import {
  getDressTypes,
  createDressType,
  updateDressType,
  softDeleteDressType,
  hardDeleteDressType,
} from "../../controllers/dressController/dressTypeController.js";
import pino from "../../lib/logger.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { hybridAuthMiddleware, requireApiKeyScope } from "../../middleware/hybridAuthMiddleware.js";

const router = Router();

router.get("/", hybridAuthMiddleware, requireApiKeyScope("read:dress-types"), (req, res) => {
  pino.info("📌 GET /dress-types called");
  return getDressTypes(req, res);
});

router.post("/", authMiddleware, (req, res) => {
  pino.info("📌 POST /dress-types called");
  return createDressType(req, res);
});

router.put("/:id", authMiddleware, (req, res) => {
  pino.info("📌 PUT /dress-types/:id called");
  return updateDressType(req, res);
});

// Soft delete
router.patch("/:id", authMiddleware, (req, res) => {
  pino.info("📌 PATCH /dress-types/:id called");
  return softDeleteDressType(req, res);
});

// Hard delete (ex: /dress-types/:id/hard)
router.delete("/:id", authMiddleware, (req, res) => {
  pino.info("📌 DELETE (hard) /dress-types/:id/hard called");
  return hardDeleteDressType(req, res);
});

export default router;