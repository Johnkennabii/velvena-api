  import type { Request, Response } from "express";
  import type { AuthenticatedRequest } from "../../types/express.js";
  import prisma from "../../lib/prisma.js";
  import bcrypt from "bcrypt";
  import logger from "../../lib/logger.js";

  // 👉 Get all users
  export const getUsers = async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          profile: { include: { role: true } },
        },
      });
      res.json({ success: true, count: users.length, data: users });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to fetch users", count: 0, data: [] });
    }
  };

  // 👉 Get one user by ID
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "User ID is required" });

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: { include: { role: true } },
      },
    });

    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
};

// 👉 Update user
export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password, profile } = req.body;

    logger.info({ id, profile }, "🔄 Updating user");

    if (!id)
      return res.status(400).json({ success: false, error: "User ID is required" });

    if (!password && !profile)
      return res.status(400).json({ success: false, error: "At least one field must be provided" });

    const data: any = {};

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
      const profileFields: Record<string, any> = { ...rawProfileFields };
      
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
      } else {
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
  } catch (err: any) {
    logger.error({ err }, "❌ Failed to update user");
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
};

// 👉 Soft delete user
export const softDeleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "User ID is required" });

    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
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

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to soft delete user" });
  }
};

// 👉 Hard delete user
export const hardDeleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "User ID is required" });

    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ success: false, error: "User not found" });

    await prisma.profile.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, data: { message: "User permanently deleted" } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to hard delete user" });
  }
};

// alias
export { hardDeleteUser as deleteUser };