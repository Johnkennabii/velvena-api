export default {
    ServiceType: {
        type: "object",
        properties: {
            id: { type: "string", format: "uuid", example: "f47ac10b-58cc-4372-a567-0e02b2c3d479" },
            name: { type: "string", example: "Location courte durée" },
            code: { type: "string", example: "rental_short" },
            description: { type: "string", example: "Location pour événements de courte durée (1-3 jours)", nullable: true },
            organization_id: { type: "string", format: "uuid", nullable: true, description: "null for global service types" },
            config: {
                type: "object",
                nullable: true,
                example: {
                    min_duration_days: 1,
                    max_duration_days: 3,
                    deposit_percentage: 30,
                },
            },
            is_active: { type: "boolean", example: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
        },
    },
    CreateServiceTypeInput: {
        type: "object",
        required: ["name", "code"],
        properties: {
            name: { type: "string", example: "Location longue durée" },
            code: { type: "string", example: "rental_long" },
            description: { type: "string", example: "Location pour plusieurs semaines ou mois" },
            config: {
                type: "object",
                example: {
                    min_duration_days: 7,
                    max_duration_days: 90,
                    deposit_percentage: 20,
                },
            },
            is_active: { type: "boolean", example: true },
        },
    },
    UpdateServiceTypeInput: {
        type: "object",
        properties: {
            name: { type: "string", example: "Location courte durée (mise à jour)" },
            description: { type: "string", example: "Description mise à jour" },
            config: {
                type: "object",
                example: {
                    min_duration_days: 1,
                    max_duration_days: 5,
                },
            },
            is_active: { type: "boolean", example: false },
        },
    },
};
//# sourceMappingURL=index.js.map