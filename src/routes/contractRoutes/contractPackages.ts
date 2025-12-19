import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getAllContractPackages,
  getContractPackageById,
  createContractPackage,
  updateContractPackage,
  softDeleteContractPackage,
  hardDeleteContractPackage,
} from "../../controllers/contractController/contractPackageController.js";

const router = Router();

router.get("/", authMiddleware, getAllContractPackages);
router.get("/:id", authMiddleware, getContractPackageById);
router.post("/", authMiddleware, createContractPackage);
router.put("/:id", authMiddleware, updateContractPackage);
router.patch("/:id/soft", authMiddleware, softDeleteContractPackage);
router.delete("/:id/hard", authMiddleware, hardDeleteContractPackage);

export default router;