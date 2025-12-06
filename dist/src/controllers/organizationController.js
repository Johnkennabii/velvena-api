import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
/**
 * Get current user's organization
 */
export const getMyOrganization = async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "No organization context" });
        }
        const organization = await prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                postal_code: true,
                country: true,
                logo_url: true,
                settings: true,
                subscription_plan: true,
                trial_ends_at: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!organization) {
            return res.status(404).json({ error: "Organization not found" });
        }
        res.json(organization);
    }
    catch (err) {
        logger.error({ err }, "Failed to fetch organization");
        res.status(500).json({ error: err.message });
    }
};
/**
 * Update current user's organization
 * Only admins should be able to do this (add role check in route)
 */
export const updateMyOrganization = async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "No organization context" });
        }
        const { name, email, phone, address, city, postal_code, country, logo_url, settings, } = req.body;
        const organization = await prisma.organization.update({
            where: { id: req.user.organizationId },
            data: {
                name,
                email,
                phone,
                address,
                city,
                postal_code,
                country,
                logo_url,
                settings,
                updated_at: new Date(),
                updated_by: req.user.id,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                postal_code: true,
                country: true,
                logo_url: true,
                settings: true,
                subscription_plan: true,
                is_active: true,
                updated_at: true,
            },
        });
        logger.info({ organizationId: organization.id, userId: req.user.id }, "Organization updated");
        res.json(organization);
    }
    catch (err) {
        logger.error({ err }, "Failed to update organization");
        res.status(500).json({ error: err.message });
    }
};
/**
 * Get organization statistics
 */
export const getOrganizationStats = async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "No organization context" });
        }
        const orgId = req.user.organizationId;
        // Run all queries in parallel for better performance
        const [usersCount, dressesCount, customersCount, prospectsCount, activeContractsCount,] = await Promise.all([
            prisma.user.count({
                where: { organization_id: orgId, deleted_at: null },
            }),
            prisma.dress.count({
                where: { organization_id: orgId, deleted_at: null },
            }),
            prisma.customer.count({
                where: { organization_id: orgId, deleted_at: null },
            }),
            prisma.prospect.count({
                where: { organization_id: orgId, deleted_at: null },
            }),
            prisma.contract.count({
                where: {
                    organization_id: orgId,
                    deleted_at: null,
                    status: { in: ["signed", "active", "in_progress"] },
                },
            }),
        ]);
        res.json({
            users: usersCount,
            dresses: dressesCount,
            customers: customersCount,
            prospects: prospectsCount,
            active_contracts: activeContractsCount,
        });
    }
    catch (err) {
        logger.error({ err }, "Failed to fetch organization stats");
        res.status(500).json({ error: err.message });
    }
};
/**
 * SUPER ADMIN ONLY: Create a new organization
 * This endpoint should be protected by a super-admin check
 */
export const createOrganization = async (req, res) => {
    try {
        const { name, slug, email, phone, address, city, postal_code, country, subscription_plan, } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: "Name and slug are required" });
        }
        // Check if slug already exists
        const existing = await prisma.organization.findUnique({
            where: { slug },
        });
        if (existing) {
            return res.status(400).json({ error: "Organization slug already exists" });
        }
        const organization = await prisma.organization.create({
            data: {
                name,
                slug,
                email,
                phone,
                address,
                city,
                postal_code,
                country,
                subscription_plan: subscription_plan || "free",
                is_active: true,
                created_at: new Date(),
                created_by: req.user?.id,
            },
        });
        logger.info({ organizationId: organization.id, userId: req.user?.id }, "Organization created");
        res.status(201).json(organization);
    }
    catch (err) {
        logger.error({ err }, "Failed to create organization");
        res.status(500).json({ error: err.message });
    }
};
/**
 * SUPER ADMIN ONLY: List all organizations
 */
export const listOrganizations = async (req, res) => {
    try {
        const { limit = "50", offset = "0", is_active } = req.query;
        const where = { deleted_at: null };
        if (is_active !== undefined) {
            where.is_active = is_active === "true";
        }
        const organizations = await prisma.organization.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                subscription_plan: true,
                is_active: true,
                created_at: true,
                _count: {
                    select: {
                        users: true,
                        dresses: true,
                        customers: true,
                        contracts: true,
                    },
                },
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { created_at: "desc" },
        });
        const total = await prisma.organization.count({ where });
        res.json({
            organizations,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (err) {
        logger.error({ err }, "Failed to list organizations");
        res.status(500).json({ error: err.message });
    }
};
//# sourceMappingURL=organizationController.js.map