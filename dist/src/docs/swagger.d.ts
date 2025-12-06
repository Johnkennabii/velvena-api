export declare const swaggerDocument: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    servers: {
        url: string;
        description: string;
    }[];
    tags: {
        name: string;
        description: string;
    }[];
    paths: {
        "/mails/{mailbox}/{uid}/forward": {
            post: {
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
                                    message: {
                                        type: string;
                                        description: string;
                                        example: string;
                                    };
                                    messageText: {
                                        type: string;
                                        description: string;
                                        example: string;
                                    };
                                    includeAttachments: {
                                        type: string;
                                        description: string;
                                        example: boolean;
                                        default: boolean;
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
        "/mails/{mailbox}/{uid}/reply-all": {
            post: {
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
                                    body: {
                                        type: string;
                                        description: string;
                                        example: string;
                                    };
                                    bodyText: {
                                        type: string;
                                        description: string;
                                        example: string;
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
        "/mails/{mailbox}/{uid}/reply": {
            post: {
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
                                    body: {
                                        type: string;
                                        description: string;
                                        example: string;
                                    };
                                    bodyText: {
                                        type: string;
                                        description: string;
                                        example: string;
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
                                                    selectable: {
                                                        type: string;
                                                        example: boolean;
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
        "/prospects/{prospectId}/requests": any;
        "/prospects/{prospectId}/requests/{requestId}": any;
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
        "/customer-notes/customer/{customerId}": {
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
                requestBody: {
                    required: boolean;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                content: string;
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
                                        customer_id: string;
                                        content: string;
                                        created_at: string;
                                        created_by: string;
                                        updated_at: null;
                                        updated_by: null;
                                        deleted_at: null;
                                        deleted_by: null;
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
                                        customer_id: string;
                                        content: string;
                                        created_at: string;
                                        created_by: string;
                                        updated_at: null;
                                        updated_by: null;
                                        deleted_at: null;
                                        deleted_by: null;
                                    }[];
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
                            };
                        };
                    };
                };
            };
        };
        "/customer-notes/{id}": {
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
                                example: {
                                    success: boolean;
                                    message: string;
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
                                example: {
                                    success: boolean;
                                    data: {
                                        id: string;
                                        customer_id: string;
                                        content: string;
                                        created_at: string;
                                        created_by: string;
                                        updated_at: null;
                                        updated_by: null;
                                        deleted_at: string;
                                        deleted_by: string;
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
                            example: {
                                content: string;
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
                                        customer_id: string;
                                        content: string;
                                        created_at: string;
                                        created_by: string;
                                        updated_at: string;
                                        updated_by: string;
                                        deleted_at: null;
                                        deleted_by: null;
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
                                        customer_id: string;
                                        content: string;
                                        created_at: string;
                                        created_by: string;
                                        updated_at: null;
                                        updated_by: null;
                                        deleted_at: null;
                                        deleted_by: null;
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
                            };
                        };
                    };
                };
            };
        };
        "/customers": {
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
                            example: {
                                firstname: string;
                                lastname: string;
                                email: string;
                                phone: string;
                                country: string;
                                city: string;
                                address: string;
                                postal_code: string;
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
                                        city: string;
                                        country: string;
                                        created_at: string;
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
        "/customers/{id}": {
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
                };
            };
        };
        "/profiles": {
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
                            example: {
                                firstname: string;
                                lastname: string;
                                email: string;
                                phone: string;
                                role_id: string;
                                userId: string;
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
                                        role_id: string;
                                        userId: string;
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
                                        firstname: string;
                                        lastname: string;
                                        email: string;
                                        phone: string;
                                        role_id: string;
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
        "/users/{id}": {
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
                                        message: string;
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
                                schema: {
                                    $ref: string;
                                };
                                example: {
                                    success: boolean;
                                    data: {
                                        id: string;
                                        deleted_at: string;
                                    };
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
                                type: string;
                                properties: {
                                    password: {
                                        type: string;
                                        description: string;
                                    };
                                    profile: {
                                        type: string;
                                        description: string;
                                        required: string[];
                                        properties: {
                                            firstname: {
                                                type: string;
                                                example: string;
                                            };
                                            lastname: {
                                                type: string;
                                                example: string;
                                            };
                                            address: {
                                                type: string;
                                                example: string;
                                            };
                                            city: {
                                                type: string;
                                                example: string;
                                            };
                                            country: {
                                                type: string;
                                                example: string;
                                            };
                                            postal_code: {
                                                type: string;
                                                example: string;
                                            };
                                            avatar_url: {
                                                type: string;
                                                example: string;
                                            };
                                            role_id: {
                                                type: string;
                                                format: string;
                                                example: string;
                                            };
                                        };
                                    };
                                };
                                example: {
                                    password: string;
                                    profile: {
                                        firstName: string;
                                        lastName: string;
                                        country: string;
                                        city: string;
                                        address: string;
                                        postal_code: string;
                                        role_id: string;
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
                                            properties: {
                                                id: {
                                                    type: string;
                                                    format: string;
                                                    example: string;
                                                };
                                                email: {
                                                    type: string;
                                                    example: string;
                                                };
                                                profile: {
                                                    type: string;
                                                    properties: {
                                                        firstname: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        lastname: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        country: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        city: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        address: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        postal_code: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        role: {
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
                                        email: string;
                                        profile: {
                                            firstName: string;
                                            lastName: string;
                                            country: string;
                                            city: string;
                                            address: string;
                                            postal_code: string;
                                            role: {
                                                name: string;
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
                                        email: string;
                                        profile: {
                                            firstname: string;
                                            lastname: string;
                                            role: {
                                                name: string;
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
        "/users": {
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
                                example: {
                                    success: boolean;
                                    count: number;
                                    data: {
                                        id: string;
                                        email: string;
                                        profile: {
                                            firstname: string;
                                            lastname: string;
                                            role: {
                                                name: string;
                                            };
                                        };
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
        "/dress-storage/{key}": {
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
        "/dress-storage": {
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
                                    images: {
                                        type: string;
                                        items: {
                                            type: string;
                                            format: string;
                                        };
                                        maxItems: number;
                                        description: string;
                                    };
                                };
                                required: string[];
                            };
                            examples: {
                                uploadExample: {
                                    summary: string;
                                    value: {
                                        images: string[];
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
                                            files: {
                                                id: string;
                                                name: string;
                                                url: string;
                                            }[];
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
                                            files: {
                                                id: string;
                                                name: string;
                                                url: string;
                                            }[];
                                        };
                                    };
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
                                    details: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        "/avatars": {
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
                                    file: {
                                        type: string;
                                        format: string;
                                        description: string;
                                    };
                                };
                                required: string[];
                            };
                            examples: {
                                exampleUpload: {
                                    summary: string;
                                    value: {
                                        file: string;
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
                                            file: {
                                                id: string;
                                                name: string;
                                                url: string;
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
                                            files: {
                                                id: string;
                                                name: string;
                                                url: string;
                                            }[];
                                        };
                                    };
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
        "/avatars/{id}": {
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
                                            message: string;
                                        };
                                    };
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
                                            file: {
                                                id: string;
                                                name: string;
                                                url: string;
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
        "/dress-types": {
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
                            example: {
                                name: string;
                                description: string;
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
                                        description: string;
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
                                example: {
                                    success: boolean;
                                    data: {
                                        id: string;
                                        name: string;
                                        description: string;
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
        "/dress-types/{id}": {
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
                                example: {
                                    success: boolean;
                                    message: string;
                                    data: null;
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
                                example: {
                                    success: boolean;
                                    data: {
                                        id: string;
                                        name: string;
                                        deleted_at: string;
                                    };
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
                            example: {
                                name: string;
                                description: string;
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
                                        description: string;
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
                };
            };
        };
        "/dress-sizes": {
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
                                            data: {
                                                id: string;
                                                name: string;
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
        "/dress-sizes/{id}": {
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
                                example: {
                                    success: boolean;
                                    message: string;
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
                                example: {
                                    success: boolean;
                                    data: {
                                        id: string;
                                        name: string;
                                        deleted_by: string;
                                        deleted_at: string;
                                    };
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
                                            data: {
                                                id: string;
                                                name: string;
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
                                examples: {
                                    success: {
                                        value: {
                                            success: boolean;
                                            data: {
                                                id: string;
                                                name: string;
                                                deleted_by: string;
                                                deleted_at: string;
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
                            examples: {
                                updateCondition: {
                                    value: {
                                        name: string;
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
                                        value: {
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
                                    missingId: {
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
        "/dress-colors": {
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
                                createColor: {
                                    summary: string;
                                    value: {
                                        name: string;
                                        hex_code: string;
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
                                                hex_code: string;
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
                                    missingFields: {
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
                                            data: {
                                                id: string;
                                                name: string;
                                                hex_value: string;
                                                created_at: string;
                                                updated_at: null;
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
        "/dress-colors/{id}": {
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
                        example: string;
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
                                schema: {
                                    $ref: string;
                                };
                                examples: {
                                    missingId: {
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
                        example: string;
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
                                        summary: string;
                                        value: {
                                            success: boolean;
                                            data: {
                                                id: string;
                                                name: string;
                                                hex_code: string;
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
                                schema: {
                                    $ref: string;
                                };
                                examples: {
                                    missingId: {
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
                    "401": {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                                examples: {
                                    unauthorized: {
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
                                updateColor: {
                                    summary: string;
                                    value: {
                                        name: string;
                                        hex_code: string;
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
                                                hex_code: string;
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
                                schema: {
                                    $ref: string;
                                };
                                examples: {
                                    missingId: {
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
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        example: string;
                    };
                    description: string;
                })[];
                responses: {
                    "200": {
                        description: string;
                        content: {
                            "application/json": {
                                examples: {
                                    successResponse: {
                                        summary: string;
                                        value: {
                                            success: boolean;
                                            data: {
                                                id: string;
                                                name: string;
                                                reference: string;
                                                description: string;
                                                price_ht: number;
                                                price_ttc: number;
                                                images: string[];
                                                created_at: string;
                                                updated_at: string;
                                                type: {
                                                    id: string;
                                                    name: string;
                                                };
                                                size: {
                                                    id: string;
                                                    label: string;
                                                };
                                                condition: {
                                                    id: string;
                                                    label: string;
                                                };
                                                color: {
                                                    id: string;
                                                    label: string;
                                                };
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
                                            description: string;
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
                                                    name: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    reference: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    description: {
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
                                                    images: {
                                                        type: string;
                                                        items: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        example: string[];
                                                    };
                                                    created_at: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    updated_at: {
                                                        type: string[];
                                                        format: string;
                                                    };
                                                    type: {
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
                                                    size: {
                                                        type: string;
                                                        properties: {
                                                            id: {
                                                                type: string;
                                                                format: string;
                                                            };
                                                            label: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                        };
                                                    };
                                                    condition: {
                                                        type: string;
                                                        properties: {
                                                            id: {
                                                                type: string;
                                                                format: string;
                                                            };
                                                            label: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                        };
                                                    };
                                                    color: {
                                                        type: string;
                                                        properties: {
                                                            id: {
                                                                type: string;
                                                                format: string;
                                                            };
                                                            label: {
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
                        };
                    };
                    "500": {
                        description: string;
                        content: {
                            "application/json": {
                                examples: {
                                    errorExample: {
                                        summary: string;
                                        value: {
                                            success: boolean;
                                            error: string;
                                        };
                                    };
                                };
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
                                examples: {
                                    successExample: {
                                        summary: string;
                                        value: {
                                            success: boolean;
                                            data: {
                                                id: string;
                                                name: string;
                                                reference: string;
                                                description: string;
                                                price_ht: number;
                                                price_ttc: number;
                                                price_per_day_ht: number;
                                                price_per_day_ttc: number;
                                                images: string[];
                                                created_at: string;
                                                updated_at: string;
                                                type: {
                                                    id: string;
                                                    name: string;
                                                };
                                                size: {
                                                    id: string;
                                                    label: string;
                                                };
                                                condition: {
                                                    id: string;
                                                    label: string;
                                                };
                                                color: {
                                                    id: string;
                                                    label: string;
                                                };
                                            };
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
                                            description: string;
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
                                                name: {
                                                    type: string;
                                                    example: string;
                                                };
                                                reference: {
                                                    type: string;
                                                    example: string;
                                                };
                                                description: {
                                                    type: string[];
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
                                                price_per_day_ht: {
                                                    type: string;
                                                    example: number;
                                                };
                                                price_per_day_ttc: {
                                                    type: string;
                                                    example: number;
                                                };
                                                images: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    example: string[];
                                                };
                                                created_at: {
                                                    type: string;
                                                    format: string;
                                                    example: string;
                                                };
                                                updated_at: {
                                                    type: string[];
                                                    format: string;
                                                    example: string;
                                                };
                                                type: {
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
                                                    };
                                                };
                                                size: {
                                                    type: string;
                                                    description: string;
                                                    properties: {
                                                        id: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        label: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                    };
                                                };
                                                condition: {
                                                    type: string;
                                                    description: string;
                                                    properties: {
                                                        id: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        label: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                    };
                                                };
                                                color: {
                                                    type: string;
                                                    description: string;
                                                    properties: {
                                                        id: {
                                                            type: string;
                                                            format: string;
                                                        };
                                                        label: {
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
                                };
                            };
                        };
                    };
                    "404": {
                        description: string;
                        content: {
                            "application/json": {
                                examples: {
                                    notFound: {
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
        "/dresses/{id}/images": {
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
                        example: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        "application/json": {
                            schema: {
                                type: string;
                                properties: {
                                    keys: {
                                        type: string;
                                        description: string;
                                        items: {
                                            type: string;
                                        };
                                        minItems: number;
                                    };
                                    key: {
                                        type: string;
                                        description: string;
                                    };
                                };
                                oneOf: {
                                    required: string[];
                                    description: string;
                                }[];
                            };
                            examples: {
                                multipleImages: {
                                    summary: string;
                                    value: {
                                        keys: string[];
                                    };
                                };
                                singleImage: {
                                    summary: string;
                                    value: {
                                        key: string;
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
                                        removedKeys: {
                                            type: string;
                                            description: string;
                                            items: {
                                                type: string;
                                            };
                                        };
                                        notFoundKeys: {
                                            type: string;
                                            description: string;
                                            items: {
                                                type: string;
                                            };
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
                                            removedKeys: string[];
                                            notFoundKeys: string[];
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
                                    missingParams: {
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
                                examples: {
                                    dressNotFound: {
                                        summary: string;
                                        value: {
                                            success: boolean;
                                            error: string;
                                        };
                                    };
                                    keysNotFound: {
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
        "/dresses/{id}/publish": {
            post: {
                tags: string[];
                summary: string;
                description: string;
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
                                                };
                                                name: {
                                                    type: string;
                                                };
                                                reference: {
                                                    type: string;
                                                };
                                                published_post: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                published_at: {
                                                    type: string;
                                                    format: string;
                                                };
                                                published_by: {
                                                    type: string;
                                                    format: string;
                                                };
                                                updated_at: {
                                                    type: string;
                                                    format: string;
                                                };
                                                updated_by: {
                                                    type: string;
                                                    format: string;
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
                    "404": {
                        description: string;
                    };
                    "500": {
                        description: string;
                    };
                };
                security: {
                    bearerAuth: never[];
                }[];
            };
        };
        "/dresses/{id}/unpublish": {
            post: {
                tags: string[];
                summary: string;
                description: string;
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
                                                };
                                                name: {
                                                    type: string;
                                                };
                                                reference: {
                                                    type: string;
                                                };
                                                published_post: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                                published_at: {
                                                    type: string;
                                                    format: string;
                                                    nullable: boolean;
                                                    example: null;
                                                };
                                                published_by: {
                                                    type: string;
                                                    format: string;
                                                    nullable: boolean;
                                                    example: null;
                                                };
                                                updated_at: {
                                                    type: string;
                                                    format: string;
                                                };
                                                updated_by: {
                                                    type: string;
                                                    format: string;
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
                    "404": {
                        description: string;
                    };
                    "500": {
                        description: string;
                    };
                };
                security: {
                    bearerAuth: never[];
                }[];
            };
        };
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
                                                price_ht: number;
                                                price_ttc: number;
                                                created_at: string;
                                                updated_at: null;
                                            } | {
                                                id: string;
                                                name: string;
                                                description: string;
                                                price_ht: number;
                                                price_ttc: number;
                                                created_at: string;
                                                updated_at: string;
                                            })[];
                                        };
                                    };
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
            get: {
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
                                                description: string;
                                                price_ht: number;
                                                price_ttc: number;
                                                created_at: string;
                                                updated_at: null;
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
                                            data: {
                                                id: string;
                                                name: string;
                                                description: string;
                                                price_ht: number;
                                                price_ttc: number;
                                                created_at: string;
                                                addons: {
                                                    id: string;
                                                    name: string;
                                                    price_ht: number;
                                                    price_ttc: number;
                                                }[];
                                            }[];
                                        };
                                    };
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
                                            data: {
                                                id: string;
                                                name: string;
                                                description: string;
                                                price_ht: number;
                                                price_ttc: number;
                                                created_at: string;
                                                addons: {
                                                    id: string;
                                                    name: string;
                                                    price_ht: number;
                                                    price_ttc: number;
                                                }[];
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
                                                updated_at: null;
                                            } | {
                                                id: string;
                                                name: string;
                                                description: string;
                                                created_at: string;
                                                updated_at: string;
                                            })[];
                                        };
                                    };
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
                        example: string;
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
                                        updated_at: string;
                                        deleted_at: null;
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
                security: {
                    bearerAuth: never[];
                }[];
            };
        };
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
        "/auth/refresh": {
            post: {
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
                                            token: string;
                                            id: string;
                                            email: string;
                                            role: string;
                                            profile: {
                                                id: string;
                                                firstName: string;
                                                lastName: string;
                                                role: {
                                                    id: string;
                                                    name: string;
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
                        content: {
                            "application/json": {
                                examples: {
                                    missingToken: {
                                        summary: string;
                                        value: {
                                            error: string;
                                        };
                                    };
                                    invalidToken: {
                                        summary: string;
                                        value: {
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
                                    error: string;
                                };
                            };
                        };
                    };
                    "400": {
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
                                    error: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        "/auth/me": {
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
                                    required: string[];
                                    properties: {
                                        token: {
                                            type: string;
                                            description: string;
                                            example: string;
                                        };
                                        id: {
                                            type: string;
                                            format: string;
                                            description: string;
                                            example: string;
                                        };
                                        email: {
                                            type: string;
                                            format: string;
                                            example: string;
                                            description: string;
                                        };
                                        role: {
                                            type: string[];
                                            example: string;
                                            description: string;
                                        };
                                        profile: {
                                            type: string;
                                            description: string;
                                            properties: {
                                                id: {
                                                    type: string;
                                                    format: string;
                                                    example: string;
                                                };
                                                firstName: {
                                                    type: string[];
                                                    example: string;
                                                };
                                                lastName: {
                                                    type: string[];
                                                    example: string;
                                                };
                                                role: {
                                                    type: string;
                                                    description: string;
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
                                examples: {
                                    success: {
                                        summary: string;
                                        value: {
                                            token: string;
                                            id: string;
                                            email: string;
                                            role: string;
                                            profile: {
                                                id: string;
                                                firstName: string;
                                                lastName: string;
                                                role: {
                                                    id: string;
                                                    name: string;
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
                        content: {
                            "application/json": {
                                examples: {
                                    missingToken: {
                                        summary: string;
                                        value: {
                                            error: string;
                                        };
                                    };
                                    invalidToken: {
                                        summary: string;
                                        value: {
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
                                    error: string;
                                };
                            };
                        };
                    };
                    "400": {
                        description: string;
                        content: {
                            "application/json": {
                                example: {
                                    error: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        "/auth/login": {
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
                                type: string;
                                required: string[];
                                properties: {
                                    email: {
                                        type: string;
                                        format: string;
                                        example: string;
                                        description: string;
                                    };
                                    password: {
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
                responses: {
                    "200": {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    type: string;
                                    properties: {
                                        token: {
                                            type: string;
                                            example: string;
                                        };
                                        id: {
                                            type: string;
                                            example: string;
                                        };
                                        email: {
                                            type: string;
                                            example: string;
                                        };
                                        role: {
                                            type: string[];
                                            example: string;
                                        };
                                    };
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
                                    error: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        "/auth/register": {
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
                                    email: {
                                        type: string;
                                        format: string;
                                        example: string;
                                        description: string;
                                    };
                                    password: {
                                        type: string;
                                        format: string;
                                        example: string;
                                        description: string;
                                    };
                                    roleName: {
                                        type: string;
                                        example: string;
                                        description: string;
                                    };
                                    firstName: {
                                        type: string;
                                        example: string;
                                        description: string;
                                    };
                                    lastName: {
                                        type: string;
                                        example: string;
                                        description: string;
                                    };
                                };
                            };
                            examples: {
                                basicExample: {
                                    summary: string;
                                    value: {
                                        email: string;
                                        password: string;
                                        roleName: string;
                                        firstName: string;
                                        lastName: string;
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
                                    required: string[];
                                    properties: {
                                        id: {
                                            type: string;
                                            format: string;
                                            example: string;
                                        };
                                        email: {
                                            type: string;
                                            format: string;
                                            example: string;
                                        };
                                        role: {
                                            type: string;
                                            example: string;
                                        };
                                        profile: {
                                            type: string;
                                            description: string;
                                            properties: {
                                                id: {
                                                    type: string;
                                                    format: string;
                                                    example: string;
                                                };
                                                role_id: {
                                                    type: string;
                                                    format: string;
                                                    example: string;
                                                };
                                                firstName: {
                                                    type: string[];
                                                    example: string;
                                                };
                                                lastName: {
                                                    type: string[];
                                                    example: string;
                                                };
                                                created_at: {
                                                    type: string;
                                                    format: string;
                                                    example: string;
                                                };
                                                created_by: {
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
                                            id: string;
                                            email: string;
                                            role: string;
                                            profile: {
                                                id: string;
                                                role_id: string;
                                                firstName: string;
                                                lastName: string;
                                                created_at: string;
                                                created_by: string;
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
                                    missingFields: {
                                        summary: string;
                                        value: {
                                            error: string;
                                        };
                                    };
                                    duplicateUser: {
                                        summary: string;
                                        value: {
                                            error: string;
                                        };
                                    };
                                    roleNotFound: {
                                        summary: string;
                                        value: {
                                            error: string;
                                        };
                                    };
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
                                    error: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    components: {
        schemas: any;
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
        };
    };
    security: {
        bearerAuth: never[];
    }[];
};
//# sourceMappingURL=swagger.d.ts.map