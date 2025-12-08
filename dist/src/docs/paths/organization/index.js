export default {
    "/organizations/initialize": {
        post: {
            tags: ["Organizations"],
            summary: "Initialize a new organization with first MANAGER user",
            description: "Creates a new organization along with the first MANAGER user. This is used for the onboarding/subscription flow. No authentication required.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["organizationName", "slug", "userEmail", "password"],
                            properties: {
                                organizationName: {
                                    type: "string",
                                    example: "Boutique Paris",
                                    description: "Name of the organization",
                                },
                                slug: {
                                    type: "string",
                                    example: "boutique-paris",
                                    description: "URL-friendly unique identifier",
                                },
                                email: {
                                    type: "string",
                                    format: "email",
                                    example: "contact@boutique-paris.fr",
                                    description: "Organization contact email",
                                },
                                phone: {
                                    type: "string",
                                    example: "+33123456789",
                                    description: "Organization phone number",
                                },
                                address: { type: "string", example: "123 Rue de la Paix" },
                                city: { type: "string", example: "Paris" },
                                postal_code: { type: "string", example: "75001" },
                                country: { type: "string", example: "France" },
                                subscription_plan: {
                                    type: "string",
                                    enum: ["free", "basic", "pro", "enterprise"],
                                    default: "free",
                                    description: "Initial subscription plan",
                                },
                                userEmail: {
                                    type: "string",
                                    format: "email",
                                    example: "manager@boutique-paris.fr",
                                    description: "Email for the first MANAGER user",
                                },
                                password: {
                                    type: "string",
                                    format: "password",
                                    minLength: 8,
                                    example: "SecurePassword123!",
                                    description: "Password for the first MANAGER user (min 8 characters)",
                                },
                                firstName: {
                                    type: "string",
                                    example: "Marie",
                                    description: "First name of the first user",
                                },
                                lastName: {
                                    type: "string",
                                    example: "Dupont",
                                    description: "Last name of the first user",
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Organization initialized successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    message: { type: "string", example: "Organization created successfully" },
                                    token: {
                                        type: "string",
                                        description: "JWT token for immediate login",
                                    },
                                    organization: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string", format: "uuid" },
                                            name: { type: "string", example: "Boutique Paris" },
                                            slug: { type: "string", example: "boutique-paris" },
                                            subscription_plan: { type: "string", example: "free" },
                                            subscription_status: { type: "string", example: "trial" },
                                            trial_ends_at: { type: "string", format: "date-time" },
                                        },
                                    },
                                    user: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string", format: "uuid" },
                                            email: { type: "string", format: "email" },
                                            role: { type: "string", example: "MANAGER" },
                                            profile: {
                                                type: "object",
                                                properties: {
                                                    firstName: { type: "string" },
                                                    lastName: { type: "string" },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: {
                    description: "Bad request - Invalid input, slug already exists, or user email already exists",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "string" },
                                },
                            },
                        },
                    },
                },
                500: { description: "Internal server error" },
            },
        },
    },
    "/organizations/me": {
        get: {
            tags: ["Organizations"],
            summary: "Get current user's organization",
            description: "Returns the organization details for the authenticated user",
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Organization retrieved successfully",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Organization" },
                        },
                    },
                },
                401: { description: "Unauthorized - Invalid or missing token" },
                404: { description: "Organization not found" },
            },
        },
        put: {
            tags: ["Organizations"],
            summary: "Update current user's organization",
            description: "Updates the organization details for the authenticated user",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateOrganizationInput" },
                    },
                },
            },
            responses: {
                200: {
                    description: "Organization updated successfully",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Organization" },
                        },
                    },
                },
                400: { description: "Bad request - Invalid input" },
                401: { description: "Unauthorized" },
                404: { description: "Organization not found" },
            },
        },
    },
    "/organizations/me/stats": {
        get: {
            tags: ["Organizations"],
            summary: "Get organization statistics",
            description: "Returns statistics about users, dresses, customers, contracts for the current organization",
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Statistics retrieved successfully",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/OrganizationStats" },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                404: { description: "Organization not found" },
            },
        },
    },
    "/organizations": {
        get: {
            tags: ["Organizations"],
            summary: "List all organizations (Super Admin only)",
            description: "Returns a list of all organizations. Requires super_admin role.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "query",
                    name: "page",
                    schema: { type: "integer", default: 1 },
                    description: "Page number",
                },
                {
                    in: "query",
                    name: "limit",
                    schema: { type: "integer", default: 20 },
                    description: "Items per page",
                },
            ],
            responses: {
                200: {
                    description: "Organizations list retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Organization" },
                                    },
                                    total: { type: "integer", example: 10 },
                                    page: { type: "integer", example: 1 },
                                    limit: { type: "integer", example: 20 },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden - Requires super_admin role" },
            },
        },
        post: {
            tags: ["Organizations"],
            summary: "Create a new organization (Super Admin only)",
            description: "Creates a new organization. Requires super_admin role.",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateOrganizationInput" },
                    },
                },
            },
            responses: {
                201: {
                    description: "Organization created successfully",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Organization" },
                        },
                    },
                },
                400: { description: "Bad request - Invalid input or slug already exists" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden - Requires super_admin role" },
            },
        },
    },
};
//# sourceMappingURL=index.js.map