declare const _default: {
    AuthRefreshResponse: {
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
                description: string;
                example: string;
            };
            role: {
                type: string[];
                description: string;
                example: string;
            };
            profile: {
                type: string;
                description: string;
                required: string[];
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
        example: {
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
    AuthRefreshErrorResponse: {
        type: string;
        properties: {
            error: {
                type: string;
                example: string;
            };
        };
    };
    AuthMeResponse: {
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
                description: string;
                example: string;
            };
            role: {
                type: string[];
                description: string;
                example: string;
            };
            profile: {
                type: string;
                description: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        format: string;
                        description: string;
                        example: string;
                    };
                    firstName: {
                        type: string[];
                        description: string;
                        example: string;
                    };
                    lastName: {
                        type: string[];
                        description: string;
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
                                description: string;
                                example: string;
                            };
                        };
                    };
                };
            };
        };
        example: {
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
    AuthMeErrorResponse: {
        type: string;
        properties: {
            error: {
                type: string;
                example: string;
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
                        examples: {
                            validCredentials: {
                                summary: string;
                                value: {
                                    email: string;
                                    password: string;
                                };
                            };
                            invalidCredentials: {
                                summary: string;
                                value: {
                                    email: string;
                                    password: string;
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
                                    };
                                    role: {
                                        type: string[];
                                        example: string;
                                        description: string;
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
                                userNotFound: {
                                    summary: string;
                                    value: {
                                        error: string;
                                    };
                                };
                                invalidPassword: {
                                    summary: string;
                                    value: {
                                        error: string;
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