/**
 * Subscription Manager - Gestion des abonnements, quotas et features
 *
 * Système complet pour :
 * - Vérifier les limites d'usage (quotas)
 * - Contrôler l'accès aux fonctionnalités (feature gates)
 * - Tracker l'utilisation
 * - Gérer les upgrades/downgrades
 */

import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import contract from "../docs/paths/contract/index.js";

// ============================================
// TYPES
// ============================================

export interface SubscriptionLimits {
  users: number;
  dresses: number;
  customers: number;
  prospects: number;
  contracts_per_month: number;
  storage_gb: number;
  api_calls_per_day: number;
  email_notifications: number;
  [key: string]: number | boolean | string | string[];
}

export interface SubscriptionFeatures {
  planning: boolean;
  dashboard: boolean;
  export_data: boolean;
  customer_portal: boolean;
  notification_push: boolean;
  contract_generation: boolean;
  prospect_management: boolean;
  electronic_signature: boolean;
  inventory_management: boolean;
  contract_builder: boolean;
  [key: string]: boolean;
}

export interface QuotaCheck {
  allowed: boolean;
  current_usage: number;
  limit: number;
  remaining: number;
  percentage_used: number;
}

export interface FeatureCheck {
  allowed: boolean;
  feature_name: string;
  upgrade_required?: string; // Plan recommandé
}

// ============================================
// QUOTA MANAGEMENT
// ============================================

/**
 * Check if organization can create a new resource
 */
export async function checkQuota(
  organizationId: string,
  resourceType: "users" | "dresses" | "customers" | "prospects" | "contracts" | "api_calls"
): Promise<QuotaCheck> {
  try {
    // Get organization with subscription
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Get subscription limits
    const limits = (org.subscription?.limits as SubscriptionLimits) || getDefaultLimits();
    const limitKey = resourceType === "contracts" ? "contracts_per_month" : resourceType;
    const limit = limits[limitKey] as number;

    // Get current usage
    let currentUsage = 0;

    switch (resourceType) {
      case "users":
        currentUsage = await prisma.user.count({
          where: { organization_id: organizationId, deleted_at: null },
        });
        break;

      case "dresses":
        currentUsage = await prisma.dress.count({
          where: { organization_id: organizationId, deleted_at: null },
        });
        break;

      case "customers":
        currentUsage = await prisma.customer.count({
          where: { organization_id: organizationId, deleted_at: null },
        });
        break;

      case "prospects":
        currentUsage = await prisma.prospect.count({
          where: { organization_id: organizationId, deleted_at: null },
        });
        break;

      case "contracts":
        // Count contracts this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        currentUsage = await prisma.contract.count({
          where: {
            organization_id: organizationId,
            deleted_at: null,
            created_at: { gte: startOfMonth },
          },
        });
        break;

      case "api_calls":
        // Count API calls today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const eventMonth = new Date().toISOString().slice(0, 7); // "2025-12"
        const eventDay = startOfDay.toISOString().slice(0, 10); // "2025-12-06"

        currentUsage = await prisma.usageEvent.count({
          where: {
            organization_id: organizationId,
            event_type: "api_call",
            event_day: eventDay,
          },
        });
        break;
    }

    const remaining = Math.max(0, limit - currentUsage);
    const percentageUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;
    const allowed = currentUsage < limit;

    return {
      allowed,
      current_usage: currentUsage,
      limit,
      remaining,
      percentage_used: Math.round(percentageUsed),
    };
  } catch (err: any) {
    logger.error({ err, organizationId, resourceType }, "Failed to check quota");
    // En cas d'erreur, autoriser par défaut (fail open)
    return {
      allowed: true,
      current_usage: 0,
      limit: Infinity,
      remaining: Infinity,
      percentage_used: 0,
    };
  }
}

/**
 * Check multiple quotas at once
 */
export async function checkQuotas(
  organizationId: string,
  resourceTypes: Array<"users" | "dresses" | "customers" | "prospects" | "contracts" | "api_calls">
): Promise<Record<string, QuotaCheck>> {
  const results: Record<string, QuotaCheck> = {};

  for (const resourceType of resourceTypes) {
    results[resourceType] = await checkQuota(organizationId, resourceType);
  }

  return results;
}

// ============================================
// FEATURE GATES
// ============================================

/**
 * Check if organization has access to a feature
 */
export async function checkFeature(
  organizationId: string,
  featureName: keyof SubscriptionFeatures
): Promise<FeatureCheck> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true,
      },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    const features = (org.subscription?.features as SubscriptionFeatures) || getDefaultFeatures();
    const allowed = features[featureName] === true;

    let upgradeRequired: string | undefined;
    if (!allowed) {
      // Suggest upgrade plan
      upgradeRequired = suggestUpgradePlan(String(featureName));
    }

    return {
      allowed,
      feature_name: String(featureName),
      ...(upgradeRequired && { upgrade_required: upgradeRequired }),
    };
  } catch (err: any) {
    logger.error({ err, organizationId, featureName }, "Failed to check feature");
    // En cas d'erreur, autoriser par défaut (fail open)
    return {
      allowed: true,
      feature_name: String(featureName),
    };
  }
}

/**
 * Check multiple features at once
 */
