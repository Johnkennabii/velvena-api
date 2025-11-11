import { Router } from "express";
import {
  getAllContractPackages,
  getContractPackageById,
  createContractPackage,
  updateContractPackage,
  softDeleteContractPackage,
  hardDeleteContractPackage,
} from "../../controllers/contractController/contractPackageController.js";

const router = Router();

router.get("/", getAllContractPackages);
router.get("/:id", getContractPackageById);
router.post("/", createContractPackage);
router.put("/:id", updateContractPackage);
router.patch("/:id/soft", softDeleteContractPackage);
router.delete("/:id/hard", hardDeleteContractPackage);

export default router;