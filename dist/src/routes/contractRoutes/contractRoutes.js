// src/routes/contractRoutes/contractRoutes.ts
import authMiddleware from "../../middleware/authMiddleware.js";
import { hybridAuthMiddleware, requireApiKeyScope } from "../../middleware/hybridAuthMiddleware.js";
import { Router } from "express";
import { getAllContracts, getContractById, createContract, updateContract, softDeleteContract, restoreContract, hardDeleteContract, getContractsFullView, generateSignatureLink, getContractSignLink, signContractViaLink, generateContractPdfManually, uploadSignedContractPdf, uploadSignedPdfMiddleware, downloadSignedContract } from "../../controllers/contractController/contractController.js";
import { contractPermissionMiddleware } from "../../middleware/contractPermissionMiddleware.js";
const router = Router();
// ⚠️ Routes publiques (AVANT le middleware d'authentification)
router.get("/download/:contractId/:token", downloadSignedContract);
// 📋 GET all contracts avec authentification hybride (JWT ou API Key)
router.get("/", hybridAuthMiddleware, requireApiKeyScope("read:contracts"), getAllContracts);
// 🔒 Middleware d'authentification pour les autres routes protégées
router.use(authMiddleware);
// Support optional customer_id as query param
router.get("/full-view", getContractsFullView);
// New RESTful route for full-view by customerId
router.get("/customers/:customerId/full-view", getContractsFullView);
// Redirect to frontend signing page with token
router.get("/sign/:token", (req, res) => {
    const { token } = req.params;
    return res.redirect(302, `https://allure-creation.fr/sign/${token}`);
});
router.get("/:id", getContractById);
router.post("/", createContract);
router.put("/:id", contractPermissionMiddleware(), updateContract);
router.patch("/:id/restore", contractPermissionMiddleware(), restoreContract);
router.patch("/:id", contractPermissionMiddleware(), softDeleteContract);
router.delete("/:id/hard", contractPermissionMiddleware(), hardDeleteContract);
router.post("/:id/generate-signature", contractPermissionMiddleware(), generateSignatureLink);
router.post("/:id/generate-pdf", contractPermissionMiddleware(), generateContractPdfManually);
router.post("/:id/upload-signed-pdf", contractPermissionMiddleware(), uploadSignedPdfMiddleware, uploadSignedContractPdf);
router.get("/sign-links/:token", getContractSignLink);
router.post("/sign-links/:token/sign", signContractViaLink);
export default router;
//# sourceMappingURL=contractRoutes.js.map