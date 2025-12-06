import pino from "../lib/logger.js";
import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";


interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
}

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    pino.warn("❌ Missing authorization header");
    return res.status(401).json({ message: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    pino.warn({ authHeader }, "❌ Missing token after split");
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    pino.debug({ userId: decoded.id }, "✅ Token valid, fetching user data");

    // Fetch user with organization to get organizationId
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        organization_id: true,
        profile: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      pino.warn({ userId: decoded.id }, "❌ User not found");
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.organization_id) {
      pino.error({ userId: user.id }, "❌ User has no organization");
      return res.status(403).json({ message: "User is not assigned to an organization" });
    }

    req.user = {
      id: user.id,
      email: user.email ?? null,
      role: user.profile?.role?.name ?? null,
      organizationId: user.organization_id,
    };

    pino.info(
      { userId: user.id, organizationId: user.organization_id },
      "✅ User authenticated with organization context"
    );

    next();
  } catch (err) {
    pino.error({ err }, "❌ Invalid token");
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;