// src/routes/prospects.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getProspects,
  getProspectById,
  createProspect,
  updateProspect,
  softDeleteProspect,
  hardDeleteProspect,
  convertProspectToCustomer,
  checkExistingClient,
  getMergePreview,
  mergeWithClient,
} from "../controllers/prospectController.js";
import {
  addDressReservations,
  getProspectReservations,
  updateReservation,
  deleteReservation,
} from "../controllers/prospectDressReservationController.js";
import {
  createProspectRequest,
  getProspectRequests,
  getProspectRequestById,
  updateProspectRequest,
  deleteProspectRequest,
} from "../controllers/prospectRequestController.js";
import {
  getProspectNotes,
  getProspectNoteById,
  createProspectNote,
  updateProspectNote,
  softDeleteProspectNote,
  hardDeleteProspectNote,
} from "../controllers/prospectNoteController.js";

const router = Router();

// ==================== ROUTES STATIQUES (AVANT LES ROUTES DYNAMIQUES) ====================

// Vérifier si un email existe comme client (JWT ou API Key)
router.get("/check-client", authMiddleware, checkExistingClient);

// ==================== ROUTES PRINCIPALES ====================

// Récupérer tous les prospects (JWT ou API Key)
router.get("/", authMiddleware, getProspects);

// Créer un nouveau prospect (JWT ou API Key)
router.post("/", authMiddleware, createProspect);

// ==================== ROUTES AVEC PATTERNS SPÉCIFIQUES ====================

// Aperçu de la fusion (JWT ou API Key)
router.get("/:prospectId/merge-preview", authMiddleware, getMergePreview);

// Fusionner prospect avec client existant (JWT uniquement)
router.post("/:prospectId/merge-with-client", authMiddleware, mergeWithClient);

// Convert prospect to customer (JWT uniquement)
router.post("/:id/convert", authMiddleware, convertProspectToCustomer);

// ==================== ROUTES GÉNÉRIQUES (APRÈS LES ROUTES SPÉCIFIQUES) ====================

// Récupérer un prospect par ID (JWT ou API Key)
router.get("/:id", authMiddleware, getProspectById);

// Mettre à jour un prospect (JWT ou API Key)
router.put("/:id", authMiddleware, updateProspect);

// Soft delete (JWT uniquement pour sécurité)
router.patch("/:id", authMiddleware, softDeleteProspect);

// Hard delete (JWT uniquement pour sécurité)
router.delete("/:id", authMiddleware, hardDeleteProspect);

// ==================== DRESS RESERVATIONS ====================

// Ajouter des réservations de robes pour un prospect (JWT ou API Key)
router.post(
  "/:prospectId/dress-reservations",
  authMiddleware,
  addDressReservations
);

// Obtenir les réservations d'un prospect (JWT ou API Key)
router.get(
  "/:prospectId/dress-reservations",
  authMiddleware,
  getProspectReservations
);

// Mettre à jour une réservation (JWT ou API Key)
router.put(
  "/:prospectId/dress-reservations/:reservationId",
  authMiddleware,
  updateReservation
);

// Supprimer une réservation (JWT uniquement)
router.delete(
  "/:prospectId/dress-reservations/:reservationId",
  authMiddleware,
  deleteReservation
);

// ==================== PROSPECT REQUESTS (DEMANDES) ====================

// Créer une nouvelle demande pour un prospect (JWT ou API Key)
router.post(
  "/:prospectId/requests",
  authMiddleware,
  createProspectRequest
);

// Obtenir toutes les demandes d'un prospect (JWT ou API Key)
router.get(
  "/:prospectId/requests",
  authMiddleware,
  getProspectRequests
);

// Obtenir une demande spécifique (JWT ou API Key)
router.get(
  "/:prospectId/requests/:requestId",
  authMiddleware,
  getProspectRequestById
);

// Mettre à jour une demande (JWT ou API Key)
router.patch(
  "/:prospectId/requests/:requestId",
  authMiddleware,
  updateProspectRequest
);

// Supprimer une demande (JWT uniquement)
router.delete(
  "/:prospectId/requests/:requestId",
  authMiddleware,
  deleteProspectRequest
);

// ==================== PROSPECT NOTES ====================

// Obtenir toutes les notes d'un prospect (JWT ou API Key)
router.get(
  "/:prospectId/notes",
  authMiddleware,
  getProspectNotes
);

// Obtenir une note spécifique (JWT ou API Key)
router.get(
  "/notes/:id",
  authMiddleware,
  getProspectNoteById
);

// Créer une nouvelle note pour un prospect (JWT ou API Key)
router.post(
  "/:prospectId/notes",
  authMiddleware,
  createProspectNote
);

// Mettre à jour une note (JWT ou API Key)
router.put(
  "/notes/:id",
  authMiddleware,
  updateProspectNote
);

// Soft delete d'une note (JWT uniquement)
router.patch(
  "/notes/:id",
  authMiddleware,
  softDeleteProspectNote
);

// Hard delete d'une note (JWT uniquement)
router.delete(
  "/notes/:id",
  authMiddleware,
  hardDeleteProspectNote
);

export default router;
