declare const _default: {
    "/dress-conditions/{id}": {
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
                            examples: {
                                success: {
                                    value: {
                                        success: boolean;
                                        message: string;
                                    };
                                };
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
                            examples: {
                                serverError: {
                                    value: {
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
    };
    "/dress-conditions": {
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
                            $ref: string;
                        };
                        examples: {
                            createCondition: {
                                summary: string;
                                value: {
                                    name: string;
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
                                $ref: string;
                            };
                            examples: {
                                success: {
                                    value: {
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
                    };
                };
                "400": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            examples: {
                                missingName: {
                                    value: {
                                        success: boolean;
                                        error: string;
                                    };
                                };
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
                            examples: {
                                serverError: {
                                    value: {
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
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map