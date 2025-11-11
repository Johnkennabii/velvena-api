import { Router } from "express";
import { upload } from "../../controllers/bucketController/dressStorageController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { getDresses, createDress, updateDress, softDeleteDress, hardDeleteDress, getDressesWithDetails, getDressById, addDressImages, removeDressImage, getDressesAvailability } from "../../controllers/dressController/dressController.js";
const router = Router();
/* ------------------------------ 🧵 DRESSES ------------------------------ */
// 📄 Récupération et création
router
    .route("/")
    .get(authMiddleware, getDresses) // ✅ /dresses
    .post(authMiddleware, upload.array("images", 5), createDress); // ✅ /dresses (multipart/form-data)
// 🔍 Vue détaillée (avec jointures)
router.get("/details-view", authMiddleware, getDressesWithDetails); // ✅ /dresses/details-view
router.get("/availability", authMiddleware, getDressesAvailability);
// 📦 Détail, mise à jour et suppressions
router
    .route("/:id")
    .get(authMiddleware, getDressById) // ✅ /dresses/{id}
    .put(authMiddleware, updateDress); // ✅ /dresses/{id}
// ♻️ Soft delete et Hard delete
router.patch("/:id/soft", authMiddleware, softDeleteDress); // ✅ /dresses/{id}/soft
router.delete("/:id/hard", authMiddleware, hardDeleteDress); // ✅ /dresses/{id}/hard
/* ------------------------------ 🖼️ IMAGES ------------------------------ */
// ➕ Ajouter une ou plusieurs images à une robe
router.post("/:id/images", authMiddleware, upload.array("images", 5), addDressImages); // ✅ /dresses/{id}/images
// ❌ Supprimer une ou plusieurs images
router.delete("/:id/images", authMiddleware, removeDressImage); // ✅ /dresses/{id}/images (payload keys[])
router.delete("/:id/images/:key", authMiddleware, removeDressImage); // ✅ /dresses/{id}/images/{key}
export default router;
//# sourceMappingURL=dresses.js.map