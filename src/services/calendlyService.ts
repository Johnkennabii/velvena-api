import axios, { type AxiosInstance } from "axios";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { encrypt, decrypt, encryptOAuthTokens, decryptOAuthTokens } from "../lib/encryption.js";
import { Prisma } from "@prisma/client";
import { emitProspectCreated, emitProspectUpdated, notifyCalendlyProspect } from "../utils/prospects.js";

const CALENDLY_API_BASE_URL = "https://api.calendly.com";
const CALENDLY_AUTH_URL = "https://auth.calendly.com/oauth";

interface CalendlyTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  organization: string;
  owner: string;
  created_at: number;
}

interface CalendlyUser {
  uri: string;
  name: string;
  email: string;
  slug: string;
  scheduling_url: string;
  timezone: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    location?: string;
    join_url?: string;
  };
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
}

interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  timezone: string;
  event: string;
  created_at: string;
  updated_at: string;
  canceled: boolean;
  cancellation?: {
    canceled_by: string;
    reason: string;
  };
  questions_and_answers?: Array<{
    question: string;
    answer: string;
  }>;
  tracking?: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    salesforce_uuid?: string;
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<CalendlyTokenResponse> {
  try {
    const response = await axios.post(
      `${CALENDLY_AUTH_URL}/token`,
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.CALENDLY_REDIRECT_URI,
      },
      {
        auth: {
          username: process.env.CALENDLY_CLIENT_ID!,
          password: process.env.CALENDLY_CLIENT_SECRET!,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error({ error: error.response?.data || error.message }, "Failed to exchange code for token");
    throw new Error("Failed to exchange authorization code for access token");
  }
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<CalendlyTokenResponse> {
  try {
    const response = await axios.post(
      `${CALENDLY_AUTH_URL}/token`,
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
      {
        auth: {
          username: process.env.CALENDLY_CLIENT_ID!,
          password: process.env.CALENDLY_CLIENT_SECRET!,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error({ error: error.response?.data || error.message }, "Failed to refresh access token");
    throw new Error("Failed to refresh access token");
  }
}

/**
 * Get Calendly API client with authentication
 */
async function getCalendlyClient(integrationId: string): Promise<AxiosInstance> {
  const integration = await prisma.calendlyIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    throw new Error("Calendly integration not found");
  }

  // Decrypt tokens
  const { accessToken } = decryptOAuthTokens(
    integration.access_token,
    integration.refresh_token
  );

  // Check if token is expired
  const now = new Date();
  if (integration.expires_at <= now) {
    // Refresh token
    const { refreshToken } = decryptOAuthTokens(
      integration.access_token,
      integration.refresh_token
    );

    const newTokens = await refreshAccessToken(refreshToken);
    const { encryptedAccessToken, encryptedRefreshToken } = encryptOAuthTokens(
      newTokens.access_token,
      newTokens.refresh_token
    );

    // Update integration with new tokens
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000),
      },
    });

    // Use new access token
    return axios.create({
      baseURL: CALENDLY_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${newTokens.access_token}`,
        "Content-Type": "application/json",
      },
    });
  }

  return axios.create({
    baseURL: CALENDLY_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Get current user information from Calendly
 */
export async function getCalendlyUser(accessToken: string): Promise<CalendlyUser> {
  try {
    const response = await axios.get(`${CALENDLY_API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.resource;
  } catch (error: any) {
    logger.error({ error: error.response?.data || error.message }, "Failed to get Calendly user");
    throw new Error("Failed to get Calendly user information");
  }
}

/**
 * Store Calendly integration for an organization
 */
export async function storeCalendlyIntegration(
  organizationId: string,
  tokens: CalendlyTokenResponse,
  user: CalendlyUser,
  userId?: string
) {
  const { encryptedAccessToken, encryptedRefreshToken } = encryptOAuthTokens(
    tokens.access_token,
    tokens.refresh_token
  );

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  return await prisma.calendlyIntegration.upsert({
    where: { calendly_user_uri: user.uri },
    update: {
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      scope: tokens.scope,
      calendly_user_name: user.name,
      calendly_email: user.email,
      updated_at: new Date(),
      updated_by: userId || null,
    },
    create: {
      organization_id: organizationId,
      calendly_user_uri: user.uri,
      calendly_user_name: user.name,
      calendly_email: user.email,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      scope: tokens.scope,
      created_by: userId || null,
    },
  });
}

/**
 * Sync Calendly events for an integration
 */
export async function syncCalendlyEvents(integrationId: string): Promise<number> {
  try {
    const integration = await prisma.calendlyIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const client = await getCalendlyClient(integrationId);

    // Get scheduled events
    const response = await client.get("/scheduled_events", {
      params: {
        user: integration.calendly_user_uri,
        status: "active",
        count: 100,
      },
    });

    const events = response.data.collection || [];
    let syncedCount = 0;

    for (const event of events) {
      // Get invitee details
      const inviteeResponse = await client.get(`${event.uri}/invitees`);
      const invitees = inviteeResponse.data.collection || [];

      for (const invitee of invitees) {
        await syncCalendlyEvent(integration, event, invitee);
        syncedCount++;
      }
    }

    // Update last sync time
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        last_synced_at: new Date(),
        last_sync_error: null,
        next_sync_at: new Date(Date.now() + integration.sync_interval_minutes * 60 * 1000),
      },
    });

    logger.info({ integrationId, syncedCount }, "Calendly events synced successfully");
    return syncedCount;
  } catch (error: any) {
    logger.error({ error: error.message, integrationId }, "Failed to sync Calendly events");

    // Update last sync error
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        last_sync_error: error.message,
      },
    });

    throw error;
  }
}

