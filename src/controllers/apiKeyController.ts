// src/controllers/apiKeyController.ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Générer une nouvelle API Key
 * POST /api-keys
 * Body: { name: string, scopes: string[], expires_at?: Date }
 */
export const generateApiKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, scopes, expires_at } = req.body;

    if (!name || !scopes || !Array.isArray(scopes)) {
      return res.status(400).json({
        success: false,
        error: "Name and scopes (array) are required",
      });
    }

    // Générer une clé aléatoire sécurisée (32 bytes = 64 caractères hex)
    const apiKey = `ak_${crypto.randomBytes(32).toString("hex")}`;

    // Hasher la clé avant de la stocker
    const key_hash = await bcrypt.hash(apiKey, 10);

    // Créer l'API key dans la base
    const newApiKey = await prisma.apiKey.create({
      data: {
        name,
        key_hash,
        scopes: JSON.stringify(scopes),
        expires_at: expires_at ? new Date(expires_at) : null,
        created_by: req.user?.id ?? null,
      },
    });

    pino.info({ apiKeyId: newApiKey.id, name, scopes }, "✅ API Key created");

    // IMPORTANT: Retourner la clé en clair UNIQUEMENT à la création
    // Elle ne pourra plus être récupérée ensuite
    res.status(201).json({
      success: true,
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        scopes: JSON.parse(newApiKey.scopes),
        expires_at: newApiKey.expires_at,
        created_at: newApiKey.created_at,
        // Clé en clair - À sauvegarder immédiatement !
        api_key: apiKey,
      },
      warning: "⚠️ Save this API key now. It will not be shown again.",
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error generating API Key");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to generate API Key",
    });
  }
};

/**
 * Lister toutes les API Keys (sans les clés en clair)
 * GET /api-keys
 */
export const listApiKeys = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        revoked_at: null,
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        scopes: true,
        expires_at: true,
        last_used_at: true,
        created_at: true,
        created_by: true,
      },
    });

    // Parser les scopes JSON
    const formattedKeys = apiKeys.map((key) => ({
      ...key,
      scopes: JSON.parse(key.scopes),
    }));

    res.json({
      success: true,
      data: formattedKeys,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error listing API Keys");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to list API Keys",
    });
  }
};

/**
 * Obtenir une API Key par ID
 * GET /api-keys/:id
 */
export const getApiKeyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: "API Key ID is required" });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        name: true,
        scopes: true,
        expires_at: true,
        last_used_at: true,
        created_at: true,
        created_by: true,
        revoked_at: true,
        revoked_by: true,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: "API Key not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...apiKey,
        scopes: JSON.parse(apiKey.scopes),
      },
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error getting API Key");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to get API Key",
    });
  }
};

/**
 * Révoquer une API Key
 * DELETE /api-keys/:id
 */
export const revokeApiKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: "API Key ID is required" });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: String(id) },
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: "API Key not found",
      });
    }

    if (apiKey.revoked_at) {
      return res.status(400).json({
        success: false,
        error: "API Key already revoked",
      });
    }

    const revokedKey = await prisma.apiKey.update({
      where: { id: String(id) },
      data: {
        revoked_at: new Date(),
        revoked_by: req.user?.id ?? null,
      },
    });

    pino.info({ apiKeyId: id, name: apiKey.name }, "✅ API Key revoked");

    res.json({
      success: true,
      message: "API Key revoked successfully",
      data: {
        id: revokedKey.id,
        name: revokedKey.name,
        revoked_at: revokedKey.revoked_at,
      },
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error revoking API Key");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to revoke API Key",
    });
  }
};

/**
 * Refresh (renouveler) une API Key
 * POST /api-keys/:id/refresh
 * Génère une nouvelle clé, révoque l'ancienne
 */
export const refreshApiKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: "API Key ID is required" });
    }

    const oldApiKey = await prisma.apiKey.findUnique({
      where: { id: String(id) },
    });

    if (!oldApiKey) {
      return res.status(404).json({
        success: false,
        error: "API Key not found",
      });
    }

    if (oldApiKey.revoked_at) {
      return res.status(400).json({
        success: false,
        error: "Cannot refresh a revoked API Key",
      });
    }

    // Générer une nouvelle clé aléatoire
    const newApiKey = `ak_${crypto.randomBytes(32).toString("hex")}`;
    const key_hash = await bcrypt.hash(newApiKey, 10);

    // Créer la nouvelle API key avec les mêmes propriétés
    const refreshedKey = await prisma.apiKey.create({
      data: {
        name: oldApiKey.name,
        key_hash,
        scopes: oldApiKey.scopes,
        expires_at: oldApiKey.expires_at,
        created_by: req.user?.id ?? null,
      },
    });

    // Révoquer l'ancienne clé
    await prisma.apiKey.update({
      where: { id: String(id) },
      data: {
        revoked_at: new Date(),
        revoked_by: req.user?.id ?? null,
      },
    });

    pino.info(
      { oldKeyId: id, newKeyId: refreshedKey.id, name: oldApiKey.name },
      "✅ API Key refreshed"
    );

    // Retourner la nouvelle clé en clair (UNIQUE fois !)
    res.json({
      success: true,
      message: "API Key refreshed successfully. Old key has been revoked.",
      data: {
        id: refreshedKey.id,
        name: refreshedKey.name,
        scopes: JSON.parse(refreshedKey.scopes),
        expires_at: refreshedKey.expires_at,
        created_at: refreshedKey.created_at,
        // Nouvelle clé en clair - À sauvegarder immédiatement !
        api_key: newApiKey,
        old_key_id: id,
      },
      warning: "⚠️ Save this new API key now. It will not be shown again. The old key has been revoked.",
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error refreshing API Key");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to refresh API Key",
    });
  }
};
