declare const _default: {
    "/users/{id}": {
        delete: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                };
            }[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                data: {
                                    message: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        patch: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                };
            }[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                data: {
                                    id: string;
                                    deleted_at: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        put: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                };
                description: string;
            }[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            properties: {
                                password: {
                                    type: string;
                                    description: string;
                                };
                                profile: {
                                    type: string;
                                    description: string;
                                    required: string[];
                                    properties: {
                                        firstname: {
                                            type: string;
                                            example: string;
                                        };
                                        lastname: {
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
                                        country: {
                                            type: string;
                                            example: string;
                                        };
                                        postal_code: {
                                            type: string;
                                            example: string;
                                        };
                                        avatar_url: {
                                            type: string;
                                            example: string;
                                        };
                                        role_id: {
                                            type: string;
                                            format: string;
                                            example: string;
                                        };
                                    };
                                };
                            };
                            example: {
                                password: string;
                                profile: {
                                    firstName: string;
                                    lastName: string;
                                    country: string;
                                    city: string;
                                    address: string;
                                    postal_code: string;
                                    role_id: string;
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
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            email: {
                                                type: string;
                                                example: string;
                                            };
                                            profile: {
                                                type: string;
                                                properties: {
                                                    firstname: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    lastname: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    country: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    city: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    address: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    postal_code: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    role: {
                                                        type: string;
                                                        properties: {
                                                            id: {
                                                                type: string;
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
                                };
                            };
                            example: {
                                success: boolean;
                                data: {
                                    id: string;
                                    email: string;
                                    profile: {
                                        firstName: string;
                                        lastName: string;
                                        country: string;
                                        city: string;
                                        address: string;
                                        postal_code: string;
                                        role: {
                                            name: string;
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
                            example: {
                                success: boolean;
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
                                success: boolean;
                                error: string;
                            };
                        };
                    };
                };
            };
        };
        get: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                };
                description: string;
            }[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                data: {
                                    id: string;
                                    email: string;
                                    profile: {
                                        firstname: string;
                                        lastname: string;
                                        role: {
                                            name: string;
                                        };
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
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                error: string;
                            };
                        };
                    };
                };
            };
        };
    };
    "/users": {
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
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                count: number;
                                data: {
                                    id: string;
                                    email: string;
                                    profile: {
                                        firstname: string;
                                        lastname: string;
                                        role: {
                                            name: string;
                                        };
                                    };
                                }[];
                            };
                        };
                    };
                };
                "500": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
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