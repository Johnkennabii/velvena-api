declare const _default: {
    "/organizations/initialize": {
        post: {
            tags: string[];
            summary: string;
            description: string;
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            required: string[];
                            properties: {
                                organizationName: {
                                    type: string;
                                    example: string;
                                    description: string;
                                };
                                slug: {
                                    type: string;
                                    example: string;
                                    description: string;
                                };
                                email: {
                                    type: string;
                                    format: string;
                                    example: string;
                                    description: string;
                                };
                                phone: {
                                    type: string;
                                    example: string;
                                    description: string;
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
                                    enum: string[];
                                    default: string;
                                    description: string;
                                };
                                userEmail: {
                                    type: string;
                                    format: string;
                                    example: string;
                                    description: string;
                                };
                                password: {
                                    type: string;
                                    format: string;
                                    minLength: number;
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
                    };
                };
            };
            responses: {
                201: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    message: {
                                        type: string;
                                        example: string;
                                    };
                                    token: {
                                        type: string;
                                        description: string;
                                    };
                                    organization: {
                                        type: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                            };
                                            name: {
                                                type: string;
                                                example: string;
                                            };
                                            slug: {
                                                type: string;
                                                example: string;
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
                                            };
                                        };
                                    };
                                    user: {
                                        type: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                            };
                                            email: {
                                                type: string;
                                                format: string;
                                            };
                                            role: {
                                                type: string;
                                                example: string;
                                            };
                                            profile: {
                                                type: string;
                                                properties: {
                                                    firstName: {
                                                        type: string;
                                                    };
                                                    lastName: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                400: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    error: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                500: {
                    description: string;
                };
            };
        };
    };
    "/organizations/me": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
            };
        };
        put: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                400: {
                    description: string;
                };
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
            };
        };
    };
    "/organizations/me/stats": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
            };
        };
    };
    "/organizations": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                in: string;
                name: string;
                schema: {
                    type: string;
                    default: number;
                };
                description: string;
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    data: {
                                        type: string;
                                        items: {
                                            $ref: string;
                                        };
                                    };
                                    total: {
                                        type: string;
                                        example: number;
                                    };
                                    page: {
                                        type: string;
                                        example: number;
                                    };
                                    limit: {
                                        type: string;
                                        example: number;
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
                403: {
                    description: string;
                };
            };
        };
        post: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
            responses: {
                201: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                400: {
                    description: string;
                };
                401: {
                    description: string;
                };
                403: {
                    description: string;
                };
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map