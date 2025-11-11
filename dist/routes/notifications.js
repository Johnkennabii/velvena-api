import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();
// GET toutes les notifications
router.get("/", async (req, res) => {
    const notifications = await prisma.notification.findMany({
        orderBy: { created_at: "desc" },
        take: 30,
    });
    res.json({ success: true, data: notifications });
});
// PATCH pour marquer une notification comme vue
router.patch("/:id/seen", async (req, res) => {
    const { id } = req.params;
    const notif = await prisma.notification.update({
        where: { id },
        data: { seen: true },
    });
    res.json({ success: true, data: notif });
});
export default router;
//# sourceMappingURL=notifications.js.map