/**
 * Sync a single Calendly event and create/update prospect
 */
async function syncCalendlyEvent(
  integration: any,
  event: CalendlyEvent,
  invitee: CalendlyInvitee
) {
  // Check if event already exists
  const existingEvent = await prisma.calendlyEvent.findUnique({
    where: { calendly_event_uri: event.uri },
  });

  const location =
    event.location?.join_url || event.location?.location || event.location?.type || null;

  // Prepare invitee questions as Prisma JSON value
  const inviteeQuestionsValue = invitee.questions_and_answers
    ? (invitee.questions_and_answers as Prisma.InputJsonValue)
    : Prisma.JsonNull;

  // Upsert Calendly event
  const calendlyEvent = await prisma.calendlyEvent.upsert({
    where: { calendly_event_uri: event.uri },
    update: {
      event_name: event.name,
      event_start_time: new Date(event.start_time),
      event_end_time: new Date(event.end_time),
      event_status: event.status,
      location,
      invitee_name: invitee.name,
      invitee_email: invitee.email,
      invitee_timezone: invitee.timezone,
      invitee_uri: invitee.uri,
      invitee_questions: inviteeQuestionsValue,
      updated_at: new Date(),
    },
    create: {
      organization_id: integration.organization_id,
      integration_id: integration.id,
      calendly_event_uri: event.uri,
      calendly_event_type: event.event_type,
      event_name: event.name,
      event_start_time: new Date(event.start_time),
      event_end_time: new Date(event.end_time),
      event_status: event.status,
      location,
      invitee_name: invitee.name,
      invitee_email: invitee.email,
      invitee_timezone: invitee.timezone,
      invitee_uri: invitee.uri,
      invitee_questions: inviteeQuestionsValue,
    },
  });

  // Create or update prospect if not already linked
  if (!calendlyEvent.prospect_id && invitee.email) {
    await createProspectFromCalendlyEvent(calendlyEvent, invitee, integration.organization_id);
  }

  return calendlyEvent;
}

/**
 * Create a prospect from a Calendly event
 */
async function createProspectFromCalendlyEvent(
  calendlyEvent: any,
  invitee: CalendlyInvitee,
  organizationId: string
) {
  try {
    // Check if prospect already exists with this email
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        email: invitee.email,
        organization_id: organizationId,
      },
    });

    let prospect;

    if (existingProspect) {
      // Create a new note for the Calendly event
      const noteContent = `Rendez-vous Calendly prévu le ${new Date(calendlyEvent.event_start_time).toLocaleString("fr-FR")} - ${calendlyEvent.event_name}`;

      await prisma.prospectNote.create({
        data: {
          prospect_id: existingProspect.id,
          content: noteContent,
        },
      });

      prospect = existingProspect;

      logger.info(
        { prospectId: prospect.id, calendlyEventId: calendlyEvent.id },
        "Linking existing prospect to Calendly event and created note"
      );

      // Emit Socket.IO event for prospect update
      emitProspectUpdated(organizationId, prospect);

      // Send notification for the new appointment
      await notifyCalendlyProspect(
        organizationId,
        prospect,
        calendlyEvent.event_name,
        new Date(calendlyEvent.event_start_time)
      );
    } else {
      // Create new prospect
      const [firstname, ...lastnameParts] = invitee.name.split(" ");
      const lastname = lastnameParts.join(" ") || "";

      prospect = await prisma.prospect.create({
        data: {
          firstname: firstname || "Unknown",
          lastname: lastname || "Unknown",
          email: invitee.email,
          organization_id: organizationId,
          source: "calendly",
          status: "new",
        },
      });

      // Create a note for the Calendly event
      const noteContent = `Rendez-vous Calendly prévu le ${new Date(calendlyEvent.event_start_time).toLocaleString("fr-FR")} - ${calendlyEvent.event_name}`;

      await prisma.prospectNote.create({
        data: {
          prospect_id: prospect.id,
          content: noteContent,
        },
      });

      logger.info(
        { prospectId: prospect.id, calendlyEventId: calendlyEvent.id },
        "Created new prospect from Calendly event with note"
      );

      // Emit Socket.IO event for new prospect
      emitProspectCreated(organizationId, prospect);

      // Send notification for new prospect
      await notifyCalendlyProspect(
        organizationId,
        prospect,
        calendlyEvent.event_name,
        new Date(calendlyEvent.event_start_time)
      );
    }

    // Link prospect to Calendly event
    await prisma.calendlyEvent.update({
      where: { id: calendlyEvent.id },
      data: { prospect_id: prospect.id },
    });

    return prospect;
  } catch (error: any) {
    logger.error(
      { error: error.message, calendlyEventId: calendlyEvent.id },
      "Failed to create prospect from Calendly event"
    );
  }
}

