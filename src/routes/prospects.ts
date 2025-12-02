// src/routes/prospects.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { hybridAuthMiddleware, requireApiKeyScope } from "../middleware/hybridAuthMiddleware.js";
import {
  getProspects,
  getProspectById,
  createProspect,
  updateProspect,
  softDeleteProspect,
  hardDeleteProspect,
  convertProspectToCustomer,
} from "../controllers/prospectController.js";
import {
  addDressReservations,
  getProspectReservations,
  updateReservation,
  deleteReservation,
} from "../controllers/prospectDressReservationController.js";

const router = Router();

// Récupérer tous les prospects (JWT ou API Key)
router.get("/", hybridAuthMiddleware, requireApiKeyScope("read:prospects"), getProspects);

// Récupérer un prospect par ID (JWT ou API Key)
router.get("/:id", hybridAuthMiddleware, requireApiKeyScope("read:prospects"), getProspectById);

// Créer un nouveau prospect (JWT ou API Key)
router.post("/", hybridAuthMiddleware, requireApiKeyScope("write:prospects"), createProspect);

// Mettre à jour un prospect (JWT ou API Key)
router.put("/:id", hybridAuthMiddleware, requireApiKeyScope("write:prospects"), updateProspect);

// Soft delete (JWT uniquement pour sécurité)
router.patch("/:id", authMiddleware, softDeleteProspect);

// Hard delete (JWT uniquement pour sécurité)
router.delete("/:id", authMiddleware, hardDeleteProspect);

// Convert prospect to customer (JWT uniquement)
router.post("/:id/convert", authMiddleware, convertProspectToCustomer);

// ==================== DRESS RESERVATIONS ====================

// Ajouter des réservations de robes pour un prospect (JWT ou API Key)
router.post(
  "/:prospectId/dress-reservations",
  hybridAuthMiddleware,
  requireApiKeyScope("write:prospects"),
  addDressReservations
);

// Obtenir les réservations d'un prospect (JWT ou API Key)
router.get(
  "/:prospectId/dress-reservations",
  hybridAuthMiddleware,
  requireApiKeyScope("read:prospects"),
  getProspectReservations
);

// Mettre à jour une réservation (JWT ou API Key)
router.put(
  "/:prospectId/dress-reservations/:reservationId",
  hybridAuthMiddleware,
  requireApiKeyScope("write:prospects"),
  updateReservation
);

// Supprimer une réservation (JWT uniquement)
router.delete(
  "/:prospectId/dress-reservations/:reservationId",
  authMiddleware,
  deleteReservation
);

export default router;
