declare const _default: {
    "/billing/status": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    status: {
                                        type: string;
                                        enum: string[];
                                        example: string;
                                    };
                                    plan: {
                                        type: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                            };
                                            name: {
                                                type: string;
                                                example: string;
                                            };
                                            code: {
                                                type: string;
                                                example: string;
                                            };
                                        };
                                    };
                                    is_trial: {
                                        type: string;
                                        example: boolean;
                                    };
                                    is_trial_expired: {
                                        type: string;
                                        example: boolean;
                                    };
                                    is_subscription_expired: {
                                        type: string;
                                        example: boolean;
                                    };
                                    is_active: {
                                        type: string;
                                        example: boolean;
                                    };
                                    trial_ends_at: {
                                        type: string;
                                        format: string;
                                        example: string;
                                    };
                                    subscription_ends_at: {
                                        type: string;
                                        format: string;
                                        nullable: boolean;
                                    };
                                    days_remaining: {
                                        type: string;
                                        example: number;
                                        nullable: boolean;
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
                500: {
                    description: string;
                };
            };
        };
    };
    "/billing/plans": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                items: {
                                    type: string;
                                    properties: {
                                        id: {
                                            type: string;
                                            format: string;
                                        };
                                        name: {
                                            type: string;
                                            example: string;
                                        };
                                        code: {
                                            type: string;
                                            example: string;
                                        };
                                        description: {
                                            type: string;
                                            example: string;
                                        };
                                        price_monthly: {
                                            type: string;
                                            example: number;
                                        };
                                        price_yearly: {
                                            type: string;
                                            example: number;
                                        };
                                        currency: {
                                            type: string;
                                            example: string;
                                        };
                                        trial_days: {
                                            type: string;
                                            example: number;
                                        };
                                        limits: {
                                            type: string;
                                            properties: {
                                                users: {
                                                    type: string;
                                                    example: number;
                                                };
                                                dresses: {
                                                    type: string;
                                                    example: number;
                                                };
                                                customers: {
                                                    type: string;
                                                    example: number;
                                                };
                                                contracts_per_month: {
                                                    type: string;
                                                    example: number;
                                                };
                                                storage_gb: {
                                                    type: string;
                                                    example: number;
                                                };
                                                api_calls_per_day: {
                                                    type: string;
                                                    example: number;
                                                };
                                                email_notifications: {
                                                    type: string;
                                                    example: number;
                                                };
                                            };
                                        };
                                        features: {
                                            type: string;
                                            properties: {
                                                prospect_management: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                contract_generation: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                electronic_signature: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                inventory_management: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                customer_portal: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                advanced_analytics: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                export_data: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                api_access: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                white_label: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                sms_notifications: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                        is_popular: {
                                            type: string;
                                            example: boolean;
                                        };
                                        sort_order: {
                                            type: string;
                                            example: number;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                500: {
                    description: string;
                };
            };
        };
    };
    "/billing/quotas": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    users: {
                                        $ref: string;
                                    };
                                    dresses: {
                                        $ref: string;
                                    };
                                    customers: {
                                        $ref: string;
                                    };
                                    contracts: {
                                        $ref: string;
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
                500: {
                    description: string;
                };
            };
        };
    };
    "/billing/features": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                additionalProperties: {
                                    $ref: string;
                                };
                                example: {
                                    electronic_signature: {
                                        allowed: boolean;
                                        feature_name: string;
                                        upgrade_required: string;
                                    };
                                    advanced_analytics: {
                                        allowed: boolean;
                                        feature_name: string;
                                        upgrade_required: string;
                                    };
                                    api_access: {
                                        allowed: boolean;
                                        feature_name: string;
                                        upgrade_required: string;
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
                500: {
                    description: string;
                };
            };
        };
    };
    "/billing/dashboard": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    quotas: {
                                        type: string;
                                        properties: {
                                            users: {
                                                $ref: string;
                                            };
                                            dresses: {
                                                $ref: string;
                                            };
                                            customers: {
                                                $ref: string;
                                            };
                                            contracts: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                    features: {
                                        type: string;
                                        additionalProperties: {
                                            $ref: string;
                                        };
                                    };
                                    subscription: {
                                        type: string;
                                        properties: {
                                            status: {
                                                type: string;
                                            };
                                            plan: {
                                                type: string;
                                            };
                                            is_trial: {
                                                type: string;
                                            };
                                            is_trial_expired: {
                                                type: string;
                                            };
                                            days_remaining: {
                                                type: string;
                                                nullable: boolean;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
                500: {
                    description: string;
                };
            };
        };
    };
    "/billing/upgrade": {
        post: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            required: string[];
                            properties: {
                                plan_code: {
                                    type: string;
                                    enum: string[];
                                    example: string;
                                    description: string;
                                };
                            };
                        };
                    };
                };
            };
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    message: {
                                        type: string;
                                        example: string;
                                    };
                                    plan: {
                                        type: string;
                                        properties: {
                                            code: {
                                                type: string;
                                                example: string;
                                            };
                                            name: {
                                                type: string;
                                                example: string;
                                            };
                                            price_monthly: {
                                                type: string;
                                                example: number;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                400: {
                    description: string;
                };
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
                500: {
                    description: string;
                };
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map