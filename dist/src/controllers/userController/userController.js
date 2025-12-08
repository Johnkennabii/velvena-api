import prisma from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import logger from "../../lib/logger.js";
import { requireOrganizationContext } from "../../utils/organizationHelper.js";
// 👉 Get all users
export const getUsers = async (req, res) => {
    try {
        // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
        const organizationId = requireOrganizationContext(req, res);
        if (!organizationId)
            return; // Error response already sent
        // Multi-tenant isolation: only return users from the effective organization
        const users = await prisma.user.findMany({
            where: {
                organization_id: organizationId, // ✅ Isolation (works with SUPER_ADMIN context)
            },
            include: {
                profile: { include: { role: true } },
            },
        });
        logger.info({ organizationId, count: users.length }, "✅ Fetched users for organization");
        res.json({ success: true, count: users.length, data: users });
    }
    catch (err) {
        logger.error({ err }, "❌ Failed to fetch users");
        res.status(500).json({ success: false, error: "Failed to fetch users", count: 0, data: [] });
    }
};
// 👉 Get one user by ID
export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ success: false, error: "User ID is required" });
        // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
        const organizationId = requireOrganizationContext(req, res);
        if (!organizationId)
            return;
        // Multi-tenant isolation: only return user from the effective organization
        const user = await prisma.user.findFirst({
            where: {
                id,
                organization_id: organizationId, // ✅ Isolation (works with SUPER_ADMIN context)
            },
            include: {
                profile: { include: { role: true } },
            },
        });
        if (!user)
            return res.status(404).json({ success: false, error: "User not found" });
        logger.info({ userId: id, organizationId }, "✅ Fetched user");
        res.json({ success: true, data: user });
    }
    catch (err) {
        logger.error({ err }, "❌ Failed to fetch user");
        res.status(500).json({ success: false, error: "Failed to fetch user" });
    }
};
// 👉 Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, profile } = req.body;
        logger.info({ id, profile }, "🔄 Updating user");
        if (!id)
            return res.status(400).json({ success: false, error: "User ID is required" });
        // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
        const organizationId = requireOrganizationContext(req, res);
        if (!organizationId)
            return;
        if (!password && !profile)
            return res.status(400).json({ success: false, error: "At least one field must be provided" });
        // Multi-tenant isolation: verify user belongs to the effective organization
        const existingUser = await prisma.user.findFirst({
            where: {
                id,
                organization_id: organizationId, // ✅ Isolation (works with SUPER_ADMIN context)
            },
        });
        if (!existingUser) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        const data = {};
        // 🔐 Password
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }
        if (req.user?.id) {
            data.updated_by = req.user.id;
            data.updated_at = new Date();
        }
        // 👤 Gestion du profil
        if (profile) {
            const { email, firstname, lastname, ...rawProfileFields } = profile;
            const profileFields = { ...rawProfileFields };
            if (Object.keys(profileFields).length === 0)
                return res.status(400).json({ success: false, error: "At least one profile field must be provided" });
            if (!profileFields.role_id)
                return res.status(400).json({ success: false, error: "role_id is required for profile updates" });
            if (req.user?.id) {
                profileFields.updated_by = req.user.id;
                profileFields.updated_at = new Date();
            }
            // ✅ Vérifie si le profil existe
            const existingProfile = await prisma.profile.findUnique({ where: { userId: id } });
            if (existingProfile) {
                // Mise à jour
                data.profile = {
                    update: profileFields,
                };
            }
            else {
                // Création si manquant
                data.profile = {
                    create: {
                        ...profileFields,
                        userId: id,
                    },
                };
            }
        }
        // 🔄 Exécution
        const user = await prisma.user.update({
            where: { id },
            data,
            include: {
                profile: { include: { role: true } },
            },
        });
        logger.info({ userId: user.id }, "✅ User updated successfully");
        res.json({ success: true, data: user });
    }
    catch (err) {
        logger.error({ err }, "❌ Failed to update user");
        res.status(500).json({ success: false, error: "Failed to update user" });
    }
};
// 👉 Soft delete user
export const softDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ success: false, error: "User ID is required" });
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
        const organizationId = requireOrganizationContext(req, res);
        if (!organizationId)
            return;
        // Multi-tenant isolation: verify user belongs to the effective organization
        const existingUser = await prisma.user.findFirst({
            where: {
                id,
                organization_id: organizationId, // ✅ Isolation (works with SUPER_ADMIN context)
            },
        });
        if (!existingUser) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        const user = await prisma.user.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                deleted_by: req.user.id,
                updated_at: new Date(),
            },
        });
        // Marquer aussi le profil comme supprimé
        await prisma.profile.updateMany({
            where: { userId: id },
            data: {
                deleted_at: new Date(),
                deleted_by: req.user.id,
            },
        });
        logger.info({ userId: id, organizationId }, "✅ User soft deleted");
        res.json({ success: true, data: user });
    }
    catch (err) {
        logger.error({ err }, "❌ Failed to soft delete user");
        res.status(500).json({ success: false, error: "Failed to soft delete user" });
    }
};
// 👉 Hard delete user
export const hardDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ success: false, error: "User ID is required" });
        // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
        const organizationId = requireOrganizationContext(req, res);
        if (!organizationId)
            return;
        // Multi-tenant isolation: verify user belongs to the effective organization
        const exists = await prisma.user.findFirst({
            where: {
                id,
                organization_id: organizationId, // ✅ Isolation (works with SUPER_ADMIN context)
            },
        });
        if (!exists)
            return res.status(404).json({ success: false, error: "User not found" });
        await prisma.profile.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });
        logger.info({ userId: id, organizationId }, "✅ User hard deleted");
        res.json({ success: true, data: { message: "User permanently deleted" } });
    }
    catch (err) {
        logger.error({ err }, "❌ Failed to hard delete user");
        res.status(500).json({ success: false, error: "Failed to hard delete user" });
    }
};
// 👉 Change user password (Admin can change all, Manager can change all except Admins)
export const changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params; // ID de l'utilisateur dont on veut changer le mot de passe
        const { password } = req.body;
        logger.info({ targetUserId: id, requesterId: req.user?.id }, "🔑 Change password request");
        // Vérifications de base
        if (!id) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                error: "Password is required and must be at least 8 characters"
            });
        }
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
        const organizationId = requireOrganizationContext(req, res);
        if (!organizationId)
            return;
        // Récupérer l'utilisateur courant avec son rôle
        const currentUser = await prisma.user.findFirst({
            where: {
                id: req.user.id,
                organization_id: req.user.organizationId, // User's own org (NOT the target org for SUPER_ADMIN)
            },
            include: {
                profile: { include: { role: true } }
            }
        });
        if (!currentUser || !currentUser.profile?.role) {
            return res.status(403).json({
                success: false,
                error: "User role not found"
            });
        }
        const currentUserRole = currentUser.profile.role.name.toLowerCase();
        // Vérifier que l'utilisateur courant est admin, manager ou super_admin
        if (currentUserRole !== "admin" && currentUserRole !== "manager" && currentUserRole !== "super_admin") {
            return res.status(403).json({
                success: false,
                error: "Only admins, managers, and super_admins can change user passwords"
            });
        }
        // Multi-tenant isolation: récupérer l'utilisateur cible de l'organisation effective (peut être différente pour SUPER_ADMIN)
        const targetUser = await prisma.user.findFirst({
            where: {
                id,
                organization_id: organizationId, // ✅ Isolation (works with SUPER_ADMIN context)
            },
            include: {
                profile: { include: { role: true } }
            }
        });
        if (!targetUser) {
            return res.status(404).json({ success: false, error: "Target user not found" });
        }
        // Si l'utilisateur courant est manager, vérifier que la cible n'est pas admin
        if (currentUserRole === "manager") {
            const targetUserRole = targetUser.profile?.role?.name.toLowerCase();
            if (targetUserRole === "admin") {
                return res.status(403).json({
                    success: false,
                    error: "Managers cannot change admin passwords"
                });
            }
        }
        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        // Mettre à jour le mot de passe
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                updated_by: req.user.id,
                updated_at: new Date(),
            },
            select: {
                id: true,
                email: true,
                profile: {
                    include: { role: true }
                }
            }
        });
        logger.info({
            targetUserId: id,
            requesterId: req.user.id,
            requesterRole: currentUserRole
        }, "✅ Password changed successfully");
        res.json({
            success: true,
            message: "Password changed successfully",
            data: updatedUser
        });
    }
    catch (err) {
        logger.error({ err }, "❌ Failed to change password");
        res.status(500).json({ success: false, error: "Failed to change password" });
    }
};
// alias
export { hardDeleteUser as deleteUser };
//# sourceMappingURL=userController.js.map