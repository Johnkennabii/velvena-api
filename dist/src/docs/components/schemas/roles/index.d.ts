declare const _default: {
    GetRoleByIdResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                $ref: string;
            };
        };
    };
    Role: {
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
            description: {
                type: string[];
                example: string;
            };
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            created_by: {
                type: string[];
                example: string;
            };
            updated_at: {
                type: string[];
                format: string;
                example: string;
            };
            updated_by: {
                type: string[];
                example: string;
            };
        };
        required: string[];
    };
    GetRolesResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    RoleErrorResponse: {
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
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map