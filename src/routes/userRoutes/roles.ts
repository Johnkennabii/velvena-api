import { Router } from "express";
import { getRoleById, getRoles } from "../../controllers/userController/roleController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = Router();

// Tous les utilisateurs authentifiés peuvent voir la liste des rôles
router.get("/", authMiddleware, getRoles);
router.get("/:id", authMiddleware, getRoleById);

export default router;
