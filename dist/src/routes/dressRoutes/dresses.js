import { Router } from "express";
import { upload } from "../../controllers/bucketController/dressStorageController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { organizationContextMiddleware } from "../../middleware/organizationContextMiddleware.js";
import { requireQuota } from "../../middleware/subscriptionMiddleware.js";
import { getDresses, createDress, updateDress, softDeleteDress, hardDeleteDress, getDressesWithDetails, getDressById, addDressImages, removeDressImage, getDressesAvailability, publishDress, unpublishDress } from "../../controllers/dressController/dressController.js";
const router = Router();
// Apply authentication and organization context to all routes
router.use(authMiddleware);
router.use(organizationContextMiddleware); // ✅ SUPER_ADMIN can use X-Organization-Slug header
/* ------------------------------ 🧵 DRESSES ------------------------------ */
// 📄 Récupération et création
router
    .route("/")
    .get(getDresses)
    .post(requireQuota("dresses"), upload.array("images", 5), createDress);
// 🔍 Vue détaillée (avec jointures)
router.get("/details-view", getDressesWithDetails);
router.get("/availability", getDressesAvailability);
// 📦 Détail, mise à jour et suppressions
router
    .route("/:id")
    .get(getDressById)
    .put(updateDress);
// ♻️ Soft delete et Hard delete
router.patch("/:id/soft", softDeleteDress); // ✅ /dresses/{id}/soft
router.delete("/:id/hard", hardDeleteDress); // ✅ /dresses/{id}/hard
// 📢 Publication
router.post("/:id/publish", publishDress); // ✅ /dresses/{id}/publish (JWT uniquement)
router.post("/:id/unpublish", unpublishDress); // ✅ /dresses/{id}/unpublish (JWT uniquement)
/* ------------------------------ 🖼️ IMAGES ------------------------------ */
// ➕ Ajouter une ou plusieurs images à une robe
router.post("/:id/images", upload.array("images", 5), addDressImages); // ✅ /dresses/{id}/images
// ❌ Supprimer une ou plusieurs images
router.delete("/:id/images", removeDressImage); // ✅ /dresses/{id}/images (payload keys[])
router.delete("/:id/images/:key", removeDressImage); // ✅ /dresses/{id}/images/{key}
export default router;
//# sourceMappingURL=dresses.js.map