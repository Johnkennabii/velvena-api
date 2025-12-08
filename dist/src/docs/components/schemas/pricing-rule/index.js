export default {
    PricingRule: {
        type: "object",
        properties: {
            id: { type: "string", format: "uuid", example: "c5d8e9f0-1234-5678-9abc-def012345678" },
            name: { type: "string", example: "Tarif weekend" },
            organization_id: { type: "string", format: "uuid", nullable: true, description: "null for global rules" },
            service_type_id: { type: "string", format: "uuid", nullable: true },
            strategy: {
                type: "string",
                enum: ["per_day", "flat_rate", "fixed_price", "tiered"],
                example: "per_day",
                description: "Pricing calculation strategy",
            },
            calculation_config: {
                type: "object",
                example: {
                    price_per_day: 50,
                    tax_rate: 20,
                },
                description: "Configuration for the pricing calculation",
            },
            applies_to: {
                type: "object",
                nullable: true,
                example: {
                    dress_types: ["wedding", "evening"],
                    min_duration_days: 1,
                    max_duration_days: 3,
                },
                description: "Conditions for when this rule applies",
            },
            priority: { type: "integer", example: 10, description: "Higher priority rules are applied first" },
            is_active: { type: "boolean", example: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
        },
    },
    CreatePricingRuleInput: {
        type: "object",
        required: ["name", "strategy", "calculation_config"],
        properties: {
            name: { type: "string", example: "Tarif semaine" },
            service_type_id: { type: "string", format: "uuid", nullable: true },
            strategy: {
                type: "string",
                enum: ["per_day", "flat_rate", "fixed_price", "tiered"],
                example: "tiered",
            },
            calculation_config: {
                type: "object",
                example: {
                    tiers: [
                        { min_days: 1, max_days: 3, price_per_day: 50 },
                        { min_days: 4, max_days: 7, price_per_day: 40 },
                    ],
                    tax_rate: 20,
                },
            },
            applies_to: {
                type: "object",
                example: {
                    dress_types: ["wedding"],
                    min_duration_days: 1,
                },
            },
            priority: { type: "integer", example: 5 },
            is_active: { type: "boolean", example: true },
        },
    },
    UpdatePricingRuleInput: {
        type: "object",
        properties: {
            name: { type: "string", example: "Tarif weekend (updated)" },
            calculation_config: {
                type: "object",
                example: {
                    price_per_day: 60,
                    tax_rate: 20,
                },
            },
            applies_to: { type: "object" },
            priority: { type: "integer", example: 15 },
            is_active: { type: "boolean", example: false },
        },
    },
    CalculatePriceInput: {
        type: "object",
        required: ["dress_id", "start_date", "end_date"],
        properties: {
            dress_id: { type: "string", format: "uuid", example: "a1b2c3d4-5678-90ab-cdef-1234567890ab" },
            start_date: { type: "string", format: "date", example: "2025-12-10" },
            end_date: { type: "string", format: "date", example: "2025-12-13" },
            pricing_rule_id: {
                type: "string",
                format: "uuid",
                nullable: true,
                description: "Optional: specify a pricing rule. If not provided, best matching rule will be used",
            },
        },
    },
    PriceCalculationResult: {
        type: "object",
        properties: {
            success: { type: "boolean", example: true },
            data: {
                type: "object",
                properties: {
                    strategy_used: { type: "string", example: "per_day" },
                    base_price_ht: { type: "number", example: 150 },
                    base_price_ttc: { type: "number", example: 180 },
                    discount_amount: { type: "number", example: 0 },
                    discount_percentage: { type: "number", example: 0 },
                    final_price_ht: { type: "number", example: 150 },
                    final_price_ttc: { type: "number", example: 180 },
                    tax_amount: { type: "number", example: 30 },
                    tax_rate: { type: "number", example: 20 },
                    duration_days: { type: "integer", example: 3 },
                    breakdown: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                day: { type: "integer", example: 1 },
                                date: { type: "string", format: "date", example: "2025-12-10" },
                                price_ht: { type: "number", example: 50 },
                                price_ttc: { type: "number", example: 60 },
                            },
                        },
                    },
                },
            },
        },
    },
};
//# sourceMappingURL=index.js.map