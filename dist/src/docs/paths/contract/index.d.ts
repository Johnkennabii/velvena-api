declare const _default: {
    "/contracts/download/{contractId}/{token}": {
        get: {
            summary: string;
            description: string;
            operationId: string;
            tags: string[];
            security: never[];
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
                "302": {
                    description: string;
                    headers: {
                        Location: {
                            description: string;
                            schema: {
                                type: string;
                                format: string;
                                example: string;
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
                "403": {
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
                                        enum: string[];
                                    };
                                };
                            };
                            examples: {
                                contractNotFound: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        error: string;
                                    };
                                };
                                noPdf: {
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
            };
        };
    };
    "/contracts/{id}/upload-signed-pdf": {
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
                                file: {
                                    type: string;
                                    format: string;
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
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    link: {
                                        type: string;
                                        format: string;
                                        description: string;
                                    };
                                };
                                required: string[];
                            };
                            example: {
                                success: boolean;
                                link: string;
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
    "/contracts/{id}/generate-pdf": {
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
                description: string;
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            description: string;
                        };
                        example: {};
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
                                    link: {
                                        type: string;
                                        format: string;
                                        description: string;
                                    };
                                };
                                required: string[];
                            };
                            example: {
                                link: string;
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
    "/contracts/{id}/restore": {
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
    "/contracts/full-view": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
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
                            examples: {
                                allContracts: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        data: {
                                            id: string;
                                            contract_number: string;
                                            start_datetime: string;
                                            end_datetime: string;
                                            status: string;
                                            deposit_payment_method: string;
                                            account_ht: number;
                                            account_ttc: number;
                                            account_paid_ht: number;
                                            account_paid_ttc: number;
                                            caution_ht: number;
                                            caution_ttc: number;
                                            total_price_ht: number;
                                            total_price_ttc: number;
                                            contract_type_name: string;
                                            package_name: null;
                                            customer_id: string;
                                            created_at: string;
                                            updated_at: string;
                                        }[];
                                    };
                                };
                                filteredByCustomer: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        data: {
                                            id: string;
                                            contract_number: string;
                                            start_datetime: string;
                                            end_datetime: string;
                                            status: string;
                                            deposit_payment_method: string;
                                            account_ht: number;
                                            account_ttc: number;
                                            account_paid_ht: number;
                                            account_paid_ttc: number;
                                            caution_ht: number;
                                            caution_ttc: number;
                                            total_price_ht: number;
                                            total_price_ttc: number;
                                            contract_type_name: string;
                                            package_name: string;
                                            customer_id: string;
                                            created_at: string;
                                            updated_at: string;
                                        }[];
                                    };
                                };
                            };
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        description: string;
                                        items: {
                                            type: string;
                                            properties: {
                                                id: {
                                                    type: string;
                                                    format: string;
                                                };
                                                contract_number: {
                                                    type: string;
                                                };
                                                start_datetime: {
                                                    type: string;
                                                    format: string;
                                                };
                                                end_datetime: {
                                                    type: string;
                                                    format: string;
                                                };
                                                status: {
                                                    type: string;
                                                    enum: string[];
                                                    example: string;
                                                };
                                                deposit_payment_method: {
                                                    type: string;
                                                    enum: string[];
                                                    example: string;
                                                };
                                                account_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                account_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                account_paid_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                account_paid_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                caution_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                caution_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                caution_paid_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                caution_paid_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                total_price_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                total_price_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                contract_type_name: {
                                                    type: string;
                                                    example: string;
                                                };
                                                package_name: {
                                                    type: string[];
                                                    example: string;
                                                };
                                                customer_id: {
                                                    type: string;
                                                    format: string;
                                                };
                                                created_at: {
                                                    type: string;
                                                    format: string;
                                                };
                                                updated_at: {
                                                    type: string[];
                                                    format: string;
                                                };
                                            };
                                        };
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
                                dbError: {
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
            security: {
                bearerAuth: never[];
            }[];
        };
    };
    "/sign-links/{token}/sign": {
        post: {
            summary: string;
            description: string;
            operationId: string;
            tags: string[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: string;
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
                                    data: {
                                        type: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            contract_number: {
                                                type: string;
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
                                            total_price_ht: {
                                                type: string;
                                                example: number;
                                            };
                                            total_price_ttc: {
                                                type: string;
                                                example: number;
                                            };
                                            deposit_payment_method: {
                                                type: string;
                                                example: string;
                                            };
                                            updated_at: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            customer: {
                                                type: string;
                                                properties: {
                                                    id: {
                                                        type: string;
                                                        format: string;
                                                        example: string;
                                                    };
                                                    firstname: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    lastname: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    email: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    phone: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    city: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                };
                                            };
                                            contract_type: {
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
                                    contract_number: string;
                                    status: string;
                                    start_datetime: string;
                                    end_datetime: string;
                                    total_price_ht: number;
                                    total_price_ttc: number;
                                    deposit_payment_method: string;
                                    updated_at: string;
                                    customer: {
                                        id: string;
                                        firstname: string;
                                        lastname: string;
                                        email: string;
                                        phone: string;
                                        city: string;
                                    };
                                    contract_type: {
                                        id: string;
                                        name: string;
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
                "410": {
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
            };
        };
    };
    "/sign-links/{token}": {
        get: {
            summary: string;
            description: string;
            operationId: string;
            tags: string[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: string;
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
                                    data: {
                                        type: string;
                                        properties: {
                                            id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            contract_id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            customer_id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            token: {
                                                type: string;
                                                example: string;
                                            };
                                            expires_at: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                            contract: {
                                                type: string;
                                                properties: {
                                                    id: {
                                                        type: string;
                                                        format: string;
                                                        example: string;
                                                    };
                                                    contract_number: {
                                                        type: string;
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
                                                    total_price_ht: {
                                                        type: string;
                                                        example: number;
                                                    };
                                                    total_price_ttc: {
                                                        type: string;
                                                        example: number;
                                                    };
                                                    deposit_payment_method: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    contract_type: {
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
                                                        };
                                                    };
                                                    package: {
                                                        type: string;
                                                        nullable: boolean;
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
                                                            price_ttc: {
                                                                type: string;
                                                                example: number;
                                                            };
                                                        };
                                                    };
                                                    customer: {
                                                        type: string;
                                                        properties: {
                                                            id: {
                                                                type: string;
                                                                format: string;
                                                                example: string;
                                                            };
                                                            firstname: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                            lastname: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                            email: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                            phone: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                            city: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                        };
                                                    };
                                                    dresses: {
                                                        type: string;
                                                        items: {
                                                            type: string;
                                                            properties: {
                                                                id: {
                                                                    type: string;
                                                                    format: string;
                                                                    example: string;
                                                                };
                                                                dress: {
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
                                                                        reference: {
                                                                            type: string;
                                                                            example: string;
                                                                        };
                                                                        price_ttc: {
                                                                            type: string;
                                                                            example: number;
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
                                };
                            };
                            example: {
                                success: boolean;
                                data: {
                                    id: string;
                                    contract_id: string;
                                    customer_id: string;
                                    token: string;
                                    expires_at: string;
                                    contract: {
                                        id: string;
                                        contract_number: string;
                                        status: string;
                                        start_datetime: string;
                                        end_datetime: string;
                                        total_price_ht: number;
                                        total_price_ttc: number;
                                        deposit_payment_method: string;
                                        contract_type: {
                                            id: string;
                                            name: string;
                                        };
                                        package: {
                                            id: string;
                                            name: string;
                                            price_ttc: number;
                                        };
                                        customer: {
                                            id: string;
                                            firstname: string;
                                            lastname: string;
                                            email: string;
                                            phone: string;
                                            city: string;
                                        };
                                        dresses: {
                                            id: string;
                                            dress: {
                                                id: string;
                                                name: string;
                                                reference: string;
                                                price_ttc: number;
                                            };
                                        }[];
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
                "410": {
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
            };
        };
    };
    "/contracts/{id}/generate-signature": {
        post: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
            parameters: {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                    example: string;
                };
                description: string;
            }[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/json": {
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        data: {
                                            id: string;
                                            contract_id: string;
                                            customer_id: string;
                                            token: string;
                                            expires_at: string;
                                        };
                                        link: string;
                                        emailSentTo: string;
                                    };
                                };
                            };
                            schema: {
                                type: string;
                                required: string[];
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
                                                description: string;
                                            };
                                            contract_id: {
                                                type: string;
                                                format: string;
                                                description: string;
                                            };
                                            customer_id: {
                                                type: string;
                                                format: string;
                                                description: string;
                                            };
                                            token: {
                                                type: string;
                                                description: string;
                                            };
                                            expires_at: {
                                                type: string;
                                                format: string;
                                                description: string;
                                            };
                                        };
                                    };
                                    link: {
                                        type: string;
                                        format: string;
                                        example: string;
                                        description: string;
                                    };
                                    emailSentTo: {
                                        type: string;
                                        format: string;
                                        example: string;
                                        description: string;
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
                                missingCustomer: {
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
            security: {
                bearerAuth: never[];
            }[];
        };
    };
    "/contracts": {
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
                            type: string;
                            required: string[];
                            properties: {
                                contract_number: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                customer_id: {
                                    type: string;
                                    format: string;
                                    description: string;
                                    example: string;
                                };
                                contract_type_id: {
                                    type: string;
                                    format: string;
                                    description: string;
                                    example: string;
                                };
                                package_id: {
                                    type: string[];
                                    format: string;
                                    description: string;
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
                                status: {
                                    type: string;
                                    description: string;
                                    enum: string[];
                                    example: string;
                                };
                                account_ht: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                account_ttc: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                account_paid_ht: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                account_paid_ttc: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                caution_ht: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                caution_ttc: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                caution_paid_ht: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                caution_paid_ttc: {
                                    type: string[];
                                    description: string;
                                    example: number;
                                };
                                total_price_ht: {
                                    type: string;
                                    description: string;
                                    example: number;
                                };
                                total_price_ttc: {
                                    type: string;
                                    description: string;
                                    example: number;
                                };
                                addons: {
                                    type: string;
                                    description: string;
                                    items: {
                                        type: string;
                                        required: string[];
                                        properties: {
                                            addon_id: {
                                                type: string;
                                                format: string;
                                                description: string;
                                                example: string;
                                            };
                                        };
                                    };
                                };
                                dresses: {
                                    type: string;
                                    description: string;
                                    items: {
                                        type: string;
                                        required: string[];
                                        properties: {
                                            dress_id: {
                                                type: string;
                                                format: string;
                                                description: string;
                                                example: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                        examples: {
                            completeContract: {
                                summary: string;
                                value: {
                                    contract_number: string;
                                    customer_id: string;
                                    contract_type_id: string;
                                    package_id: string;
                                    start_datetime: string;
                                    end_datetime: string;
                                    deposit_payment_method: string;
                                    status: string;
                                    account_ht: number;
                                    account_ttc: number;
                                    account_paid_ht: number;
                                    account_paid_ttc: number;
                                    caution_ht: number;
                                    caution_ttc: number;
                                    caution_paid_ht: number;
                                    caution_paid_ttc: number;
                                    total_price_ht: number;
                                    total_price_ttc: number;
                                    addons: {
                                        addon_id: string;
                                    }[];
                                    dresses: {
                                        dress_id: string;
                                    }[];
                                };
                            };
                            dailyRental: {
                                summary: string;
                                value: {
                                    contract_number: string;
                                    customer_id: string;
                                    contract_type_id: string;
                                    start_datetime: string;
                                    end_datetime: string;
                                    deposit_payment_method: string;
                                    status: string;
                                    account_ht: number;
                                    account_ttc: number;
                                    account_paid_ht: number;
                                    account_paid_ttc: number;
                                    caution_ht: number;
                                    caution_ttc: number;
                                    caution_paid_ht: number;
                                    caution_paid_ttc: number;
                                    total_price_ht: number;
                                    total_price_ttc: number;
                                    package_id: null;
                                    addons: {
                                        addon_id: string;
                                    }[];
                                    dresses: {
                                        dress_id: string;
                                    }[];
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
                                            contract_number: {
                                                type: string;
                                                example: string;
                                            };
                                            status: {
                                                type: string;
                                                example: string;
                                            };
                                            start_datetime: {
                                                type: string;
                                                format: string;
                                            };
                                            end_datetime: {
                                                type: string;
                                                format: string;
                                            };
                                            total_price_ht: {
                                                type: string;
                                                example: number;
                                            };
                                            total_price_ttc: {
                                                type: string;
                                                example: number;
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
                                            account_paid_ht: {
                                                type: string[];
                                                example: number;
                                            };
                                            account_paid_ttc: {
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
                                            caution_paid_ht: {
                                                type: string[];
                                                example: number;
                                            };
                                            caution_paid_ttc: {
                                                type: string[];
                                                example: number;
                                            };
                                            customer_id: {
                                                type: string;
                                                format: string;
                                            };
                                            contract_type_id: {
                                                type: string;
                                                format: string;
                                            };
                                            package_id: {
                                                type: string[];
                                                format: string;
                                            };
                                            created_at: {
                                                type: string;
                                                format: string;
                                            };
                                            created_by: {
                                                type: string[];
                                                format: string;
                                            };
                                            sign_link: {
                                                type: string;
                                                description: string;
                                                properties: {
                                                    id: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    token: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    customer_id: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    expires_at: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                };
                                            };
                                            addon_links: {
                                                type: string;
                                                items: {
                                                    type: string;
                                                    properties: {
                                                        addon_id: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        addon: {
                                                            type: string;
                                                            properties: {
                                                                name: {
                                                                    type: string;
                                                                    example: string;
                                                                };
                                                                price_ttc: {
                                                                    type: string;
                                                                    example: number;
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            dresses: {
                                                type: string;
                                                items: {
                                                    type: string;
                                                    properties: {
                                                        dress_id: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        dress: {
                                                            type: string;
                                                            properties: {
                                                                name: {
                                                                    type: string;
                                                                    example: string;
                                                                };
                                                                price_per_day_ttc: {
                                                                    type: string;
                                                                    example: number;
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
                            examples: {
                                success: {
                                    summary: string;
                                    value: {
                                        success: boolean;
                                        data: {
                                            id: string;
                                            contract_number: string;
                                            status: string;
                                            start_datetime: string;
                                            end_datetime: string;
                                            total_price_ht: number;
                                            total_price_ttc: number;
                                            deposit_payment_method: string;
                                            account_ht: number;
                                            account_ttc: number;
                                            account_paid_ht: number;
                                            account_paid_ttc: number;
                                            caution_ht: number;
                                            caution_ttc: number;
                                            caution_paid_ht: number;
                                            caution_paid_ttc: number;
                                            customer_id: string;
                                            contract_type_id: string;
                                            package_id: string;
                                            created_at: string;
                                            created_by: string;
                                            sign_link: {
                                                id: string;
                                                customer_id: string;
                                                token: string;
                                                expires_at: string;
                                            };
                                            addon_links: {
                                                addon_id: string;
                                                addon: {
                                                    name: string;
                                                    price_ttc: number;
                                                };
                                            }[];
                                            dresses: {
                                                dress_id: string;
                                                dress: {
                                                    name: string;
                                                    price_per_day_ttc: number;
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
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    example: string;
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    example: number;
                };
                description: string;
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
                                    data: {
                                        type: string;
                                        description: string;
                                        items: {
                                            type: string;
                                            properties: {
                                                id: {
                                                    type: string;
                                                    format: string;
                                                };
                                                contract_number: {
                                                    type: string;
                                                };
                                                status: {
                                                    type: string;
                                                    enum: string[];
                                                    example: string;
                                                };
                                                start_datetime: {
                                                    type: string;
                                                    format: string;
                                                };
                                                end_datetime: {
                                                    type: string;
                                                    format: string;
                                                };
                                                deposit_payment_method: {
                                                    type: string;
                                                    enum: string[];
                                                    example: string;
                                                };
                                                account_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                account_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                caution_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                caution_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                total_price_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                total_price_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                customer: {
                                                    type: string;
                                                    properties: {
                                                        id: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        firstname: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        lastname: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        email: {
                                                            type: string;
                                                            format: string;
                                                            example: string;
                                                        };
                                                        phone: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                    };
                                                };
                                                contract_type: {
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
                                                    };
                                                };
                                                package: {
                                                    type: string[];
                                                    properties: {
                                                        id: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        name: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        price_ht: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                        price_ttc: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                    };
                                                };
                                                addon_links: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        properties: {
                                                            addon: {
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
                                                                    price_ttc: {
                                                                        type: string;
                                                                        example: number;
                                                                    };
                                                                    included: {
                                                                        type: string;
                                                                        example: boolean;
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                dresses: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        properties: {
                                                            dress: {
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
                                                                    price_per_day_ttc: {
                                                                        type: string;
                                                                        example: number;
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                sign_link: {
                                                    type: string[];
                                                    description: string;
                                                    properties: {
                                                        token: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        expires_at: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                    };
                                                };
                                                created_at: {
                                                    type: string;
                                                    format: string;
                                                };
                                                updated_at: {
                                                    type: string[];
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
                                        data: {
                                            id: string;
                                            contract_number: string;
                                            status: string;
                                            start_datetime: string;
                                            end_datetime: string;
                                            deposit_payment_method: string;
                                            account_ht: number;
                                            account_ttc: number;
                                            caution_ht: number;
                                            caution_ttc: number;
                                            total_price_ht: number;
                                            total_price_ttc: number;
                                            customer: {
                                                firstname: string;
                                                lastname: string;
                                            };
                                            contract_type: {
                                                name: string;
                                            };
                                            package: null;
                                            addon_links: never[];
                                            dresses: never[];
                                            sign_link: {
                                                token: string;
                                            };
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
            };
            security: {
                bearerAuth: never[];
            }[];
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
                    example: string;
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
                        examples: {
                            updateContract: {
                                summary: string;
                                value: {
                                    status: string;
                                    startDatetime: string;
                                    endDatetime: string;
                                    depositPaymentMethod: string;
                                    total_price_ht: string;
                                    total_price_ttc: string;
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
                                            contractType: string;
                                            status: string;
                                            startDatetime: string;
                                            endDatetime: string;
                                            depositPaymentMethod: string;
                                            total_price_ht: string;
                                            total_price_ttc: string;
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
                "401": {
                    description: string;
                    content: {
                        "application/json": {
                            example: {
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
        get: {
            tags: string[];
            summary: string;
            description: string;
            operationId: string;
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
                                type: string;
                                required: string[];
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
                                            };
                                            contract_number: {
                                                type: string;
                                            };
                                            status: {
                                                type: string;
                                                enum: string[];
                                                example: string;
                                            };
                                            start_datetime: {
                                                type: string;
                                                format: string;
                                            };
                                            end_datetime: {
                                                type: string;
                                                format: string;
                                            };
                                            deposit_payment_method: {
                                                type: string;
                                                enum: string[];
                                                example: string;
                                            };
                                            account_ht: {
                                                type: string;
                                                example: number;
                                            };
                                            account_ttc: {
                                                type: string;
                                                example: number;
                                            };
                                            caution_ht: {
                                                type: string;
                                                example: number;
                                            };
                                            caution_ttc: {
                                                type: string;
                                                example: number;
                                            };
                                            total_price_ht: {
                                                type: string;
                                                example: number;
                                            };
                                            total_price_ttc: {
                                                type: string;
                                                example: number;
                                            };
                                            customer: {
                                                type: string;
                                                properties: {
                                                    id: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    firstname: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    lastname: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    email: {
                                                        type: string;
                                                        format: string;
                                                        example: string;
                                                    };
                                                    phone: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                };
                                            };
                                            contract_type: {
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
                                                };
                                            };
                                            package: {
                                                type: string[];
                                                properties: {
                                                    id: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    name: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    price_ht: {
                                                        type: string;
                                                        example: number;
                                                    };
                                                    price_ttc: {
                                                        type: string;
                                                        example: number;
                                                    };
                                                };
                                            };
                                            addon_links: {
                                                type: string;
                                                items: {
                                                    type: string;
                                                    properties: {
                                                        addon: {
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
                                                                price_ttc: {
                                                                    type: string;
                                                                    example: number;
                                                                };
                                                                included: {
                                                                    type: string;
                                                                    example: boolean;
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            dresses: {
                                                type: string;
                                                items: {
                                                    type: string;
                                                    properties: {
                                                        dress: {
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
                                                                price_per_day_ttc: {
                                                                    type: string;
                                                                    example: number;
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            sign_link: {
                                                type: string[];
                                                description: string;
                                                properties: {
                                                    token: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    expires_at: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                };
                                            };
                                            created_at: {
                                                type: string;
                                                format: string;
                                            };
                                            updated_at: {
                                                type: string[];
                                                format: string;
                                            };
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
            };
            security: {
                bearerAuth: never[];
            }[];
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map