declare const _default: {
    "/roles/{id}": {
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
                                    name: string;
                                    description: string;
                                    created_at: string;
                                    created_by: string;
                                    updated_at: null;
                                    updated_by: null;
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
    "/roles": {
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
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        data: ({
                                            id: string;
                                            name: string;
                                            description: string;
                                            created_at: string;
                                            created_by: string;
                                            updated_at: string;
                                            updated_by: string;
                                        } | {
                                            id: string;
                                            name: string;
                                            description: string;
                                            created_at: string;
                                            created_by: string;
                                            updated_at: null;
                                            updated_by: null;
                                        })[];
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
                                    summary: string;
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