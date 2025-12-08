// src/routes/customers.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { organizationContextMiddleware } from "../middleware/organizationContextMiddleware.js";
import { requireQuota } from "../middleware/subscriptionMiddleware.js";
import { getCustomers, getCustomerById, createCustomer, updateCustomer, softDeleteCustomer, hardDeleteCustomer, } from "../controllers/customerController.js";
const router = Router();
// Apply authentication and organization context to all routes
router.use(authMiddleware);
router.use(organizationContextMiddleware); // ✅ SUPER_ADMIN can use X-Organization-Slug header
// Récupérer tous les clients
router.get("/", getCustomers);
// Récupérer un client par ID
router.get("/:id", getCustomerById);
// Créer un nouveau client (avec quota check)
router.post("/", requireQuota("customers"), createCustomer);
// Mettre à jour un client
router.put("/:id", updateCustomer);
// Soft delete
router.patch("/:id", softDeleteCustomer);
// Hard delete
router.delete("/:id", hardDeleteCustomer);
export default router;
//# sourceMappingURL=customers.js.map