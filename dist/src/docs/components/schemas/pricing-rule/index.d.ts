declare const _default: {
    PricingRule: {
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
            organization_id: {
                type: string;
                format: string;
                nullable: boolean;
                description: string;
            };
            service_type_id: {
                type: string;
                format: string;
                nullable: boolean;
            };
            strategy: {
                type: string;
                enum: string[];
                example: string;
                description: string;
            };
            calculation_config: {
                type: string;
                example: {
                    price_per_day: number;
                    tax_rate: number;
                };
                description: string;
            };
            applies_to: {
                type: string;
                nullable: boolean;
                example: {
                    dress_types: string[];
                    min_duration_days: number;
                    max_duration_days: number;
                };
                description: string;
            };
            priority: {
                type: string;
                example: number;
                description: string;
            };
            is_active: {
                type: string;
                example: boolean;
            };
            created_at: {
                type: string;
                format: string;
            };
            updated_at: {
                type: string;
                format: string;
            };
        };
    };
    CreatePricingRuleInput: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
            };
            service_type_id: {
                type: string;
                format: string;
                nullable: boolean;
            };
            strategy: {
                type: string;
                enum: string[];
                example: string;
            };
            calculation_config: {
                type: string;
                example: {
                    tiers: {
                        min_days: number;
                        max_days: number;
                        price_per_day: number;
                    }[];
                    tax_rate: number;
                };
            };
            applies_to: {
                type: string;
                example: {
                    dress_types: string[];
                    min_duration_days: number;
                };
            };
            priority: {
                type: string;
                example: number;
            };
            is_active: {
                type: string;
                example: boolean;
            };
        };
    };
    UpdatePricingRuleInput: {
        type: string;
        properties: {
            name: {
                type: string;
                example: string;
            };
            calculation_config: {
                type: string;
                example: {
                    price_per_day: number;
                    tax_rate: number;
                };
            };
            applies_to: {
                type: string;
            };
            priority: {
                type: string;
                example: number;
            };
            is_active: {
                type: string;
                example: boolean;
            };
        };
    };
    CalculatePriceInput: {
        type: string;
        required: string[];
        properties: {
            dress_id: {
                type: string;
                format: string;
                example: string;
            };
            start_date: {
                type: string;
                format: string;
                example: string;
            };
            end_date: {
                type: string;
                format: string;
                example: string;
            };
            pricing_rule_id: {
                type: string;
                format: string;
                nullable: boolean;
                description: string;
            };
        };
    };
    PriceCalculationResult: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                properties: {
                    strategy_used: {
                        type: string;
                        example: string;
                    };
                    base_price_ht: {
                        type: string;
                        example: number;
                    };
                    base_price_ttc: {
                        type: string;
                        example: number;
                    };
                    discount_amount: {
                        type: string;
                        example: number;
                    };
                    discount_percentage: {
                        type: string;
                        example: number;
                    };
                    final_price_ht: {
                        type: string;
                        example: number;
                    };
                    final_price_ttc: {
                        type: string;
                        example: number;
                    };
                    tax_amount: {
                        type: string;
                        example: number;
                    };
                    tax_rate: {
                        type: string;
                        example: number;
                    };
                    duration_days: {
                        type: string;
                        example: number;
                    };
                    breakdown: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                day: {
                                    type: string;
                                    example: number;
                                };
                                date: {
                                    type: string;
                                    format: string;
                                    example: string;
                                };
                                price_ht: {
                                    type: string;
                                    example: number;
                                };
                                price_ttc: {
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
};
export default _default;
//# sourceMappingURL=index.d.ts.map