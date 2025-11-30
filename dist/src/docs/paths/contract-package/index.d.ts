declare const _default: {
    "/contract-packages/{id}/hard": {
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
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        message: string;
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
                "401": {
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
                "404": {
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
    };
    "/contract-packages/{id}/soft": {
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
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        message: string;
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
                "401": {
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
                "404": {
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
    };
    "/contract-packages/{id}": {
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
                        examples: {
                            updateBasicFields: {
                                summary: string;
                                value: {
                                    name: string;
                                    num_dresses: number;
                                    price_ht: number;
                                    price_ttc: number;
                                };
                            };
                            updateWithAddons: {
                                summary: string;
                                value: {
                                    name: string;
                                    num_dresses: number;
                                    price_ht: number;
                                    price_ttc: number;
                                    addon_ids: string[];
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
                                $ref: string;
                            };
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        data: {
                                            id: string;
                                            name: string;
                                            num_dresses: number;
                                            price_ht: number;
                                            price_ttc: number;
                                            updated_at: string;
                                            updated_by: string;
                                            addons: {
                                                addon: {
                                                    id: string;
                                                    name: string;
                                                    price_ht: number;
                                                    price_ttc: number;
                                                };
                                            }[];
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
                "401": {
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
                "404": {
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
    };
    "/contract-packages": {
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
                            basicPackage: {
                                summary: string;
                                value: {
                                    name: string;
                                    num_dresses: number;
                                    price_ht: number;
                                    price_ttc: number;
                                };
                            };
                            packageWithAddons: {
                                summary: string;
                                value: {
                                    name: string;
                                    num_dresses: number;
                                    price_ht: number;
                                    price_ttc: number;
                                    addon_ids: string[];
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
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        data: {
                                            id: string;
                                            name: string;
                                            num_dresses: number;
                                            price_ht: number;
                                            price_ttc: number;
                                            created_at: string;
                                            created_by: string;
                                            addons: {
                                                addon: {
                                                    id: string;
                                                    name: string;
                                                    price_ht: number;
                                                    price_ttc: number;
                                                };
                                            }[];
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
                "401": {
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
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map