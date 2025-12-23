/**
 * Role-based Access Control Middleware
 *
 * Vérifie que l'utilisateur a un des rôles requis pour accéder à une ressource
 */

import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";

/**
 * Rôles disponibles dans le système
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Vérifie que l'utilisateur a un des rôles requis
 * @param allowedRoles - Liste des rôles autorisés
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Récupérer l'utilisateur avec son profil et rôle
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      const userRole = user.profile?.role?.name;

      if (!userRole) {
        res.status(403).json({
          success: false,
          error: "No role assigned to user",
          message: "Please contact your administrator to assign a role",
        });
        return;
      }

      // Vérifier si l'utilisateur a un des rôles autorisés
      if (!allowedRoles.includes(userRole as UserRole)) {
        pino.warn(
          {
            userId,
            userRole,
            allowedRoles,
            path: req.path,
          },
          "Access denied: insufficient permissions"
        );

        res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
          required_roles: allowedRoles,
          user_role: userRole,
        });
        return;
      }

      // Stocker le rôle dans req pour utilisation ultérieure
      (req as any).userRole = userRole;

      pino.debug(
        {
          userId,
          userRole,
          path: req.path,
        },
        "Role check passed"
      );

      next();
    } catch (error) {
      pino.error({ error }, "Error in role middleware");

      res.status(500).json({
        success: false,
        error: "Failed to verify user permissions",
      });
    }
  };
}

/**
 * Middleware pour vérifier si l'utilisateur est SUPER_ADMIN
 */
export const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);

/**
 * Middleware pour vérifier si l'utilisateur est ADMIN ou SUPER_ADMIN
 */
export const requireAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);

/**
 * Middleware pour vérifier si l'utilisateur est MANAGER, ADMIN ou SUPER_ADMIN
 */
export const requireManager = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER
);

/**
 * Vérifie si un utilisateur a un rôle spécifique (fonction helper)
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            role: true,
          },
        },
      },
    });

    return user?.profile?.role?.name === role;
  } catch (error) {
    pino.error({ error, userId, role }, "Error checking user role");
    return false;
  }
}

/**
 * Récupère le rôle d'un utilisateur
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            role: true,
          },
        },
      },
    });

    return user?.profile?.role?.name || null;
  } catch (error) {
    pino.error({ error, userId }, "Error getting user role");
    return null;
  }
}
