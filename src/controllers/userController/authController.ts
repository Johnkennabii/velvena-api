import type { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";
import logger from "../../lib/logger.js";
import type { AuthenticatedRequest } from "../../types/express.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, roleName } = req.body;

    logger.info({ email, userId: req.user?.id }, "Attempting to register user");

    if (!req.user?.id || !req.user?.organizationId) {
      return res.status(401).json({ error: "Unauthorized: only authenticated users can create accounts" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Find global role
    const role = await prisma.role.findUnique({
      where: {
        name: roleName,
      },
    });
    if (!role) return res.status(400).json({ error: "Role not found" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        organization_id: req.user.organizationId, // Inherit organization from creator
        created_at: now,
        created_by: req.user.id,
        profile: {
          create: {
            role_id: role.id,
            created_at: now,
            created_by: req.user.id,
            firstName: req.body.firstName || null,
            lastName: req.body.lastName || null,
          },
        },
      },
      include: { profile: true },
    });

    res.status(201).json({ id: newUser.id, email: newUser.email, role: role.name, profile: newUser.profile });
  } catch (err: any) {
    logger.error({ err }, "Failed to register user");
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Extract email - handle both string and object formats
    let emailValue: string;
    const { email, password } = req.body;

    if (typeof email === 'string') {
      emailValue = email;
    } else if (typeof email === 'object' && email !== null && 'email' in email) {
      // Frontend sent user object instead of just email string
      emailValue = email.email as string;
    } else {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: "Password is required" });
    }

    logger.info({ email: emailValue }, "Attempting to login user");

    const user = await prisma.user.findUnique({
      where: { email: emailValue },
      include: {
        profile: { include: { role: true } },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            is_active: true,
          },
        },
      },
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    // Check if organization is active
    if (!user.organization.is_active) {
      return res.status(403).json({ error: "Organization is inactive" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    await prisma.user.update({ where: { id: user.id }, data: { last_signin_at: new Date() } });

    const roleName = user.profile?.role?.name ?? null;
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: roleName,
        organizationId: user.organization_id, // Add organizationId to JWT payload
      },
      JWT_SECRET,
      { expiresIn: "6h" }
    );

    logger.info({ userId: user.id, email: user.email, role: roleName, organizationId: user.organization_id }, "User logged in");

    res.json({
      token,
      id: user.id,
      email: user.email,
      role: roleName,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to login user");
    res.status(400).json({ error: err.message });
  }
};


export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    logger.info({ userId: req.user.id }, "Fetching current user info");

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: { include: { role: true } },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const roleName = user.profile?.role?.name ?? null;
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: roleName,
        organizationId: user.organization_id, // Add organizationId to JWT payload
      },
      JWT_SECRET,
      { expiresIn: "6h" }
    );
    logger.info({ userId: user.id, email: user.email, role: roleName, organizationId: user.organization_id }, "Current user info fetched");

    res.json({
      token,
      id: user.id,
      email: user.email,
      role: roleName,
      profile: user.profile,
      organization: user.organization,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch current user info");
    res.status(400).json({ error: err.message });
  }
};

export const refresh = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Récupération de l'utilisateur depuis la DB pour vérifier qu'il existe toujours
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: { include: { role: true } },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const roleName = user.profile?.role?.name ?? null;

    // Génération d'un nouveau JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: roleName,
        organizationId: user.organization_id, // Add organizationId to JWT payload
      },
      JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.json({
      token,
      id: user.id,
      email: user.email,
      role: roleName,
      profile: user.profile,
      organization: user.organization,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to refresh token");
    res.status(400).json({ error: err.message });
  }
};