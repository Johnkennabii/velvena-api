import { Router } from "express";
import { upload } from "../../controllers/bucketController/dressStorageController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { hybridAuthMiddleware, requireApiKeyScope } from "../../middleware/hybridAuthMiddleware.js";
import { getDresses, createDress, updateDress, softDeleteDress, hardDeleteDress, getDressesWithDetails, getDressById, addDressImages, removeDressImage, getDressesAvailability, publishDress, unpublishDress } from "../../controllers/dressController/dressController.js";
const router = Router();
/* ------------------------------ 🧵 DRESSES ------------------------------ */
// 📄 Récupération et création
router
    .route("/")
    .get(hybridAuthMiddleware, requireApiKeyScope("read:dresses"), getDresses) // ✅ /dresses (JWT ou API Key avec scope read:dresses)
    .post(authMiddleware, upload.array("images", 5), createDress); // ✅ /dresses (JWT uniquement)
// 🔍 Vue détaillée (avec jointures)
router.get("/details-view", hybridAuthMiddleware, requireApiKeyScope("read:dresses"), getDressesWithDetails); // ✅ /dresses/details-view (JWT ou API Key)
router.get("/availability", hybridAuthMiddleware, requireApiKeyScope("read:dresses"), getDressesAvailability); // ✅ /dresses/availability (JWT ou API Key)
// 📦 Détail, mise à jour et suppressions
router
    .route("/:id")
    .get(hybridAuthMiddleware, requireApiKeyScope("read:dresses"), getDressById) // ✅ /dresses/{id} (JWT ou API Key)
    .put(authMiddleware, updateDress); // ✅ /dresses/{id} (JWT uniquement)
// ♻️ Soft delete et Hard delete
router.patch("/:id/soft", authMiddleware, softDeleteDress); // ✅ /dresses/{id}/soft
router.delete("/:id/hard", authMiddleware, hardDeleteDress); // ✅ /dresses/{id}/hard
// 📢 Publication
router.post("/:id/publish", authMiddleware, publishDress); // ✅ /dresses/{id}/publish (JWT uniquement)
router.post("/:id/unpublish", authMiddleware, unpublishDress); // ✅ /dresses/{id}/unpublish (JWT uniquement)
/* ------------------------------ 🖼️ IMAGES ------------------------------ */
// ➕ Ajouter une ou plusieurs images à une robe
router.post("/:id/images", authMiddleware, upload.array("images", 5), addDressImages); // ✅ /dresses/{id}/images
// ❌ Supprimer une ou plusieurs images
router.delete("/:id/images", authMiddleware, removeDressImage); // ✅ /dresses/{id}/images (payload keys[])
router.delete("/:id/images/:key", authMiddleware, removeDressImage); // ✅ /dresses/{id}/images/{key}
export default router;
//# sourceMappingURL=dresses.js.map