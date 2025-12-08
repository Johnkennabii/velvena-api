// src/utils/notifications.ts
import prisma from "../lib/prisma.js";
import { io } from "../server.js";
import pino from "../lib/logger.js";

interface NotificationPayload {
  type: string;
  title: string;
  message?: string;
  organization_id?: string; // ✅ Ajout du paramètre organization_id
  [key: string]: any;
}

export async function emitAndStoreNotification(payload: NotificationPayload) {
  try {
    const organizationId = payload.organization_id;

    if (!organizationId) {
      pino.error("❌ organization_id is required for notifications");
      throw new Error("organization_id is required for notifications");
    }

    // 1️⃣ Crée la notification principale
    const notif = await prisma.notification.create({
      data: {
        type: payload.type,
        title: payload.title,
        message: payload.message ?? null,
        meta: payload,
      },
    });

    // 2️⃣ Récupère uniquement les utilisateurs de l'organisation spécifique
    const users = await prisma.user.findMany({
      select: { id: true },
      where: {
        deleted_at: null,
        organization_id: organizationId, // ✅ Filtre par organisation
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

    // 4️⃣ Émet la notification uniquement à la room de l'organisation
    io.to(`org:${organizationId}`).emit("notification", {
      id: notif.id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      meta: payload.meta ?? payload,
      created_at: notif.created_at,
    });

    pino.info(
      { organizationId, notificationId: notif.id, usersCount: users.length },
      `📢 Notification envoyée à ${users.length} utilisateurs de l'organisation : ${payload.title}`
    );

    return notif;
  } catch (err) {
    pino.error({ err }, "❌ Erreur stockage notification");
    throw err;
  }
}