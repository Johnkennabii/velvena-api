declare const _default: {
    ServiceType: {
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
                nullable: boolean;
            };
            organization_id: {
                type: string;
                format: string;
                nullable: boolean;
                description: string;
            };
            config: {
                type: string;
                nullable: boolean;
                example: {
                    min_duration_days: number;
                    max_duration_days: number;
                    deposit_percentage: number;
                };
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
    CreateServiceTypeInput: {
        type: string;
        required: string[];
        properties: {
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
            config: {
                type: string;
                example: {
                    min_duration_days: number;
                    max_duration_days: number;
                    deposit_percentage: number;
                };
            };
            is_active: {
                type: string;
                example: boolean;
            };
        };
    };
    UpdateServiceTypeInput: {
        type: string;
        properties: {
            name: {
                type: string;
                example: string;
            };
            description: {
                type: string;
                example: string;
            };
            config: {
                type: string;
                example: {
                    min_duration_days: number;
                    max_duration_days: number;
                };
            };
            is_active: {
                type: string;
                example: boolean;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map