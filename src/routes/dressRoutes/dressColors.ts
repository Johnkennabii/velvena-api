import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { hybridAuthMiddleware, requireApiKeyScope } from "../../middleware/hybridAuthMiddleware.js";
import {
  getDressColors,
  createDressColor,
  updateDressColor,
  softDeleteDressColor,
  hardDeleteDressColor,
} from "../../controllers/dressController/dressColorController.js";

const router = Router();

router.get("/", hybridAuthMiddleware, requireApiKeyScope("read:dress-colors"), getDressColors);
router.post("/", authMiddleware, createDressColor);
router.put("/:id", authMiddleware, updateDressColor);
router.patch("/:id", authMiddleware, softDeleteDressColor);
router.delete("/:id", authMiddleware, hardDeleteDressColor);

export default router;