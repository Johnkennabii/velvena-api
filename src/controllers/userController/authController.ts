import type { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";
import logger from "../../lib/logger.js";
import type { AuthenticatedRequest } from "../../types/express.js";
import {
  verifyEmailToken,
  resendVerificationEmail,
} from "../../services/emailVerificationService.js";

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

    // Handle unique constraint violation
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0];
      if (field === "email") {
        return res.status(409).json({
          success: false,
          error: `Un utilisateur avec l'email '${req.body.email}' existe déjà.`,
          code: "DUPLICATE_EMAIL"
        });
      }
      if (field === "email_verification_token") {
        return res.status(409).json({
          success: false,
          error: "Un conflit de token de vérification s'est produit. Veuillez réessayer.",
          code: "DUPLICATE_TOKEN"
        });
      }
      return res.status(409).json({
        success: false,
        error: "Un utilisateur avec ces informations existe déjà.",
        code: "DUPLICATE_ENTRY"
      });
    }

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

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        error: "Email not verified",
        message: "Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte de réception.",
        email_verification_required: true,
      });
    }

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

/**
 * Verify email address using token from email link
 * GET /auth/verify-email/:token
 */
export const verifyEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Le lien de vérification est invalide"
      });
    }

    logger.info({ token }, "Attempting to verify email");

    const result = await verifyEmailToken(token);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Le lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.",
      });
    }

    logger.info({ userId: result.userId, email: result.email }, "Email verified successfully");

    // Generate JWT token for automatic login after verification
    const user = await prisma.user.findUnique({
      where: { id: result.userId },
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
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: roleName,
        organizationId: user.organization_id,
      },
      JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        email_verified: true,
        role: roleName,
        profile: user.profile,
        organizationId: user.organization_id,
        organization: user.organization,
      },
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to verify email");
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de l'email"
    });
  }
};

/**
 * Resend verification email
 * POST /auth/resend-verification
 * Body: { email: string }
 */
export const resendVerification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "L'adresse email est requise"
      });
    }

    logger.info({ email }, "Attempting to resend verification email");

    const sent = await resendVerificationEmail(email);

    if (!sent) {
      return res.status(400).json({
        success: false,
        message: "Impossible de renvoyer l'email de vérification. L'email est peut-être déjà vérifié ou n'existe pas.",
      });
    }

    logger.info({ email }, "Verification email resent successfully");

    res.json({
      success: true,
      message: "Email de vérification envoyé. Veuillez consulter votre boîte de réception.",
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to resend verification email");
    res.status(500).json({
      success: false,
      message: "Erreur lors du renvoi de l'email"
    });
  }
};