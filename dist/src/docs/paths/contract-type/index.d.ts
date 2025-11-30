declare const _default: {
    "/contract-types/{id}/hard": {
        delete: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            parameters: {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    format: string;
                };
                example: string;
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
                                message: string;
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
            security: {
                bearerAuth: never[];
            }[];
        };
    };
    "/contract-types/{id}/soft": {
        patch: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            parameters: {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    format: string;
                };
                example: string;
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
                                    deleted_by: string;
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
            security: {
                bearerAuth: never[];
            }[];
        };
    };
    "/contract-types/{id}": {
        put: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            parameters: {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    format: string;
                };
                example: string;
            }[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            name: string;
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
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                data: {
                                    id: string;
                                    name: string;
                                    updated_by: string;
                                    updated_at: string;
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
            security: {
                bearerAuth: never[];
            }[];
        };
    };
    "/contract-types": {
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
                            $ref: string;
                        };
                        example: {
                            name: string;
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
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                data: {
                                    id: string;
                                    name: string;
                                    created_by: string;
                                    created_at: string;
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
            security: {
                bearerAuth: never[];
            }[];
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map