export async function checkFeatures(
  organizationId: string,
  featureNames: Array<keyof SubscriptionFeatures>
): Promise<Record<string, FeatureCheck>> {
  const results: Record<string, FeatureCheck> = {};

  for (const featureName of featureNames) {
    results[featureName] = await checkFeature(organizationId, featureName);
  }

  return results;
}

// ============================================
// USAGE TRACKING
// ============================================

/**
 * Track a usage event
 */
export async function trackUsage(
  organizationId: string,
  eventType: string,
  resourceType: string,
  resourceId?: string,
  metadata?: any
): Promise<void> {
  try {
    const now = new Date();
    const eventMonth = now.toISOString().slice(0, 7); // "2025-12"
    const eventDay = now.toISOString().slice(0, 10); // "2025-12-06"

    await prisma.usageEvent.create({
      data: {
        organization_id: organizationId,
        event_type: eventType,
        resource_type: resourceType,
        resource_id: resourceId ?? null,
        metadata,
        event_date: now,
        event_month: eventMonth,
        event_day: eventDay,
      },
    });

    logger.debug(
      { organizationId, eventType, resourceType, resourceId },
      "Usage event tracked"
    );
  } catch (err: any) {
    // Don't throw - tracking errors shouldn't break the app
    logger.error({ err, organizationId, eventType }, "Failed to track usage");
  }
}

/**
 * Update cached usage counts in organization
 */
export async function updateCachedUsage(organizationId: string): Promise<void> {
  try {
    const [usersCount, dressesCount, customersCount, prospectsCount] = await Promise.all([
      prisma.user.count({
        where: { organization_id: organizationId, deleted_at: null },
      }),
      prisma.dress.count({
        where: { organization_id: organizationId, deleted_at: null },
      }),
      prisma.customer.count({
        where: { organization_id: organizationId, deleted_at: null },
      }),
      prisma.prospect.count({
        where: { organization_id: organizationId, deleted_at: null },
      }),
    ]);

    // Contracts this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const contractsThisMonth = await prisma.contract.count({
      where: {
        organization_id: organizationId,
        deleted_at: null,
        created_at: { gte: startOfMonth },
      },
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        current_usage: {
          users: usersCount,
          dresses: dressesCount,
          customers: customersCount,
          prospects: prospectsCount,
          contracts_this_month: contractsThisMonth,
          last_updated: new Date().toISOString(),
        },
      },
    });

    logger.debug({ organizationId }, "Cached usage updated");
  } catch (err: any) {
    logger.error({ err, organizationId }, "Failed to update cached usage");
  }
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Get organization's subscription status
 */
export async function getSubscriptionStatus(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: true,
    },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const now = new Date();
  const isTrial = org.subscription_status === "trial";
  const isTrialExpired = org.trial_ends_at && org.trial_ends_at < now;
  const isSubscriptionExpired = org.subscription_ends_at && org.subscription_ends_at < now;

  return {
    status: org.subscription_status,
    plan: org.subscription,
    is_trial: isTrial,
    is_trial_expired: isTrialExpired,
    is_subscription_expired: isSubscriptionExpired,
    is_active: org.is_active && !isTrialExpired && !isSubscriptionExpired,
    trial_ends_at: org.trial_ends_at,
    subscription_ends_at: org.subscription_ends_at,
    days_remaining: org.trial_ends_at
      ? Math.ceil((org.trial_ends_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

/**
 * Upgrade/Change subscription plan
 */
export async function changeSubscriptionPlan(
  organizationId: string,
  newPlanId: string,
  userId?: string
): Promise<void> {
  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: newPlanId },
  });

  if (!newPlan) {
    throw new Error("Subscription plan not found");
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscription_plan_id: newPlanId,
      subscription_status: "active",
      subscription_started_at: new Date(),
      updated_by: userId ?? null,
    },
  });

  logger.info(
    { organizationId, newPlanId, planName: newPlan.name },
    "Subscription plan changed"
  );
}

// ============================================
// DEFAULTS & HELPERS
// ============================================

function getDefaultLimits(): SubscriptionLimits {
  return {
    users: 1,
    dresses: 10,
    customers: 50,
    prospects: 10,
    contracts_per_month: 5,
    storage_gb: 1,
    api_calls_per_day: 100,
    email_notifications: 10,
  };
}

function getDefaultFeatures(): SubscriptionFeatures {
  return {
    planning: false,
    dashboard: false,
    export_data: false,
    customer_portal: true,
    notification_push: false,
    contract_generation: true,
    prospect_management: false,
    electronic_signature: false,
    inventory_management: true,
    contract_builder: false,
  };
}

function suggestUpgradePlan(featureName: string): string {
  // Map features to minimum required plan
  const featurePlanMap: Record<string, string> = {
    planning: "pro",
    dashboard: "pro",
    export_data: "enterprise",
    customer_portal: "free",
    notification_push: "pro",
    contract_generation: "free",
    prospect_management: "enterprise",
    electronic_signature: "pro",
    inventory_management: "free",
    contract_builder: "enterprise",
  };

  return featurePlanMap[featureName] || "pro";
}

/**
 * Check if organization should be warned about quota
 */
export function shouldWarnAboutQuota(quotaCheck: QuotaCheck): boolean {
  return quotaCheck.percentage_used >= 80 && !quotaCheck.allowed;
}
