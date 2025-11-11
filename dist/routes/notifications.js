import express from "express";
import prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(authMiddleware);
/**
 * ✅ GET /notifications
 * Récupère les 30 dernières notifications de l'utilisateur connecté
 */
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Utilisateur non authentifié" });
        }
        const notifications = await prisma.notificationUserLink.findMany({
            where: {
                user_id: userId,
                seen: false
            },
            include: {
                notification: true,
            },
            orderBy: { notification: { created_at: "desc" } },
            take: 30,
        });
        // Format simplifié pour le front
        const data = notifications.map((n) => ({
            id: n.notification.id,
            type: n.notification.type,
            title: n.notification.title,
            message: n.notification.message,
            meta: n.notification.meta,
            created_at: n.notification.created_at,
            seen: n.seen,
            seen_at: n.seen_at,
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        console.error("❌ Erreur GET /notifications :", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});
/**
 * ✅ PATCH /notifications/:id/seen
 * Marque une notification comme vue uniquement pour l'utilisateur connecté
 */
router.patch("/:id/seen", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Utilisateur non authentifié" });
        }
        const updated = await prisma.notificationUserLink.updateMany({
            where: {
                notification_id: id,
                user_id: userId,
            },
            data: {
                seen: true,
                seen_at: new Date(),
            },
        });
        if (updated.count === 0) {
            return res.status(404).json({ success: false, message: "Notification introuvable ou non liée à cet utilisateur" });
        }
        res.json({ success: true, message: "Notification marquée comme vue" });
    }
    catch (error) {
        console.error("❌ Erreur PATCH /notifications/:id/seen :", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});
export default router;
//# sourceMappingURL=notifications.js.map