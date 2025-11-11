// src/utils/notifications.ts
import prisma from "../lib/prisma.js";
import { io } from "../server.js";
export async function emitAndStoreNotification(payload) {
    try {
        // 1️⃣ Crée la notification principale
        const notif = await prisma.notification.create({
            data: {
                type: payload.type,
                title: payload.title,
                message: payload.message ?? null,
                meta: payload,
            },
        });
        // 2️⃣ Récupère tous les utilisateurs actifs
        const users = await prisma.user.findMany({
            select: { id: true },
            where: {
                deleted_at: null,
            },
        });
        // 3️⃣ Crée les liens utilisateur-notification
        if (users.length > 0) {
            await prisma.notificationUserLink.createMany({
                data: users.map((user) => ({
                    notification_id: notif.id,
                    user_id: user.id,
                    seen: false,
                })),
            });
        }
        // 4️⃣ Émet la notification via Socket.IO
        io.emit("notification", {
            id: notif.id,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            meta: payload.meta ?? payload,
            created_at: notif.created_at,
        });
        console.log(`📢 Notification envoyée à ${users.length} utilisateurs : ${payload.title}`);
        return notif;
    }
    catch (err) {
        console.error("❌ Erreur stockage notification :", err);
    }
}
//# sourceMappingURL=notifications.js.map