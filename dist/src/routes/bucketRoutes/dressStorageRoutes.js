import express from "express";
import { listDressImages, uploadDressImages, deleteDressImage, upload } from "../../controllers/bucketController/dressStorageController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
const router = express.Router();
// All routes require JWT authentication to get organization context
router.get("/", authMiddleware, listDressImages);
router.post("/", authMiddleware, upload.array("images", 5), uploadDressImages);
router.delete("/:key", authMiddleware, deleteDressImage);
export default router;
//# sourceMappingURL=dressStorageRoutes.js.map