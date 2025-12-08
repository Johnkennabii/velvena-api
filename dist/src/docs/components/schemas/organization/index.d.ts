declare const _default: {
    Organization: {
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
            slug: {
                type: string;
                example: string;
            };
            email: {
                type: string;
                format: string;
                example: string;
                nullable: boolean;
            };
            phone: {
                type: string;
                example: string;
                nullable: boolean;
            };
            address: {
                type: string;
                example: string;
                nullable: boolean;
            };
            city: {
                type: string;
                example: string;
                nullable: boolean;
            };
            postal_code: {
                type: string;
                example: string;
                nullable: boolean;
            };
            country: {
                type: string;
                example: string;
                nullable: boolean;
            };
            logo_url: {
                type: string;
                format: string;
                example: string;
                nullable: boolean;
            };
            settings: {
                type: string;
                nullable: boolean;
            };
            subscription_plan: {
                type: string;
                example: string;
            };
            subscription_status: {
                type: string;
                example: string;
            };
            trial_ends_at: {
                type: string;
                format: string;
                nullable: boolean;
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
    OrganizationStats: {
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
            prospects: {
                type: string;
                example: number;
            };
            active_contracts: {
                type: string;
                example: number;
            };
        };
    };
    CreateOrganizationInput: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
            };
            slug: {
                type: string;
                example: string;
            };
            email: {
                type: string;
                format: string;
                example: string;
            };
            phone: {
                type: string;
                example: string;
            };
            address: {
                type: string;
                example: string;
            };
            city: {
                type: string;
                example: string;
            };
            postal_code: {
                type: string;
                example: string;
            };
            country: {
                type: string;
                example: string;
            };
            subscription_plan: {
                type: string;
                example: string;
                enum: string[];
            };
        };
    };
    UpdateOrganizationInput: {
        type: string;
        properties: {
            name: {
                type: string;
                example: string;
            };
            email: {
                type: string;
                format: string;
                example: string;
            };
            phone: {
                type: string;
                example: string;
            };
            address: {
                type: string;
                example: string;
            };
            city: {
                type: string;
                example: string;
            };
            postal_code: {
                type: string;
                example: string;
            };
            country: {
                type: string;
                example: string;
            };
            logo_url: {
                type: string;
                format: string;
            };
            settings: {
                type: string;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map