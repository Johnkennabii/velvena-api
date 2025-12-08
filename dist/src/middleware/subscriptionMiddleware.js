/**
 * Subscription Middleware - Enforce quotas and feature gates
 *
 * Usage:
 * - requireQuota("users") - Check quota before creating a user
 * - requireFeature("electronic_signature") - Check feature access
 */
import { checkQuota, checkFeature } from "../utils/subscriptionManager.js";
import logger from "../lib/logger.js";
import prisma from "../lib/prisma.js";
// ============================================
// QUOTA MIDDLEWARE
// ============================================
/**
 * Middleware to check quota before allowing resource creation
 *
 * @example
 * router.post("/users", authMiddleware, requireQuota("users"), createUser);
 */
export function requireQuota(resourceType) {
    return async (req, res, next) => {
        try {
            if (!req.user?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context required",
                });
            }
            const quotaCheck = await checkQuota(req.user.organizationId, resourceType);
            if (!quotaCheck.allowed) {
                logger.warn({
                    organizationId: req.user.organizationId,
                    resourceType,
                    currentUsage: quotaCheck.current_usage,
                    limit: quotaCheck.limit,
                }, "Quota limit reached");
                return res.status(402).json({
                    success: false,
                    error: "Quota limit reached",
                    code: "QUOTA_EXCEEDED",
                    details: {
                        resource_type: resourceType,
                        current_usage: quotaCheck.current_usage,
                        limit: quotaCheck.limit,
                        percentage_used: quotaCheck.percentage_used,
                    },
                    message: `You have reached your ${resourceType} limit (${quotaCheck.limit}). Please upgrade your plan to continue.`,
                    upgrade_url: "/settings/billing",
                });
            }
            // Warn if approaching limit (>= 80%)
            if (quotaCheck.percentage_used >= 80) {
                logger.warn({
                    organizationId: req.user.organizationId,
                    resourceType,
                    percentageUsed: quotaCheck.percentage_used,
                }, "Approaching quota limit");
                // Add warning header
                res.setHeader("X-Quota-Warning", "true");
                res.setHeader("X-Quota-Remaining", quotaCheck.remaining.toString());
                res.setHeader("X-Quota-Limit", quotaCheck.limit.toString());
            }
            // Attach quota info to request for later use
            req.quotaCheck = quotaCheck;
            next();
        }
        catch (err) {
            logger.error({ err, resourceType }, "Failed to check quota");
            // Fail open - allow request to continue on error
            next();
        }
    };
}
// ============================================
// FEATURE GATE MIDDLEWARE
// ============================================
/**
 * Middleware to check if organization has access to a feature
 *
 * @example
 * router.post("/contracts/sign", authMiddleware, requireFeature("electronic_signature"), signContract);
 */
export function requireFeature(featureName) {
    return async (req, res, next) => {
        try {
            if (!req.user?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context required",
                });
            }
            const featureCheck = await checkFeature(req.user.organizationId, featureName);
            if (!featureCheck.allowed) {
                logger.warn({
                    organizationId: req.user.organizationId,
                    featureName,
                    upgradeRequired: featureCheck.upgrade_required,
                }, "Feature access denied");
                return res.status(402).json({
                    success: false,
                    error: "Feature not available in your plan",
                    code: "FEATURE_NOT_AVAILABLE",
                    details: {
                        feature_name: featureName,
                        upgrade_required: featureCheck.upgrade_required,
                    },
                    message: `The feature "${featureName}" is not available in your current plan. Please upgrade to "${featureCheck.upgrade_required}" to access this feature.`,
                    upgrade_url: "/settings/billing",
                });
            }
            // Attach feature check to request
            req.featureCheck = featureCheck;
            next();
        }
        catch (err) {
            logger.error({ err, featureName }, "Failed to check feature");
            // Fail open - allow request to continue on error
            next();
        }
    };
}
// ============================================
// SUBSCRIPTION STATUS MIDDLEWARE
// ============================================
/**
 * Middleware to check if organization has an active subscription
 *
 * @example
 * router.use("/api", authMiddleware, requireActiveSubscription);
 */
export function requireActiveSubscription(req, res, next) {
    return async () => {
        try {
            if (!req.user?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context required",
                });
            }
            const org = await prisma.organization.findUnique({
                where: { id: req.user.organizationId },
                select: {
                    subscription_status: true,
                    trial_ends_at: true,
                    subscription_ends_at: true,
                    is_active: true,
                },
            });
            if (!org) {
                return res.status(404).json({
                    success: false,
                    error: "Organization not found",
                });
            }
            // Check if trial expired
            if (org.subscription_status === "trial" && org.trial_ends_at) {
                if (org.trial_ends_at < new Date()) {
                    return res.status(402).json({
                        success: false,
                        error: "Trial period expired",
                        code: "TRIAL_EXPIRED",
                        message: "Your trial period has expired. Please subscribe to continue using the service.",
                        upgrade_url: "/settings/billing",
                    });
                }
            }
            // Check if subscription expired
            if (org.subscription_ends_at && org.subscription_ends_at < new Date()) {
                return res.status(402).json({
                    success: false,
                    error: "Subscription expired",
                    code: "SUBSCRIPTION_EXPIRED",
                    message: "Your subscription has expired. Please renew to continue using the service.",
                    upgrade_url: "/settings/billing",
                });
            }
            // Check if organization suspended
            if (org.subscription_status === "suspended") {
                return res.status(403).json({
                    success: false,
                    error: "Account suspended",
                    code: "ACCOUNT_SUSPENDED",
                    message: "Your account has been suspended. Please contact support.",
                });
            }
            // Check if organization is active
            if (!org.is_active) {
                return res.status(403).json({
                    success: false,
                    error: "Account inactive",
                    code: "ACCOUNT_INACTIVE",
                    message: "Your account is inactive. Please contact support.",
                });
            }
            next();
        }
        catch (err) {
            logger.error({ err }, "Failed to check subscription status");
            // Fail open - allow request to continue on error
            next();
        }
    };
}
// ============================================
// COMBINED MIDDLEWARE
// ============================================
/**
 * Middleware to check both quota AND feature
 *
 * @example
 * router.post("/contracts/advanced", authMiddleware, requireQuotaAndFeature("contracts", "advanced_analytics"), createAdvancedContract);
 */
export function requireQuotaAndFeature(resourceType, featureName) {
    return async (req, res, next) => {
        // Check quota first
        const quotaMiddleware = requireQuota(resourceType);
        quotaMiddleware(req, res, (err) => {
            if (err || res.headersSent) {
                if (err)
                    next(err);
                return;
            }
            // Then check feature
            const featureMiddleware = requireFeature(featureName);
            featureMiddleware(req, res, next);
        });
    };
}
//# sourceMappingURL=subscriptionMiddleware.js.map