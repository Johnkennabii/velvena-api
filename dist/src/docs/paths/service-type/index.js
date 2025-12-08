export default {
    "/service-types": {
        get: {
            tags: ["Service Types"],
            summary: "List all service types",
            description: "Returns all service types (global + organization-specific)",
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Service types retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/ServiceType" },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
            },
        },
        post: {
            tags: ["Service Types"],
            summary: "Create a new service type",
            description: "Creates a new service type for the current organization",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateServiceTypeInput" },
                    },
                },
            },
            responses: {
                201: {
                    description: "Service type created successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/ServiceType" },
                                },
                            },
                        },
                    },
                },
                400: { description: "Bad request - Invalid input or code already exists" },
                401: { description: "Unauthorized" },
            },
        },
    },
    "/service-types/{id}": {
        get: {
            tags: ["Service Types"],
            summary: "Get a service type by ID",
            description: "Returns a specific service type",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "id",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                    description: "Service type ID",
                },
            ],
            responses: {
                200: {
                    description: "Service type retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/ServiceType" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                404: { description: "Service type not found" },
            },
        },
        put: {
            tags: ["Service Types"],
            summary: "Update a service type",
            description: "Updates an existing service type",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "id",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                    description: "Service type ID",
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateServiceTypeInput" },
                    },
                },
            },
            responses: {
                200: {
                    description: "Service type updated successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/ServiceType" },
                                },
                            },
                        },
                    },
                },
                400: { description: "Bad request - Invalid input" },
                401: { description: "Unauthorized" },
                404: { description: "Service type not found" },
            },
        },
        delete: {
            tags: ["Service Types"],
            summary: "Delete a service type",
            description: "Soft deletes a service type (sets deleted_at)",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "id",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                    description: "Service type ID",
                },
            ],
            responses: {
                200: {
                    description: "Service type deleted successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Service type deleted successfully" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                404: { description: "Service type not found" },
            },
        },
    },
};
//# sourceMappingURL=index.js.map