import type { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";

export const getRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
    });
    pino.info({ count: roles.length }, "📌 Récupération des rôles");
    res.json({ success: true, data: roles });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération rôles");
    res.status(500).json({ success: false, error: "Failed to fetch roles" });
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Role ID is required" });
    }
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    res.json({ success: true, data: role });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération rôle par ID");
    res.status(500).json({ success: false, error: "Failed to fetch role" });
  }
};