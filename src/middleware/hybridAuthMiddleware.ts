// src/middleware/hybridAuthMiddleware.ts
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * Middleware d'authentification hybride
 * Accepte soit un token JWT (Bearer) soit une API Key (X-API-Key)
 *
 * Priorité:
 * 1. Si X-API-Key est fourni, utiliser l'authentification API Key
 * 2. Sinon, si Authorization Bearer est fourni, utiliser JWT
 * 3. Sinon, rejeter la requête
 */
export const hybridAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;
    const authHeader = req.headers.authorization;

    // Priorité 1: API Key
    if (apiKey) {
      return await authenticateWithApiKey(req, res, next, apiKey);
    }

    // Priorité 2: JWT Token
    if (authHeader?.startsWith("Bearer ")) {
      return await authenticateWithJWT(req, res, next, authHeader);
    }

    // Aucune authentification fournie
    return res.status(401).json({
      success: false,
      error: "Authentication required. Provide either Bearer token or X-API-Key header.",
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Hybrid auth middleware error");
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Authentification via API Key
 */
async function authenticateWithApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  apiKey: string
) {
  // Récupérer toutes les API keys actives
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      revoked_at: null,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
  });

  // Vérifier le hash de la clé fournie
  let matchedKey = null;
  for (const key of apiKeys) {
    const isMatch = await bcrypt.compare(apiKey, key.key_hash);
    if (isMatch) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    pino.warn({ apiKey: apiKey.substring(0, 8) + "..." }, "❌ Invalid API Key");
    return res.status(401).json({
      success: false,
      error: "Invalid or expired API Key",
    });
  }

  // Mettre à jour last_used_at (sans bloquer la requête)
  prisma.apiKey
    .update({
      where: { id: matchedKey.id },
      data: { last_used_at: new Date() },
    })
    .catch((err) => pino.error({ err }, "Failed to update API Key last_used_at"));

  // Parser les scopes
  let scopes: string[] = [];
  try {
    scopes = JSON.parse(matchedKey.scopes);
  } catch {
    scopes = [];
  }

  // Ajouter les infos d'API Key au request
  req.apiKey = {
    id: matchedKey.id,
    name: matchedKey.name,
    scopes,
  };

  pino.info(
    { apiKeyName: matchedKey.name, scopes, method: req.method, url: req.url },
    "✅ API Key authenticated"
  );

  next();
}

/**
 * Authentification via JWT
 */
async function authenticateWithJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  authHeader: string
) {
  const token = authHeader.substring(7); // Remove "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email?: string;
      role?: string;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email ?? null,
      role: decoded.role ?? null,
    };

    pino.info({ userId: decoded.id, method: req.method, url: req.url }, "✅ JWT authenticated");
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      pino.warn({ err }, "❌ JWT expired");
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    pino.error({ err }, "❌ Invalid JWT");
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
}

/**
 * Middleware pour vérifier qu'un scope API Key spécifique est présent
 * (Ne s'applique que si authentifié via API Key, pas JWT)
 */
export const requireApiKeyScope = (requiredScope: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Si authentifié via JWT (pas d'API Key), autoriser
    if (!req.apiKey && req.user) {
      return next();
    }

    // Si authentifié via API Key, vérifier le scope
    if (req.apiKey) {
      const hasScope = req.apiKey.scopes.includes(requiredScope);
      if (!hasScope) {
        pino.warn(
          {
            apiKeyName: req.apiKey.name,
            requiredScope,
            availableScopes: req.apiKey.scopes,
          },
          "❌ Insufficient API Key scope"
        );
        return res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required scope: ${requiredScope}`,
        });
      }
      return next();
    }

    // Pas d'authentification
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  };
};
