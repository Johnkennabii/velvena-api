import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { downloadAttachmentByEmailId } from "../controllers/mailController/mailController.js";
const router = Router();
router.get("/:emailId/attachments/:index", authMiddleware, downloadAttachmentByEmailId);
export default router;
//# sourceMappingURL=emailRoutes.js.map