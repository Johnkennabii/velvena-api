export default {
    "/billing/status": {
        get: {
            tags: ["Billing & Subscription"],
            summary: "Get subscription status",
            description: "Returns the current subscription status for the authenticated user's organization including trial information and expiration dates.",
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Subscription status retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    status: {
                                        type: "string",
                                        enum: ["trial", "active", "suspended", "cancelled"],
                                        example: "trial",
                                    },
                                    plan: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string", format: "uuid" },
                                            name: { type: "string", example: "Free" },
                                            code: { type: "string", example: "free" },
                                        },
                                    },
                                    is_trial: { type: "boolean", example: true },
                                    is_trial_expired: { type: "boolean", example: false },
                                    is_subscription_expired: { type: "boolean", example: false },
                                    is_active: { type: "boolean", example: true },
                                    trial_ends_at: {
                                        type: "string",
                                        format: "date-time",
                                        example: "2025-12-21T00:00:00.000Z",
                                    },
                                    subscription_ends_at: {
                                        type: "string",
                                        format: "date-time",
                                        nullable: true,
                                    },
                                    days_remaining: { type: "number", example: 12, nullable: true },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized - Missing or invalid token" },
                500: { description: "Internal server error" },
            },
        },
    },
    "/billing/plans": {
        get: {
            tags: ["Billing & Subscription"],
            summary: "List all subscription plans",
            description: "Returns all public subscription plans available. This endpoint is public and does not require authentication.",
            responses: {
                200: {
                    description: "Subscription plans retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string", format: "uuid" },
                                        name: { type: "string", example: "Pro" },
                                        code: { type: "string", example: "pro" },
                                        description: {
                                            type: "string",
                                            example: "Pour les boutiques professionnelles",
                                        },
                                        price_monthly: { type: "number", example: 49 },
                                        price_yearly: { type: "number", example: 490 },
                                        currency: { type: "string", example: "EUR" },
                                        trial_days: { type: "number", example: 14 },
                                        limits: {
                                            type: "object",
                                            properties: {
                                                users: { type: "number", example: 20 },
                                                dresses: { type: "number", example: 9999999 },
                                                customers: { type: "number", example: 9999999 },
                                                contracts_per_month: { type: "number", example: 200 },
                                                storage_gb: { type: "number", example: 50 },
                                                api_calls_per_day: { type: "number", example: 10000 },
                                                email_notifications: { type: "number", example: 2000 },
                                            },
                                        },
                                        features: {
                                            type: "object",
                                            properties: {
                                                prospect_management: { type: "boolean", example: true },
                                                contract_generation: { type: "boolean", example: true },
                                                electronic_signature: { type: "boolean", example: true },
                                                inventory_management: { type: "boolean", example: true },
                                                customer_portal: { type: "boolean", example: true },
                                                advanced_analytics: { type: "boolean", example: true },
                                                export_data: { type: "boolean", example: true },
                                                api_access: { type: "boolean", example: true },
                                                white_label: { type: "boolean", example: false },
                                                sms_notifications: { type: "boolean", example: true },
                                            },
                                        },
                                        is_popular: { type: "boolean", example: true },
                                        sort_order: { type: "number", example: 3 },
                                    },
                                },
                            },
                        },
                    },
                },
                500: { description: "Internal server error" },
            },
        },
    },
    "/billing/quotas": {
        get: {
            tags: ["Billing & Subscription"],
            summary: "Get organization quotas",
            description: "Returns the current quota usage for the authenticated user's organization across all resource types (users, dresses, customers, contracts).",
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Quotas retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    users: { $ref: "#/components/schemas/QuotaCheck" },
                                    dresses: { $ref: "#/components/schemas/QuotaCheck" },
                                    customers: { $ref: "#/components/schemas/QuotaCheck" },
                                    contracts: { $ref: "#/components/schemas/QuotaCheck" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                500: { description: "Internal server error" },
            },
        },
    },
    "/billing/features": {
        get: {
            tags: ["Billing & Subscription"],
            summary: "Get organization features",
            description: "Returns the feature access status for the authenticated user's organization. Shows which premium features are available based on the current subscription plan.",
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Features retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                additionalProperties: {
                                    $ref: "#/components/schemas/FeatureCheck",
                                },
                                example: {
                                    electronic_signature: {
                                        allowed: false,
                                        feature_name: "electronic_signature",
                                        upgrade_required: "pro",
                                    },
                                    advanced_analytics: {
                                        allowed: false,
                                        feature_name: "advanced_analytics",
                                        upgrade_required: "pro",
                                    },
                                    api_access: {
                                        allowed: false,
                                        feature_name: "api_access",
                                        upgrade_required: "pro",
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                500: { description: "Internal server error" },
            },
        },
    },
    "/billing/dashboard": {
        get: {
            tags: ["Billing & Subscription"],
            summary: "Get complete billing dashboard",
            description: "Returns quotas, features, and subscription status in a single request. Ideal for dashboard pages that need all billing information.",
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Dashboard data retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    quotas: {
                                        type: "object",
                                        properties: {
                                            users: { $ref: "#/components/schemas/QuotaCheck" },
                                            dresses: { $ref: "#/components/schemas/QuotaCheck" },
                                            customers: { $ref: "#/components/schemas/QuotaCheck" },
                                            contracts: { $ref: "#/components/schemas/QuotaCheck" },
                                        },
                                    },
                                    features: {
                                        type: "object",
                                        additionalProperties: {
                                            $ref: "#/components/schemas/FeatureCheck",
                                        },
                                    },
                                    subscription: {
                                        type: "object",
                                        properties: {
                                            status: { type: "string" },
                                            plan: { type: "object" },
                                            is_trial: { type: "boolean" },
                                            is_trial_expired: { type: "boolean" },
                                            days_remaining: { type: "number", nullable: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                500: { description: "Internal server error" },
            },
        },
    },
    "/billing/upgrade": {
        post: {
            tags: ["Billing & Subscription"],
            summary: "Upgrade subscription plan",
            description: "Changes the organization's subscription plan to a new plan. This should be called after successful payment verification.",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["plan_code"],
                            properties: {
                                plan_code: {
                                    type: "string",
                                    enum: ["free", "basic", "pro", "enterprise"],
                                    example: "pro",
                                    description: "The code of the subscription plan to upgrade to",
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Subscription upgraded successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: {
                                        type: "string",
                                        example: "Plan successfully upgraded to Pro",
                                    },
                                    plan: {
                                        type: "object",
                                        properties: {
                                            code: { type: "string", example: "pro" },
                                            name: { type: "string", example: "Pro" },
                                            price_monthly: { type: "number", example: 49 },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { description: "Bad request - Missing plan_code" },
                401: { description: "Unauthorized" },
                404: { description: "Subscription plan not found" },
                500: { description: "Internal server error" },
            },
        },
    },
};
//# sourceMappingURL=index.js.map