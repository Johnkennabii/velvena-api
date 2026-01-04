// src/utils/prospects.ts
import { io } from "../server.js";
import pino from "../lib/logger.js";
import { emitAndStoreNotification } from "./notifications.js";
import prisma from "../lib/prisma.js";

/**
 * Emit prospect created event to all users in the organization
 */
export async function emitProspectCreated(organizationId: string, prospect: any) {
  try {
    // Fetch notes_history to include in the event
    const prospectWithNotes = await prisma.prospect.findUnique({
      where: { id: prospect.id },
      include: {
        notes_history: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });

    io.to(`org:${organizationId}`).emit("prospect:created", {
      id: prospect.id,
      firstname: prospect.firstname,
      lastname: prospect.lastname,
      email: prospect.email,
      phone: prospect.phone,
      status: prospect.status,
      source: prospect.source,
      notes: prospect.notes,
      notes_history: prospectWithNotes?.notes_history || [],
      created_at: prospect.created_at,
    });

    pino.info(
      { organizationId, prospectId: prospect.id },
      `🟢 Socket.IO: prospect:created emitted to org:${organizationId}`
    );
  } catch (err) {
    pino.error({ err }, "❌ Failed to emit prospect:created event");
  }
}

/**
 * Emit prospect updated event to all users in the organization
 */
export async function emitProspectUpdated(organizationId: string, prospect: any) {
  try {
    // Fetch notes_history to include in the event
    const prospectWithNotes = await prisma.prospect.findUnique({
      where: { id: prospect.id },
      include: {
        notes_history: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });

    io.to(`org:${organizationId}`).emit("prospect:updated", {
      id: prospect.id,
      firstname: prospect.firstname,
      lastname: prospect.lastname,
      email: prospect.email,
      phone: prospect.phone,
      status: prospect.status,
      source: prospect.source,
      notes: prospect.notes,
      notes_history: prospectWithNotes?.notes_history || [],
      updated_at: prospect.updated_at,
    });

    pino.info(
      { organizationId, prospectId: prospect.id },
      `🔄 Socket.IO: prospect:updated emitted to org:${organizationId}`
    );
  } catch (err) {
    pino.error({ err }, "❌ Failed to emit prospect:updated event");
  }
}

/**
 * Emit prospect deleted event to all users in the organization
 */
export function emitProspectDeleted(organizationId: string, prospectId: string) {
  try {
    io.to(`org:${organizationId}`).emit("prospect:deleted", {
      id: prospectId,
    });

    pino.info(
      { organizationId, prospectId },
      `🔴 Socket.IO: prospect:deleted emitted to org:${organizationId}`
    );
  } catch (err) {
    pino.error({ err }, "❌ Failed to emit prospect:deleted event");
  }
}

/**
 * Emit notification for new Calendly prospect
 */
export async function notifyCalendlyProspect(organizationId: string, prospect: any, eventName: string, eventDate: Date) {
  try {
    await emitAndStoreNotification({
      type: "calendly_prospect_created",
      title: "Nouveau prospect Calendly",
      message: `${prospect.firstname} ${prospect.lastname} a réservé un rendez-vous "${eventName}" le ${eventDate.toLocaleString("fr-FR")}`,
      organization_id: organizationId,
      prospect_id: prospect.id,
      prospect_name: `${prospect.firstname} ${prospect.lastname}`,
      event_name: eventName,
      event_date: eventDate.toISOString(),
    });

    pino.info(
      { organizationId, prospectId: prospect.id },
      "📢 Notification sent for new Calendly prospect"
    );
  } catch (err) {
    pino.error({ err }, "❌ Failed to send Calendly prospect notification");
  }
}