/**
 * Process a Calendly webhook event directly (without API polling)
 * This is called when Calendly sends a webhook notification
 */
export async function processWebhookEvent(payload: any): Promise<void> {
  try {
    const eventData = payload.event;
    const inviteeData = payload.invitee;

    if (!eventData || !inviteeData) {
      logger.warn({ payload }, "Missing event or invitee data in webhook payload");
      return;
    }

    // Find integration by event owner URI
    const ownerUri = eventData.event_memberships?.[0]?.user;
    if (!ownerUri) {
      logger.warn({ payload }, "Missing event owner URI in webhook");
      return;
    }

    const integration = await prisma.calendlyIntegration.findFirst({
      where: {
        calendly_user_uri: ownerUri,
        is_active: true,
      },
    });

    if (!integration) {
      logger.warn({ ownerUri }, "No active integration found for webhook event");
      return;
    }

    // Parse webhook data into our format
    const calendlyEvent = {
      uri: eventData.uri,
      name: eventData.name || "Calendly Event",
      status: eventData.status || "active",
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      event_type: eventData.event_type,
      location: eventData.location,
      invitees_counter: eventData.invitees_counter || { total: 1, active: 1, limit: 1 },
      created_at: eventData.created_at,
      updated_at: eventData.updated_at,
    };

    const calendlyInvitee = {
      uri: inviteeData.uri,
      email: inviteeData.email,
      name: inviteeData.name,
      timezone: inviteeData.timezone || "UTC",
      event: eventData.uri,
      created_at: inviteeData.created_at,
      updated_at: inviteeData.updated_at,
      canceled: inviteeData.cancel_url ? false : inviteeData.canceled || false,
      cancellation: inviteeData.cancellation,
      questions_and_answers: inviteeData.questions_and_answers,
      tracking: inviteeData.tracking,
    };

    // Process the event using our existing logic
    await syncCalendlyEvent(integration, calendlyEvent as any, calendlyInvitee as any);

    logger.info(
      {
        organizationId: integration.organization_id,
        eventUri: eventData.uri,
        inviteeEmail: inviteeData.email,
      },
      "Processed Calendly webhook event successfully"
    );
  } catch (error: any) {
    logger.error(
      { error: error.message, payload },
      "Failed to process Calendly webhook event"
    );
    throw error;
  }
}

/**
 * Mark a Calendly event as canceled (from webhook)
 */
export async function markEventAsCanceled(eventUri: string): Promise<void> {
  try {
    const updated = await prisma.calendlyEvent.updateMany({
      where: { calendly_event_uri: eventUri },
      data: {
        event_status: "canceled",
        updated_at: new Date(),
      },
    });

    if (updated.count > 0) {
      logger.info({ eventUri, count: updated.count }, "Marked Calendly event(s) as canceled");
    }
  } catch (error: any) {
    logger.error({ error: error.message, eventUri }, "Failed to mark event as canceled");
    throw error;
  }
}

/**
 * Create webhook subscription for Calendly events
 */
export async function createWebhookSubscription(
  integrationId: string,
  webhookUrl: string
): Promise<string> {
  try {
    const client = await getCalendlyClient(integrationId);
    const integration = await prisma.calendlyIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get organization URI from user URI
    const organizationUri = integration.calendly_user_uri.replace("/users/", "/organizations/");

    const response = await client.post("/webhook_subscriptions", {
      url: webhookUrl,
      events: [
        "invitee.created",
        "invitee.canceled",
      ],
      organization: organizationUri,
      scope: "organization",
    });

    const subscriptionUri = response.data.resource.uri;

    // Update integration with webhook info
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        webhook_subscription_uri: subscriptionUri,
        webhook_active: true,
      },
    });

    logger.info({ integrationId, subscriptionUri }, "Webhook subscription created");
    return subscriptionUri;
  } catch (error: any) {
    logger.error({ error: error.response?.data || error.message }, "Failed to create webhook subscription");
    throw new Error("Failed to create webhook subscription");
  }
}

/**
 * Delete webhook subscription
 */
export async function deleteWebhookSubscription(integrationId: string): Promise<void> {
  try {
    const integration = await prisma.calendlyIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.webhook_subscription_uri) {
      return;
    }

    const client = await getCalendlyClient(integrationId);
    await client.delete(integration.webhook_subscription_uri);

    // Update integration
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        webhook_subscription_uri: null,
        webhook_active: false,
      },
    });

    logger.info({ integrationId }, "Webhook subscription deleted");
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to delete webhook subscription");
    throw new Error("Failed to delete webhook subscription");
  }
}
