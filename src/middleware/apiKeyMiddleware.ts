// src/middleware/apiKeyMiddleware.ts
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import bcrypt from "bcrypt";

/**
 * Middleware pour authentifier avec une API Key
 * Header attendu: X-API-Key: <api_key>
 */
export const apiKeyMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API Key required. Provide X-API-Key header.",
      });
    }

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
      { apiKeyName: matchedKey.name, scopes },
      "✅ API Key authenticated"
    );

    next();
  } catch (err: any) {
    pino.error({ err }, "❌ API Key middleware error");
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Middleware pour vérifier qu'un scope spécifique est présent
 */
export const requireScope = (requiredScope: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: "API Key authentication required",
      });
    }

    const hasScope = req.apiKey.scopes.includes(requiredScope);
    if (!hasScope) {
      pino.warn(
        {
          apiKeyName: req.apiKey.name,
          requiredScope,
          availableScopes: req.apiKey.scopes,
        },
        "❌ Insufficient scope"
      );
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required scope: ${requiredScope}`,
      });
    }

    next();
  };
};
