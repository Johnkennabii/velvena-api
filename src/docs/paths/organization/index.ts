export default {
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
