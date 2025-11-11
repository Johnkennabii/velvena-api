import { Router } from "express";
import { getUsers, getUser, updateUser, softDeleteUser, hardDeleteUser } from "../../controllers/userController/userController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUser);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, hardDeleteUser);
router.patch("/:id", authMiddleware, softDeleteUser);

export default router;