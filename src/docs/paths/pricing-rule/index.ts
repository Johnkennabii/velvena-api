export default {
  "/pricing-rules": {
    get: {
      tags: ["Pricing Rules"],
      summary: "List all pricing rules",
      description: "Returns all pricing rules (global + organization-specific)",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Pricing rules retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PricingRule" },
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
      tags: ["Pricing Rules"],
      summary: "Create a new pricing rule",
      description: "Creates a new pricing rule for the current organization",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePricingRuleInput" },
          },
        },
      },
      responses: {
        201: {
          description: "Pricing rule created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/PricingRule" },
                },
              },
            },
          },
        },
        400: { description: "Bad request - Invalid input" },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/pricing-rules/{id}": {
    get: {
      tags: ["Pricing Rules"],
      summary: "Get a pricing rule by ID",
      description: "Returns a specific pricing rule",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Pricing rule ID",
        },
      ],
      responses: {
        200: {
          description: "Pricing rule retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/PricingRule" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Pricing rule not found" },
      },
    },
    put: {
      tags: ["Pricing Rules"],
      summary: "Update a pricing rule",
      description: "Updates an existing pricing rule",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Pricing rule ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdatePricingRuleInput" },
          },
        },
      },
      responses: {
        200: {
          description: "Pricing rule updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/PricingRule" },
                },
              },
            },
          },
        },
        400: { description: "Bad request - Invalid input" },
        401: { description: "Unauthorized" },
        404: { description: "Pricing rule not found" },
      },
    },
    delete: {
      tags: ["Pricing Rules"],
      summary: "Delete a pricing rule",
      description: "Soft deletes a pricing rule (sets deleted_at)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Pricing rule ID",
        },
      ],
      responses: {
        200: {
          description: "Pricing rule deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Pricing rule deleted successfully" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Pricing rule not found" },
      },
    },
  },
  "/pricing-rules/calculate": {
    post: {
      tags: ["Pricing Rules"],
      summary: "Calculate price for a rental",
      description: "Calculates the price for renting a dress based on pricing rules",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CalculatePriceInput" },
          },
        },
      },
      responses: {
        200: {
          description: "Price calculated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PriceCalculationResult" },
            },
          },
        },
        400: { description: "Bad request - Invalid input or dates" },
        401: { description: "Unauthorized" },
        404: { description: "Dress not found" },
      },
    },
  },
};
