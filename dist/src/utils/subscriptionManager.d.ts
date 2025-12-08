/**
 * Subscription Manager - Gestion des abonnements, quotas et features
 *
 * Système complet pour :
 * - Vérifier les limites d'usage (quotas)
 * - Contrôler l'accès aux fonctionnalités (feature gates)
 * - Tracker l'utilisation
 * - Gérer les upgrades/downgrades
 */
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
    prospect_management: boolean;
    contract_generation: boolean;
    electronic_signature: boolean;
    inventory_management: boolean;
    customer_portal: boolean;
    advanced_analytics: boolean;
    export_data: boolean;
    api_access: boolean;
    white_label: boolean;
    sms_notifications: boolean;
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
    upgrade_required?: string;
}
/**
 * Check if organization can create a new resource
 */
export declare function checkQuota(organizationId: string, resourceType: "users" | "dresses" | "customers" | "prospects" | "contracts" | "api_calls"): Promise<QuotaCheck>;
/**
 * Check multiple quotas at once
 */
export declare function checkQuotas(organizationId: string, resourceTypes: Array<"users" | "dresses" | "customers" | "prospects" | "contracts" | "api_calls">): Promise<Record<string, QuotaCheck>>;
/**
 * Check if organization has access to a feature
 */
export declare function checkFeature(organizationId: string, featureName: keyof SubscriptionFeatures): Promise<FeatureCheck>;
/**
 * Check multiple features at once
 */
export declare function checkFeatures(organizationId: string, featureNames: Array<keyof SubscriptionFeatures>): Promise<Record<string, FeatureCheck>>;
/**
 * Track a usage event
 */
export declare function trackUsage(organizationId: string, eventType: string, resourceType: string, resourceId?: string, metadata?: any): Promise<void>;
/**
 * Update cached usage counts in organization
 */
export declare function updateCachedUsage(organizationId: string): Promise<void>;
/**
 * Get organization's subscription status
 */
export declare function getSubscriptionStatus(organizationId: string): Promise<{
    status: string;
    plan: {
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date | null;
        code: string;
        description: string | null;
        price_monthly: import("@prisma/client/runtime/library").Decimal;
        price_yearly: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        trial_days: number;
        limits: import("@prisma/client/runtime/library").JsonValue;
        features: import("@prisma/client/runtime/library").JsonValue;
        is_public: boolean;
        is_popular: boolean;
        sort_order: number;
    } | null;
    is_trial: boolean;
    is_trial_expired: boolean | null;
    is_subscription_expired: boolean | null;
    is_active: boolean;
    trial_ends_at: Date | null;
    subscription_ends_at: Date | null;
    days_remaining: number | null;
}>;
/**
 * Upgrade/Change subscription plan
 */
export declare function changeSubscriptionPlan(organizationId: string, newPlanId: string, userId?: string): Promise<void>;
/**
 * Check if organization should be warned about quota
 */
export declare function shouldWarnAboutQuota(quotaCheck: QuotaCheck): boolean;
//# sourceMappingURL=subscriptionManager.d.ts.map