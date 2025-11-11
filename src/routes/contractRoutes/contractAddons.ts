import { Router } from "express";
import {
  getContractAddons,
  getContractAddonById,
  createContractAddon,
  updateContractAddon,
  softDeleteContractAddon,
  hardDeleteContractAddon,
} from "../../controllers/contractController/contractAddonController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getContractAddons);
router.get("/:id", authMiddleware, getContractAddonById);
router.post("/", authMiddleware, createContractAddon);
router.put("/:id", authMiddleware, updateContractAddon);
router.patch("/:id/soft", authMiddleware, softDeleteContractAddon);
router.delete("/:id/hard", authMiddleware, hardDeleteContractAddon);

export default router;