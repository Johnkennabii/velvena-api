declare const _default: {
    "/emails/{emailId}/attachments/{index}": {
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
                    example: number;
                    minimum?: never;
                    enum?: never;
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    minimum: number;
                    example: number;
                    enum?: never;
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum: string[];
                    example: string;
                    minimum?: never;
                };
                description: string;
            })[];
            responses: {
                "200": {
                    description: string;
                    content: {
                        "application/octet-stream": {
                            schema: {
                                type: string;
                                format: string;
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
    "/mails/{mailbox}/{uid}/move": {
        patch: {
            summary: string;
            description: string;
            tags: string[];
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
                    enum: string[];
                    example: string;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: number;
                    enum?: never;
                };
            })[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            required: string[];
                            properties: {
                                toMailbox: {
                                    type: string;
                                    description: string;
                                    enum: string[];
                                    example: string;
                                };
                            };
                        };
                        examples: {
                            moveToSpam: {
                                summary: string;
                                value: {
                                    toMailbox: string;
                                };
                            };
                            moveToInbox: {
                                summary: string;
                                value: {
                                    toMailbox: string;
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
                                    message: {
                                        type: string;
                                        example: string;
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
                "401": {
                    description: string;
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
                                    details: {
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
    "/mails/{mailbox}/{uid}/flag/remove": {
        patch: {
            summary: string;
            description: string;
            tags: string[];
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
                    enum: string[];
                    example: string;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: number;
                    enum?: never;
                };
            })[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            required: string[];
                            properties: {
                                flag: {
                                    type: string;
                                    description: string;
                                    enum: string[];
                                    example: string;
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
                                    message: {
                                        type: string;
                                        example: string;
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
                "401": {
                    description: string;
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
                                    details: {
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
    "/mails/{mailbox}/{uid}/flag/add": {
        patch: {
            summary: string;
            description: string;
            tags: string[];
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
                    enum: string[];
                    example: string;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                description: string;
                schema: {
                    type: string;
                    example: number;
                    enum?: never;
                };
            })[];
            requestBody: {
                required: boolean;
                content: {
                    "application/json": {
                        schema: {
                            type: string;
                            required: string[];
                            properties: {
                                flag: {
                                    type: string;
                                    description: string;
                                    enum: string[];
                                    example: string;
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
                                    message: {
                                        type: string;
                                        example: string;
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
                "401": {
                    description: string;
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
                                    details: {
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
    "/mails/folders/move": {
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
                            type: string;
                            required: string[];
                            properties: {
                                from: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                to: {
                                    type: string;
                                    description: string;
                                    example: string;
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
                                    message: {
                                        type: string;
                                        example: string;
                                    };
                                    from: {
                                        type: string;
                                        example: string;
                                    };
                                    to: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                "400": {
                    description: string;
                };
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/folders": {
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
                            type: string;
                            required: string[];
                            properties: {
                                name: {
                                    type: string;
                                    description: string;
                                    example: string;
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
                                    message: {
                                        type: string;
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
                "400": {
                    description: string;
                };
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/send": {
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
                            type: string;
                            required: string[];
                            properties: {
                                to: {
                                    oneOf: ({
                                        type: string;
                                        format: string;
                                        items?: never;
                                    } | {
                                        type: string;
                                        items: {
                                            type: string;
                                            format: string;
                                        };
                                        format?: never;
                                    })[];
                                    description: string;
                                    example: string;
                                };
                                cc: {
                                    oneOf: ({
                                        type: string;
                                        format: string;
                                        items?: never;
                                    } | {
                                        type: string;
                                        items: {
                                            type: string;
                                            format: string;
                                        };
                                        format?: never;
                                    })[];
                                    description: string;
                                    example: string[];
                                };
                                bcc: {
                                    oneOf: ({
                                        type: string;
                                        format: string;
                                        items?: never;
                                    } | {
                                        type: string;
                                        items: {
                                            type: string;
                                            format: string;
                                        };
                                        format?: never;
                                    })[];
                                    description: string;
                                    example: string[];
                                };
                                attachments: {
                                    type: string;
                                    description: string;
                                    items: {
                                        type: string;
                                        required: string[];
                                        properties: {
                                            filename: {
                                                type: string;
                                                example: string;
                                            };
                                            content: {
                                                type: string;
                                                description: string;
                                                example: string;
                                            };
                                            contentType: {
                                                type: string;
                                                description: string;
                                                example: string;
                                            };
                                            encoding: {
                                                type: string;
                                                description: string;
                                                example: string;
                                            };
                                        };
                                    };
                                };
                                subject: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                html: {
                                    type: string;
                                    description: string;
                                    example: string;
                                };
                                text: {
                                    type: string;
                                    description: string;
                                    example: string;
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
                                    message: {
                                        type: string;
                                        example: string;
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
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/{mailbox}/{uid}/unread": {
        patch: {
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
                    enum: string[];
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum?: never;
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
                "400": {
                    description: string;
                };
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/{mailbox}/{uid}/read": {
        patch: {
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
                    enum: string[];
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum?: never;
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
                "400": {
                    description: string;
                };
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/{mailbox}/{uid}/permanent": {
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
                schema: {
                    type: string;
                    enum: string[];
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum?: never;
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
                "400": {
                    description: string;
                };
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/{mailbox}/{uid}": {
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
                    enum: string[];
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum?: never;
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
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        $ref: string;
                                    };
                                };
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
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
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
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum: string[];
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum?: never;
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
                "400": {
                    description: string;
                };
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/{mailbox}": {
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
                    enum: string[];
                    default?: never;
                    minimum?: never;
                    maximum?: never;
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                    minimum: number;
                    maximum: number;
                    enum?: never;
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                    minimum: number;
                    enum?: never;
                    maximum?: never;
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
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        items: {
                                            $ref: string;
                                        };
                                    };
                                    pagination: {
                                        type: string;
                                        properties: {
                                            limit: {
                                                type: string;
                                                example: number;
                                            };
                                            offset: {
                                                type: string;
                                                example: number;
                                            };
                                            count: {
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
                "400": {
                    description: string;
                };
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
    "/mails/mailboxes": {
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
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        items: {
                                            type: string;
                                            properties: {
                                                name: {
                                                    type: string;
                                                    example: string;
                                                };
                                                displayName: {
                                                    type: string;
                                                    example: string;
                                                };
                                                total: {
                                                    type: string;
                                                    example: number;
                                                };
                                                new: {
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
                "401": {
                    description: string;
                };
                "500": {
                    description: string;
                };
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map