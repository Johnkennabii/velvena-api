// src/routes/prospects.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProspects, getProspectById, createProspect, updateProspect, softDeleteProspect, hardDeleteProspect, convertProspectToCustomer, } from "../controllers/prospectController.js";
const router = Router();
// Récupérer tous les prospects
router.get("/", authMiddleware, getProspects);
// Récupérer un prospect par ID
router.get("/:id", authMiddleware, getProspectById);
// Créer un nouveau prospect
router.post("/", authMiddleware, createProspect);
// Mettre à jour un prospect
router.put("/:id", authMiddleware, updateProspect);
// Soft delete (PATCH)
router.patch("/:id", authMiddleware, softDeleteProspect);
// Hard delete (DELETE)
router.delete("/:id", authMiddleware, hardDeleteProspect);
// Convert prospect to customer
router.post("/:id/convert", authMiddleware, convertProspectToCustomer);
export default router;
//# sourceMappingURL=prospects.js.map