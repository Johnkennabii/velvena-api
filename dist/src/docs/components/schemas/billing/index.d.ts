declare const _default: {
    QuotaCheck: {
        type: string;
        properties: {
            allowed: {
                type: string;
                description: string;
                example: boolean;
            };
            current_usage: {
                type: string;
                description: string;
                example: number;
            };
            limit: {
                type: string;
                description: string;
                example: number;
            };
            remaining: {
                type: string;
                description: string;
                example: number;
            };
            percentage_used: {
                type: string;
                description: string;
                example: number;
            };
        };
        example: {
            allowed: boolean;
            current_usage: number;
            limit: number;
            remaining: number;
            percentage_used: number;
        };
    };
    FeatureCheck: {
        type: string;
        properties: {
            allowed: {
                type: string;
                description: string;
                example: boolean;
            };
            feature_name: {
                type: string;
                description: string;
                example: string;
            };
            upgrade_required: {
                type: string;
                description: string;
                example: string;
                nullable: boolean;
            };
        };
        example: {
            allowed: boolean;
            feature_name: string;
            upgrade_required: string;
        };
    };
    QuotaExceededError: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            error: {
                type: string;
                example: string;
            };
            code: {
                type: string;
                example: string;
            };
            details: {
                type: string;
                properties: {
                    resource_type: {
                        type: string;
                        example: string;
                    };
                    current_usage: {
                        type: string;
                        example: number;
                    };
                    limit: {
                        type: string;
                        example: number;
                    };
                    percentage_used: {
                        type: string;
                        example: number;
                    };
                };
            };
            message: {
                type: string;
                example: string;
            };
            upgrade_url: {
                type: string;
                example: string;
            };
        };
    };
    FeatureNotAvailableError: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            error: {
                type: string;
                example: string;
            };
            code: {
                type: string;
                example: string;
            };
            details: {
                type: string;
                properties: {
                    feature_name: {
                        type: string;
                        example: string;
                    };
                    upgrade_required: {
                        type: string;
                        example: string;
                    };
                };
            };
            message: {
                type: string;
                example: string;
            };
            upgrade_url: {
                type: string;
                example: string;
            };
        };
    };
    SubscriptionPlan: {
        type: string;
        properties: {
            id: {
                type: string;
                format: string;
                example: string;
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
                description: string;
            };
            price_yearly: {
                type: string;
                example: number;
                description: string;
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
export default _default;
//# sourceMappingURL=index.d.ts.map