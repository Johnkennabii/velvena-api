import pino from "../lib/logger.js";
import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../types/express.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";


interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    pino.info({ decoded }, "✅ Token valid");

    req.user = {
      id: decoded.id,
      email: decoded.email ?? null,
      role: decoded.role ?? null,
    };

    next();
  } catch (err) {
    pino.error({ err }, "❌ Invalid token");
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;