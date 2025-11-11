// src/routes/contractRoutes/contractRoutes.ts
import authMiddleware from "../../middleware/authMiddleware.js"
import { Router, type Request, type Response } from "express";

import {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  softDeleteContract,
  restoreContract,
  hardDeleteContract,
  getContractsFullView,
  generateSignatureLink,
  getContractSignLink,
  signContractViaLink,
  generateContractPdfManually,
  uploadSignedContractPdf,
  uploadSignedPdfMiddleware
} from "../../controllers/contractController/contractController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", getAllContracts);
// Support optional customer_id as query param
router.get("/full-view", getContractsFullView);
// New RESTful route for full-view by customerId
router.get("/customers/:customerId/full-view", getContractsFullView);
// Redirect to frontend signing page with token
router.get("/sign/:token", (req: Request, res: Response) => {
  const { token } = req.params as { token: string };
  return res.redirect(302, `https://allure-creation.fr/sign/${token}`);
});
router.get("/:id", getContractById);
router.post("/", createContract);
router.put("/:id", updateContract);
router.patch("/:id/restore", restoreContract);
router.patch("/:id", softDeleteContract);
router.delete("/:id/hard", hardDeleteContract);
router.post("/:id/generate-signature", generateSignatureLink);
router.post("/:id/generate-pdf", generateContractPdfManually);
router.post("/:id/upload-signed-pdf", uploadSignedPdfMiddleware, uploadSignedContractPdf);
router.get("/sign-links/:token", getContractSignLink);
router.post("/sign-links/:token/sign", signContractViaLink);

export default router;
