declare const _default: {
    "/dresses/{id}/images": {
        post: {
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
                    example: string;
                };
            }[];
            requestBody: {
                required: boolean;
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: string;
                            properties: {
                                files: {
                                    type: string;
                                    items: {
                                        type: string;
                                        format: string;
                                    };
                                    description: string;
                                };
                            };
                            required: string[];
                        };
                        examples: {
                            exampleUpload: {
                                summary: string;
                                value: {
                                    files: string[];
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
                                        description: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                            };
                                            name: {
                                                type: string;
                                                example: string;
                                            };
                                            reference: {
                                                type: string;
                                                example: string;
                                            };
                                            images: {
                                                type: string;
                                                items: {
                                                    type: string;
                                                    format: string;
                                                };
                                                example: string[];
                                            };
                                            updated_by: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            updated_at: {
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
                                        success: boolean;
                                        data: {
                                            id: string;
                                            name: string;
                                            reference: string;
                                            images: string[];
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
                            examples: {
                                missingId: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        error: string;
                                    };
                                };
                                noFiles: {
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
    "/dresses/{id}/images/{key}": {
        delete: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    format: string;
                    example: string;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: string;
                    format?: never;
                };
            })[];
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
                                    removedKeys: {
                                        type: string;
                                        items: {
                                            type: string;
                                        };
                                        example: string[];
                                    };
                                    notFoundKeys: {
                                        type: string;
                                        items: {
                                            type: string;
                                        };
                                        example: never[];
                                    };
                                    data: {
                                        type: string;
                                        description: string;
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
                            examples: {
                                dressNotFound: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        error: string;
                                    };
                                };
                                imageNotFound: {
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
                "500": {
                    description: string;
                    content: {
                        "application/json": {
                            examples: {
                                internalError: {
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
    "/dresses/details-view": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    default: number;
                    example: number;
                    format?: never;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: string;
                    default?: never;
                    format?: never;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: number;
                    default?: never;
                    format?: never;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    format: string;
                    example: string;
                    default?: never;
                };
            })[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
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
                                    data: {
                                        type: string;
                                        items: {
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
                                                reference: {
                                                    type: string;
                                                    example: string;
                                                };
                                                price_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                price_per_day_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                type_name: {
                                                    type: string;
                                                    example: string;
                                                };
                                                size_label: {
                                                    type: string;
                                                    example: string;
                                                };
                                                color_name: {
                                                    type: string;
                                                    example: string;
                                                };
                                                condition_label: {
                                                    type: string;
                                                    example: string;
                                                };
                                                created_at: {
                                                    type: string;
                                                    format: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            examples: {
                                default: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        total: number;
                                        page: number;
                                        limit: number;
                                        data: {
                                            id: string;
                                            name: string;
                                            reference: string;
                                            price_ttc: number;
                                            price_per_day_ttc: number;
                                            type_name: string;
                                            size_label: string;
                                            color_name: string;
                                            condition_label: string;
                                            created_at: string;
                                        }[];
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
                            examples: {
                                error: {
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
            description: string;
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
                        example: {
                            success: boolean;
                            data: {
                                id: string;
                                name: string;
                                deleted_at: string;
                                deleted_by: string;
                            };
                        };
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
                                        name: {
                                            type: string;
                                            example: string;
                                        };
                                        deleted_at: {
                                            type: string;
                                            format: string;
                                            example: string;
                                        };
                                        deleted_by: {
                                            type: string;
                                            format: string;
                                            example: string;
                                        };
                                    };
                                    required: string[];
                                };
                            };
                            required: string[];
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
                            message: string;
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
                            message: string;
                        };
                    };
                };
            };
        };
    };
    "/dresses/{id}/hard": {
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
                "404": {
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
                            examples: {
                                internalError: {
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
    "/dresses/{id}": {
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
                description: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                };
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
                            reference: string;
                            price_ht: number;
                            price_ttc: number;
                            price_per_day_ht: number;
                            price_per_day_ttc: number;
                            type_id: string;
                            size_id: string;
                            condition_id: string;
                            color_id: string;
                            images: string[];
                        };
                    };
                    "multipart/form-data": {
                        schema: {
                            type: string;
                            properties: {
                                data: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                files: {
                                    type: string;
                                    items: {
                                        type: string;
                                        format: string;
                                    };
                                    description: string;
                                };
                            };
                            required: string[];
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
                        };
                    };
                };
                "400": {
                    description: string;
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
    "/dresses": {
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
                    "multipart/form-data": {
                        schema: {
                            type: string;
                            properties: {
                                name: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                reference: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                price_ht: {
                                    type: string;
                                    format: string;
                                    example: number;
                                };
                                price_ttc: {
                                    type: string;
                                    format: string;
                                    example: number;
                                };
                                price_per_day_ht: {
                                    type: string;
                                    format: string;
                                    example: number;
                                };
                                price_per_day_ttc: {
                                    type: string;
                                    format: string;
                                    example: number;
                                };
                                type_id: {
                                    type: string;
                                    format: string;
                                    example: string;
                                };
                                size_id: {
                                    type: string;
                                    format: string;
                                    example: string;
                                };
                                condition_id: {
                                    type: string;
                                    format: string;
                                    example: string;
                                };
                                color_id: {
                                    type: string;
                                    format: string;
                                    example: string;
                                };
                                images: {
                                    type: string;
                                    description: string;
                                    items: {
                                        type: string;
                                        format: string;
                                    };
                                    maxItems: number;
                                };
                            };
                            required: string[];
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
                                            reference: string;
                                            price_ht: number;
                                            price_ttc: number;
                                            price_per_day_ht: number;
                                            price_per_day_ttc: number;
                                            type_id: string;
                                            size_id: string;
                                            condition_id: string;
                                            color_id: string;
                                            images: string[];
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
    "/dresses/availability": {
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
                description: string;
                schema: {
                    type: string;
                    format: string;
                    example: string;
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
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        count: number;
                                        filters: {
                                            start: string;
                                            end: string;
                                        };
                                        data: ({
                                            id: string;
                                            name: string;
                                            reference: string;
                                            price_ht: number;
                                            price_ttc: number;
                                            price_per_day_ht: number;
                                            price_per_day_ttc: number;
                                            images: string[];
                                            isAvailable: boolean;
                                            current_contract: {
                                                start_datetime: string;
                                                end_datetime: string;
                                            };
                                        } | {
                                            id: string;
                                            name: string;
                                            reference: string;
                                            price_ht: number;
                                            price_ttc: number;
                                            price_per_day_ht: number;
                                            price_per_day_ttc: number;
                                            images: string[];
                                            isAvailable: boolean;
                                            current_contract: null;
                                        })[];
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
                                invalidDates: {
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