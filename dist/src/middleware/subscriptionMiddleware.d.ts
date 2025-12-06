/**
 * Subscription Middleware - Enforce quotas and feature gates
 *
 * Usage:
 * - requireQuota("users") - Check quota before creating a user
 * - requireFeature("electronic_signature") - Check feature access
 */
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import { type SubscriptionFeatures } from "../utils/subscriptionManager.js";
/**
 * Middleware to check quota before allowing resource creation
 *
 * @example
 * router.post("/users", authMiddleware, requireQuota("users"), createUser);
 */
export declare function requireQuota(resourceType: "users" | "dresses" | "customers" | "contracts" | "api_calls"): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if organization has access to a feature
 *
 * @example
 * router.post("/contracts/sign", authMiddleware, requireFeature("electronic_signature"), signContract);
 */
export declare function requireFeature(featureName: keyof SubscriptionFeatures): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if organization has an active subscription
 *
 * @example
 * router.use("/api", authMiddleware, requireActiveSubscription);
 */
export declare function requireActiveSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): () => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check both quota AND feature
 *
 * @example
 * router.post("/contracts/advanced", authMiddleware, requireQuotaAndFeature("contracts", "advanced_analytics"), createAdvancedContract);
 */
export declare function requireQuotaAndFeature(resourceType: "users" | "dresses" | "customers" | "contracts", featureName: keyof SubscriptionFeatures): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=subscriptionMiddleware.d.ts.map