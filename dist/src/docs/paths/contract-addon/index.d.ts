declare const _default: {
    "/contract-addons/{id}/hard": {
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
                    example: string;
                };
            }[];
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
                "409": {
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
    "/contract-addons/{id}/soft": {
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
                    example: string;
                };
            }[];
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
                                        data: {
                                            id: string;
                                            name: string;
                                            price_ht: number;
                                            price_ttc: number;
                                            included: boolean;
                                            deleted_by: string;
                                            deleted_at: string;
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
    "/contract-addons/{id}": {
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
                    example: string;
                };
            }[];
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
                            updatePrices: {
                                summary: string;
                                value: {
                                    name: string;
                                    description: string;
                                    price_ht: number;
                                    price_ttc: number;
                                    included: boolean;
                                };
                            };
                            setAsIncluded: {
                                summary: string;
                                value: {
                                    name: string;
                                    included: boolean;
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
                                            description: string;
                                            price_ht: number;
                                            price_ttc: number;
                                            included: boolean;
                                            updated_by: string;
                                            updated_at: string;
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
    "/contract-addons": {
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
                            standardAddon: {
                                summary: string;
                                value: {
                                    name: string;
                                    description: string;
                                    price_ht: number;
                                    price_ttc: number;
                                    included: boolean;
                                };
                            };
                            includedAddon: {
                                summary: string;
                                value: {
                                    name: string;
                                    included: boolean;
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
                                            description: string;
                                            price_ht: number;
                                            price_ttc: number;
                                            included: boolean;
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