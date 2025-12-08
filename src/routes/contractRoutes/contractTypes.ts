import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getContractTypes,
  getContractTypeById,
  createContractType,
  updateContractType,
  softDeleteContractType,
  hardDeleteContractType,
} from "../../controllers/contractController/contractTypeController.js";

const router = Router();

router.get("/", authMiddleware, getContractTypes);
router.get("/:id", authMiddleware, getContractTypeById);
router.post("/", authMiddleware, createContractType);
router.put("/:id", authMiddleware, updateContractType);
router.patch("/:id/soft", authMiddleware, softDeleteContractType);
router.delete("/:id/hard", authMiddleware, hardDeleteContractType);

export default router;