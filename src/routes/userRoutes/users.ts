import { Router } from "express";
import { getUsers, getUser, updateUser, softDeleteUser, hardDeleteUser } from "../../controllers/userController/userController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { organizationContextMiddleware } from "../../middleware/organizationContextMiddleware.js";

const router = Router();

// Apply authentication and organization context to all routes
router.use(authMiddleware);
router.use(organizationContextMiddleware); // ✅ SUPER_ADMIN can use X-Organization-Slug header

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", hardDeleteUser);
router.patch("/:id", softDeleteUser);

export default router;