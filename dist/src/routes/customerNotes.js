// src/routes/customerNotes.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCustomerNotes, getCustomerNoteById, createCustomerNote, updateCustomerNote, softDeleteCustomerNote, hardDeleteCustomerNote, } from "../controllers/customerNoteController.js";
const router = Router();
// Get all notes for a specific customer
router.get("/customer/:customerId", authMiddleware, getCustomerNotes);
// Get a specific note by ID
router.get("/:id", authMiddleware, getCustomerNoteById);
// Create a new note for a customer
router.post("/customer/:customerId", authMiddleware, createCustomerNote);
// Update a note
router.put("/:id", authMiddleware, updateCustomerNote);
// Soft delete a note (PATCH)
router.patch("/:id", authMiddleware, softDeleteCustomerNote);
// Hard delete a note (DELETE)
router.delete("/:id", authMiddleware, hardDeleteCustomerNote);
export default router;
//# sourceMappingURL=customerNotes.js.map