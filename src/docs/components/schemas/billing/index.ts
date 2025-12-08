export default {
  QuotaCheck: {
    type: "object",
    properties: {
      allowed: {
        type: "boolean",
        description: "Whether creating a new resource is allowed (false if quota is exceeded)",
        example: true,
      },
      current_usage: {
        type: "number",
        description: "Current number of resources used",
        example: 5,
      },
      limit: {
        type: "number",
        description: "Maximum number of resources allowed by the subscription plan",
        example: 10,
      },
      remaining: {
        type: "number",
        description: "Number of resources remaining before hitting the limit",
        example: 5,
      },
      percentage_used: {
        type: "number",
        description: "Percentage of quota used (0-100)",
        example: 50,
      },
    },
    example: {
      allowed: true,
      current_usage: 5,
      limit: 10,
      remaining: 5,
      percentage_used: 50,
    },
  },

  FeatureCheck: {
    type: "object",
    properties: {
      allowed: {
        type: "boolean",
        description: "Whether the feature is available in the current plan",
        example: false,
      },
      feature_name: {
        type: "string",
        description: "Name of the feature being checked",
        example: "electronic_signature",
      },
      upgrade_required: {
        type: "string",
        description: "Minimum plan required to access this feature (only present if allowed is false)",
        example: "pro",
        nullable: true,
      },
    },
    example: {
      allowed: false,
      feature_name: "electronic_signature",
      upgrade_required: "pro",
    },
  },

  QuotaExceededError: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Quota limit reached" },
      code: { type: "string", example: "QUOTA_EXCEEDED" },
      details: {
        type: "object",
        properties: {
          resource_type: { type: "string", example: "users" },
          current_usage: { type: "number", example: 10 },
          limit: { type: "number", example: 10 },
          percentage_used: { type: "number", example: 100 },
        },
      },
      message: {
        type: "string",
        example: "You have reached your users limit (10). Please upgrade your plan to continue.",
      },
      upgrade_url: { type: "string", example: "/settings/billing" },
    },
  },

  FeatureNotAvailableError: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Feature not available in your plan" },
      code: { type: "string", example: "FEATURE_NOT_AVAILABLE" },
      details: {
        type: "object",
        properties: {
          feature_name: { type: "string", example: "electronic_signature" },
          upgrade_required: { type: "string", example: "pro" },
        },
      },
      message: {
        type: "string",
        example: "The feature 'electronic_signature' is not available in your current plan. Please upgrade to 'pro' to access this feature.",
      },
      upgrade_url: { type: "string", example: "/settings/billing" },
    },
  },

  SubscriptionPlan: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "uuid-here" },
      name: { type: "string", example: "Pro" },
      code: { type: "string", example: "pro" },
      description: {
        type: "string",
        example: "Pour les boutiques professionnelles en croissance",
      },
      price_monthly: { type: "number", example: 49, description: "Price in EUR" },
      price_yearly: {
        type: "number",
        example: 490,
        description: "Price in EUR with discount",
      },
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
};
