// src/routes/customers.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCustomers, getCustomerById, createCustomer, updateCustomer, softDeleteCustomer, hardDeleteCustomer, } from "../controllers/customerController.js";
const router = Router();
// Récupérer tous les clients (JWT uniquement)
router.get("/", authMiddleware, getCustomers);
// Récupérer un client par ID (JWT uniquement)
router.get("/:id", authMiddleware, getCustomerById);
// Créer un nouveau client (JWT uniquement)
router.post("/", authMiddleware, createCustomer);
// Mettre à jour un client (JWT uniquement)
router.put("/:id", authMiddleware, updateCustomer);
// Soft delete (JWT uniquement)
router.patch("/:id", authMiddleware, softDeleteCustomer);
// Hard delete (JWT uniquement)
router.delete("/:id", authMiddleware, hardDeleteCustomer);
export default router;
//# sourceMappingURL=customers.js.map