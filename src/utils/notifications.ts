import prisma from "../lib/prisma.js";
import { io } from "../server.js";

interface NotificationPayload {
  type: string;
  title: string;
  message?: string;
  [key: string]: any;
}

export async function emitAndStoreNotification(payload: NotificationPayload) {
  try {
    const notif = await prisma.notification.create({
      data: {
        type: payload.type,
        title: payload.title,
        message: payload.message ?? null,
        meta: payload,
      },
    });

    io.emit("notification", { ...payload, id: notif.id, created_at: notif.created_at });
    return notif;
  } catch (err) {
    console.error("❌ Erreur stockage notification :", err);
  }
}