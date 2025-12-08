declare const _default: {
    "/pricing-rules": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            responses: {
                200: {
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
                                };
                            };
                        };
                    };
                };
                401: {
                    description: string;
                };
            };
        };
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
                            $ref: string;
                        };
                    };
                };
            };
            responses: {
                201: {
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
                400: {
                    description: string;
                };
                401: {
                    description: string;
                };
            };
        };
    };
    "/pricing-rules/{id}": {
        get: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                in: string;
                name: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                };
                description: string;
            }[];
            responses: {
                200: {
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
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
            };
        };
        put: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                in: string;
                name: string;
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
                200: {
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
                400: {
                    description: string;
                };
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
            };
        };
        delete: {
            tags: string[];
            summary: string;
            description: string;
            security: {
                bearerAuth: never[];
            }[];
            parameters: {
                in: string;
                name: string;
                required: boolean;
                schema: {
                    type: string;
                    format: string;
                };
                description: string;
            }[];
            responses: {
                200: {
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
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
            };
        };
    };
    "/pricing-rules/calculate": {
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
                            $ref: string;
                        };
                    };
                };
            };
            responses: {
                200: {
                    description: string;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                400: {
                    description: string;
                };
                401: {
                    description: string;
                };
                404: {
                    description: string;
                };
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map