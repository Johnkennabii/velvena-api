declare const _default: {
    title: string;
    type: string;
    properties: {
        data: {
            type: string;
            description: string;
        };
        privateKey: {
            type: string;
            description: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
    "/contracts/{id}/hard": {
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
            }[];
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
                                    message: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                "404": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/contracts/{id}": {
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
            }[];
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
                                    message: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                "404": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    UpdateContractRequest: {
        type: string;
        description: string;
        properties: {
            status: {
                type: string;
                description: string;
                enum: string[];
                example: string;
            };
            start_datetime: {
                type: string;
                format: string;
                description: string;
                example: string;
            };
            end_datetime: {
                type: string;
                format: string;
                description: string;
                example: string;
            };
            deposit_payment_method: {
                type: string;
                description: string;
                enum: string[];
                example: string;
            };
            account_ht: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            account_ttc: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            caution_ht: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            caution_ttc: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            total_price_ht: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            total_price_ttc: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
        };
        additionalProperties: boolean;
    };
    UpdateContractResponse: {
        type: string;
        description: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                description: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    status: {
                        type: string;
                        example: string;
                    };
                    start_datetime: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    end_datetime: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    deposit_payment_method: {
                        type: string[];
                        example: string;
                    };
                    account_ht: {
                        type: string[];
                        example: number;
                    };
                    account_ttc: {
                        type: string[];
                        example: number;
                    };
                    caution_ht: {
                        type: string[];
                        example: number;
                    };
                    caution_ttc: {
                        type: string[];
                        example: number;
                    };
                    total_price_ht: {
                        type: string[];
                        example: number;
                    };
                    total_price_ttc: {
                        type: string[];
                        example: number;
                    };
                    updated_by: {
                        type: string[];
                        format: string;
                        example: string;
                    };
                    updated_at: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
                additionalProperties: boolean;
            };
        };
        required: string[];
    };
    post: {
        summary: string;
        description: string;
        tags: string[];
        requestBody: {
            description: string;
            required: boolean;
            content: {
                "application/json": {
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            title: {
                                type: string;
                                description: string;
                                example: string;
                            };
                            startDate: {
                                type: string;
                                format: string;
                                description: string;
                                example: string;
                            };
                            endDate: {
                                type: string;
                                format: string;
                                description: string;
                                example: string;
                            };
                            parties: {
                                type: string;
                                description: string;
                                items: {
                                    type: string;
                                    required: string[];
                                    properties: {
                                        name: {
                                            type: string;
                                            description: string;
                                            example: string;
                                        };
                                        role: {
                                            type: string;
                                            description: string;
                                            example: string;
                                        };
                                    };
                                };
                            };
                            terms: {
                                type: string;
                                description: string;
                                example: string;
                            };
                            metadata: {
                                type: string;
                                description: string;
                                properties: {
                                    createdBy: {
                                        type: string;
                                        description: string;
                                        example: string;
                                    };
                                    priority: {
                                        type: string;
                                        description: string;
                                        enum: string[];
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                    examples: {
                        contract: {
                            summary: string;
                            value: {
                                title: string;
                                startDate: string;
                                endDate: string;
                                parties: {
                                    name: string;
                                    role: string;
                                }[];
                                terms: string;
                                metadata: {
                                    createdBy: string;
                                    priority: string;
                                };
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
                            properties: {
                                id: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                message: {
                                    type: string;
                                    example: string;
                                };
                            };
                        };
                        examples: {
                            success: {
                                summary: string;
                                value: {
                                    id: string;
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
                        schema: {
                            type: string;
                            properties: {
                                error: {
                                    type: string;
                                    example: string;
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
                            type: string;
                            properties: {
                                error: {
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
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    paths: {
        "/contracts": {
            get: {
                summary: string;
                description: string;
                responses: {
                    "200": {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    type: string;
                                    items: {
                                        $ref: string;
                                    };
                                };
                            };
                        };
                    };
                    "400": {
                        description: string;
                    };
                    "500": {
                        description: string;
                    };
                };
            };
        };
    };
    components: {
        schemas: {
            Contract: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        description: string;
                    };
                    title: {
                        type: string;
                        description: string;
                    };
                    startDate: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    endDate: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    status: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    parties: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                };
                required: string[];
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map