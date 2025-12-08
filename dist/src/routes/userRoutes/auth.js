import logger from "../../lib/logger.js";
import { Router } from "express";
import { register, login, me, refresh } from "../../controllers/userController/authController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { requireQuota } from "../../middleware/subscriptionMiddleware.js";
const router = Router();
// Login ne nécessite pas de token
router.post("/login", (req, res) => {
    logger.info("📥 Login request received");
    login(req, res);
});
// Register nécessite un utilisateur connecté (ADMIN ou MANAGER par ex.)
router.post("/register", authMiddleware, requireQuota("users"), // ✅ Vérifie quota users
(req, res) => {
    logger.info("🆕 Register request received");
    register(req, res);
});
// Récupérer les infos de l'utilisateur connecté
router.get("/me", authMiddleware, (req, res) => {
    logger.info("🙋 Get current user (/me) request received");
    me(req, res);
});
router.post("/refresh", authMiddleware, refresh);
export default router;
//# sourceMappingURL=auth.js.map