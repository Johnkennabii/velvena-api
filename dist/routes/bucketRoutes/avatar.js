import { Router } from "express";
import { listAvatars, getAvatarById, deleteAvatarById, uploadAvatar, upload } from "../../controllers/bucketController/avatarBucketController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
const router = Router();
router.get("/", authMiddleware, listAvatars);
router.get("/:id", authMiddleware, getAvatarById);
router.delete("/:id", authMiddleware, deleteAvatarById);
router.post("/", authMiddleware, upload.single("file"), uploadAvatar);
export default router;
//# sourceMappingURL=avatar.js.map