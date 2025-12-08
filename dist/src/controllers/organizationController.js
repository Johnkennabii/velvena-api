import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
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
                created_by: req.user?.id || null,
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
/**
 * PUBLIC: Initialize a new organization with first MANAGER user
 * This is used for the subscription/onboarding flow
 */
export const initializeOrganization = async (req, res) => {
    try {
        const { 
        // Organization data
        organizationName, slug, email: orgEmail, phone, address, city, postal_code, country, subscription_plan, 
        // First user data
        userEmail, password, firstName, lastName, } = req.body;
        // Validation
        if (!organizationName || !slug || !userEmail || !password) {
            return res.status(400).json({
                error: "organizationName, slug, userEmail, and password are required",
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters",
            });
        }
        // Check if slug already exists
        const existingOrg = await prisma.organization.findUnique({
            where: { slug },
        });
        if (existingOrg) {
            return res.status(400).json({ error: "Organization slug already exists" });
        }
        // Check if user email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
        });
        if (existingUser) {
            return res.status(400).json({ error: "User email already exists" });
        }
        const now = new Date();
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create organization, role, and user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create organization
            const organization = await tx.organization.create({
                data: {
                    name: organizationName,
                    slug,
                    email: orgEmail,
                    phone,
                    address,
                    city,
                    postal_code,
                    country,
                    subscription_plan: subscription_plan || "free",
                    subscription_status: "trial",
                    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
                    is_active: true,
                    created_at: now,
                },
            });
            // 2. Create or find MANAGER role for this organization
            let managerRole = await tx.role.findFirst({
                where: {
                    name: "MANAGER",
                    organization_id: organization.id,
                },
            });
            if (!managerRole) {
                managerRole = await tx.role.create({
                    data: {
                        name: "MANAGER",
                        description: "Organization manager with full access",
                        organization_id: organization.id,
                        created_at: now,
                    },
                });
            }
            // 3. Create first user with MANAGER role
            const user = await tx.user.create({
                data: {
                    email: userEmail,
                    password: hashedPassword,
                    organization_id: organization.id,
                    created_at: now,
                    profile: {
                        create: {
                            role_id: managerRole.id,
                            firstName,
                            lastName,
                            created_at: now,
                        },
                    },
                },
                include: {
                    profile: {
                        include: {
                            role: true,
                        },
                    },
                },
            });
            return { organization, user };
        });
        // Generate JWT token for immediate login
        const token = jwt.sign({
            id: result.user.id,
            email: result.user.email,
            role: "MANAGER",
            organizationId: result.organization.id, // Add organizationId to JWT payload
        }, JWT_SECRET, { expiresIn: "6h" });
        logger.info({
            organizationId: result.organization.id,
            userId: result.user.id,
            slug: result.organization.slug,
        }, "Organization initialized successfully with first MANAGER user");
        res.status(201).json({
            message: "Organization created successfully",
            token,
            organization: {
                id: result.organization.id,
                name: result.organization.name,
                slug: result.organization.slug,
                subscription_plan: result.organization.subscription_plan,
                subscription_status: result.organization.subscription_status,
                trial_ends_at: result.organization.trial_ends_at,
            },
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.profile?.role?.name,
                profile: {
                    firstName: result.user.profile?.firstName,
                    lastName: result.user.profile?.lastName,
                },
            },
        });
    }
    catch (err) {
        logger.error({ err }, "Failed to initialize organization");
        res.status(500).json({ error: err.message });
    }
};
//# sourceMappingURL=organizationController.js.map