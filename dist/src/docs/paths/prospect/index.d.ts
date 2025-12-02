export declare const prospectPaths: {
    "/prospects/{id}/convert": {
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
                                message: string;
                                data: {
                                    prospect: {
                                        id: string;
                                        firstname: string;
                                        lastname: string;
                                        email: string;
                                        status: string;
                                        converted_at: string;
                                        converted_to: string;
                                    };
                                    customer: {
                                        id: string;
                                        firstname: string;
                                        lastname: string;
                                        email: string;
                                        created_at: string;
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
                            example: {
                                success: boolean;
                                error: string;
                                customer_id: string;
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
                        };
                    };
                };
            };
        };
    };
    "/prospects/{id}": {
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
                            $ref: string;
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
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
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
                        };
                    };
                };
            };
        };
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
                        };
                    };
                };
            };
        };
    };
    "/prospects": {
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
                            withoutDresses: {
                                summary: string;
                                value: {
                                    firstname: string;
                                    lastname: string;
                                    email: string;
                                    phone: string;
                                    country: string;
                                    city: string;
                                    address: string;
                                    postal_code: string;
                                    status: string;
                                    source: string;
                                    notes: string;
                                };
                            };
                            withDresses: {
                                summary: string;
                                value: {
                                    firstname: string;
                                    lastname: string;
                                    email: string;
                                    phone: string;
                                    country: string;
                                    city: string;
                                    address: string;
                                    postal_code: string;
                                    status: string;
                                    source: string;
                                    notes: string;
                                    dress_reservations: ({
                                        dress_id: string;
                                        rental_start_date: string;
                                        rental_end_date: string;
                                        notes: string;
                                    } | {
                                        dress_id: string;
                                        rental_start_date: string;
                                        rental_end_date: string;
                                        notes?: never;
                                    })[];
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
                            example: {
                                success: boolean;
                                data: {
                                    id: string;
                                    firstname: string;
                                    lastname: string;
                                    email: string;
                                    phone: string;
                                    country: string;
                                    city: string;
                                    status: string;
                                    source: string;
                                    notes: string;
                                    created_at: string;
                                    dress_reservations: ({
                                        id: string;
                                        dress_id: string;
                                        rental_start_date: string;
                                        rental_end_date: string;
                                        notes: string;
                                        rental_days: number;
                                        estimated_cost: number;
                                        dress: {
                                            id: string;
                                            name: string;
                                            reference: string;
                                            price_per_day_ttc: number;
                                            type: {
                                                name: string;
                                            };
                                            size: {
                                                name: string;
                                            };
                                            color: {
                                                name: string;
                                            };
                                        };
                                    } | {
                                        id: string;
                                        dress_id: string;
                                        rental_start_date: string;
                                        rental_end_date: string;
                                        rental_days: number;
                                        estimated_cost: number;
                                        dress: {
                                            id: string;
                                            name: string;
                                            reference: string;
                                            price_per_day_ttc: number;
                                            type: {
                                                name: string;
                                            };
                                            size: {
                                                name: string;
                                            };
                                            color: {
                                                name: string;
                                            };
                                        };
                                        notes?: never;
                                    })[];
                                    total_estimated_cost: number;
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
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default?: never;
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                };
                description: string;
            })[];
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
                                page: number;
                                limit: number;
                                total: number;
                                data: {
                                    id: string;
                                    firstname: string;
                                    lastname: string;
                                    email: string;
                                    phone: string;
                                    status: string;
                                    source: string;
                                    created_at: string;
                                    dress_reservations: {
                                        id: string;
                                        dress_id: string;
                                        rental_start_date: string;
                                        rental_end_date: string;
                                        rental_days: number;
                                        estimated_cost: number;
                                        dress: {
                                            id: string;
                                            name: string;
                                            reference: string;
                                            price_per_day_ttc: number;
                                            type: {
                                                name: string;
                                            };
                                            size: {
                                                name: string;
                                            };
                                            color: {
                                                name: string;
                                            };
                                        };
                                    }[];
                                    total_estimated_cost: number;
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
                        };
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=index.d.ts.map