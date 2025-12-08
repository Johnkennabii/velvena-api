import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
/**
 * Middleware pour gérer le contexte d'organisation
 *
 * Comportement:
 * - SUPER_ADMIN: Peut spécifier une organisation via le header X-Organization-Slug
 * - Autres rôles: Utilisent automatiquement leur organization_id
 *
 * Usage:
 * Header: X-Organization-Slug: acme-corp
 * → Le SUPER_ADMIN opère dans le contexte de l'organisation "acme-corp"
 */
export const organizationContextMiddleware = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        // Par défaut, utiliser l'organization_id du user
        let effectiveOrganizationId = user.organizationId;
        // Vérifier si l'utilisateur est SUPER_ADMIN
        const userWithRole = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                profile: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        const isSuperAdmin = userWithRole?.profile?.role?.name === "SUPER_ADMIN";
        // Si SUPER_ADMIN et qu'un slug d'organisation est fourni
        if (isSuperAdmin) {
            const organizationSlug = req.headers["x-organization-slug"];
            if (organizationSlug) {
                // Récupérer l'organisation par son slug
                const targetOrganization = await prisma.organization.findUnique({
                    where: { slug: organizationSlug },
                    select: { id: true, name: true, slug: true },
                });
                if (!targetOrganization) {
                    return res.status(404).json({
                        success: false,
                        error: `Organization with slug "${organizationSlug}" not found`,
                    });
                }
                effectiveOrganizationId = targetOrganization.id;
                pino.info({
                    superAdminId: user.id,
                    targetOrganizationId: targetOrganization.id,
                    targetOrganizationSlug: organizationSlug,
                    targetOrganizationName: targetOrganization.name,
                }, "🔑 SUPER_ADMIN accessing organization context");
            }
        }
        else {
            // Non-SUPER_ADMIN: Interdire l'utilisation du header X-Organization-Slug
            const organizationSlug = req.headers["x-organization-slug"];
            if (organizationSlug) {
                pino.warn({
                    userId: user.id,
                    role: userWithRole?.profile?.role?.name,
                    attemptedSlug: organizationSlug,
                }, "⚠️ Non-SUPER_ADMIN attempted to use X-Organization-Slug header");
                return res.status(403).json({
                    success: false,
                    error: "Only SUPER_ADMIN can switch organization context",
                });
            }
        }
        // Vérifier que l'organization_id effectif existe
        if (!effectiveOrganizationId) {
            return res.status(403).json({
                success: false,
                error: "Organization context required",
            });
        }
        // Ajouter le contexte d'organisation à la requête
        req.organizationContext = {
            organizationId: effectiveOrganizationId,
            isSuperAdminContext: isSuperAdmin && req.headers["x-organization-slug"] !== undefined,
        };
        next();
    }
    catch (err) {
        pino.error({ err }, "❌ Organization context middleware error");
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
//# sourceMappingURL=organizationContextMiddleware.js.map