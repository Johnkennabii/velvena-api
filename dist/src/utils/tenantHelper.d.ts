import { Prisma } from "@prisma/client";
/**
 * Helper utilities for multi-tenant queries
 */
/**
 * Adds organization_id filter to a Prisma where clause
 *
 * @param organizationId - The organization ID to filter by
 * @param additionalWhere - Additional where conditions
 * @returns Combined where clause with organization filter
 *
 * @example
 * const dresses = await prisma.dress.findMany({
 *   where: withOrgFilter(req.organizationId, { deleted_at: null })
 * });
 */
export declare function withOrgFilter<T extends Record<string, any>>(organizationId: string, additionalWhere?: T): T & {
    organization_id: string;
};
/**
 * For models with nullable organization_id (hybrid approach),
 * returns items that are either global (org_id = null) or belong to the organization
 *
 * @param organizationId - The organization ID to filter by
 * @param additionalWhere - Additional where conditions
 * @returns Where clause that includes global and organization-specific items
 *
 * @example
 * // Get dress types that are either global or belong to my organization
 * const dressTypes = await prisma.dressType.findMany({
 *   where: withOrgOrGlobal(req.organizationId, { deleted_at: null })
 * });
 */
export declare function withOrgOrGlobal<T extends Record<string, any>>(organizationId: string, additionalWhere?: T): Prisma.JsonObject;
/**
 * Creates organization-specific data for Prisma create/update operations
 *
 * @param organizationId - The organization ID
 * @param userId - The user ID (for created_by/updated_by)
 * @param data - The data object
 * @param isUpdate - Whether this is an update operation (adds updated_by/updated_at)
 * @returns Data object with organization context
 *
 * @example
 * const dress = await prisma.dress.create({
 *   data: withOrgData(req.organizationId, req.user.id, {
 *     name: "Red Dress",
 *     price_ht: 100,
 *     // ... other fields
 *   })
 * });
 */
export declare function withOrgData<T extends Record<string, any>>(organizationId: string, userId: string, data: T, isUpdate?: boolean): T & {
    organization_id: string;
    created_by?: string;
    updated_by?: string;
    updated_at?: Date;
};
/**
 * Validates that a resource belongs to the user's organization
 * Throws an error if not
 *
 * @param resource - The resource to validate
 * @param organizationId - The expected organization ID
 * @param resourceName - Name of the resource (for error message)
 * @throws Error if resource doesn't belong to organization
 *
 * @example
 * const dress = await prisma.dress.findUnique({ where: { id: dressId } });
 * validateOrgOwnership(dress, req.organizationId, "Dress");
 */
export declare function validateOrgOwnership(resource: any, organizationId: string, resourceName?: string): void;
/**
 * Type guard to check if a model has organization_id field
 */
export declare function hasOrganizationId(obj: any): obj is {
    organization_id: string;
};
//# sourceMappingURL=tenantHelper.d.ts.map