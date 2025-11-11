// src/routes/customers.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  hardDeleteCustomer,
} from "../controllers/customerController.js";

const router = Router();

// Récupérer tous les clients
router.get("/", authMiddleware, getCustomers);

// Récupérer un client par ID
router.get("/:id", authMiddleware, getCustomerById);

// Créer un nouveau client
router.post("/", authMiddleware, createCustomer);

// Mettre à jour un client
router.put("/:id", authMiddleware, updateCustomer);

// Soft delete (PATCH)
router.patch("/:id", authMiddleware, softDeleteCustomer);

// Hard delete (DELETE)
router.delete("/:id", authMiddleware, hardDeleteCustomer);

export default router;