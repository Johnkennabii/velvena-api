declare const _default: {
    "/auth/refresh": {
        post: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        token: string;
                                        id: string;
                                        email: string;
                                        role: string;
                                        profile: {
                                            id: string;
                                            firstName: string;
                                            lastName: string;
                                            role: {
                                                id: string;
                                                name: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                "401": {
                    description: string;
                    content: {
                        "application/json": {
                            examples: {
                                missingToken: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                                invalidToken: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                            };
                        };
                    };
                };
                "404": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
                "400": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
                "500": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
            };
        };
    };
    "/auth/me": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    token: {
                                        type: string;
                                        description: string;
                                        example: string;
                                    };
                                    id: {
                                        type: string;
                                        format: string;
                                        description: string;
                                        example: string;
                                    };
                                    email: {
                                        type: string;
                                        format: string;
                                        example: string;
                                        description: string;
                                    };
                                    role: {
                                        type: string[];
                                        example: string;
                                        description: string;
                                    };
                                    profile: {
                                        type: string;
                                        description: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            firstName: {
                                                type: string[];
                                                example: string;
                                            };
                                            lastName: {
                                                type: string[];
                                                example: string;
                                            };
                                            role: {
                                                type: string;
                                                description: string;
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
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        token: string;
                                        id: string;
                                        email: string;
                                        role: string;
                                        profile: {
                                            id: string;
                                            firstName: string;
                                            lastName: string;
                                            role: {
                                                id: string;
                                                name: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                "401": {
                    description: string;
                    content: {
                        "application/json": {
                            examples: {
                                missingToken: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                                invalidToken: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                            };
                        };
                    };
                };
                "404": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
                "400": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
            };
        };
    };
    "/auth/login": {
        post: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            required: string[];
                            properties: {
                                email: {
                                    type: string;
                                    format: string;
                                    example: string;
                                    description: string;
                                };
                                password: {
                                    type: string;
                                    format: string;
                                    example: string;
                                    description: string;
                                };
                            };
                        };
                    };
                };
            };
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    token: {
                                        type: string;
                                        example: string;
                                    };
                                    id: {
                                        type: string;
                                        example: string;
                                    };
                                    email: {
                                        type: string;
                                        example: string;
                                    };
                                    role: {
                                        type: string[];
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                "401": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
                "500": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
            };
        };
    };
    "/auth/register": {
        post: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            "x-quota-protected": boolean;
            "x-quota-resource": string;
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
                                email: {
                                    type: string;
                                    format: string;
                                    example: string;
                                    description: string;
                                };
                                password: {
                                    type: string;
                                    format: string;
                                    example: string;
                                    description: string;
                                };
                                roleName: {
                                    type: string;
                                    example: string;
                                    description: string;
                                };
                                firstName: {
                                    type: string;
                                    example: string;
                                    description: string;
                                };
                                lastName: {
                                    type: string;
                                    example: string;
                                    description: string;
                                };
                            };
                        };
                        examples: {
                            basicExample: {
                                summary: string;
                                value: {
                                    email: string;
                                    password: string;
                                    roleName: string;
                                    firstName: string;
                                    lastName: string;
                                };
                            };
                        };
                    };
                };
            };
            responses: {
                "201": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    id: {
                                        type: string;
                                        format: string;
                                        example: string;
                                    };
                                    email: {
                                        type: string;
                                        format: string;
                                        example: string;
                                    };
                                    role: {
                                        type: string;
                                        example: string;
                                    };
                                    profile: {
                                        type: string;
                                        description: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            role_id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            firstName: {
                                                type: string[];
                                                example: string;
                                            };
                                            lastName: {
                                                type: string[];
                                                example: string;
                                            };
                                            created_at: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            created_by: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                        };
                                    };
                                };
                            };
                            examples: {
                                successExample: {
                                    summary: string;
                                    value: {
                                        id: string;
                                        email: string;
                                        role: string;
                                        profile: {
                                            id: string;
                                            role_id: string;
                                            firstName: string;
                                            lastName: string;
                                            created_at: string;
                                            created_by: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                "400": {
                    description: string;
                    content: {
                        "application/json": {
                            examples: {
                                missingFields: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                                duplicateUser: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                                roleNotFound: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                            };
                        };
                    };
                };
                "401": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
                            };
                        };
                    };
                };
                "402": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                error: string;
                                code: string;
                                details: {
                                    resource_type: string;
                                    current_usage: number;
                                    limit: number;
                                    percentage_used: number;
                                };
                                message: string;
                                upgrade_url: string;
                            };
                        };
                    };
                };
                "500": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
                                error: string;
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