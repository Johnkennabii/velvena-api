// src/routes/apiKeys.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  generateApiKey,
  listApiKeys,
  getApiKeyById,
  revokeApiKey,
  refreshApiKey,
} from "../controllers/apiKeyController.js";

const router = Router();

// Toutes les routes nécessitent une authentification utilisateur (JWT)
// Seuls les admins peuvent gérer les API keys

// Générer une nouvelle API Key
router.post("/", authMiddleware, generateApiKey);

// Lister toutes les API Keys
router.get("/", authMiddleware, listApiKeys);

// Obtenir une API Key par ID
router.get("/:id", authMiddleware, getApiKeyById);

// Refresh (renouveler) une API Key - génère une nouvelle clé et révoque l'ancienne
router.post("/:id/refresh", authMiddleware, refreshApiKey);

// Révoquer une API Key
router.delete("/:id", authMiddleware, revokeApiKey);

export default router;
