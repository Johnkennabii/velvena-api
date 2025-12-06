import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getServiceTypes, getServiceTypeById, createServiceType, updateServiceType, deleteServiceType, } from "../controllers/serviceTypeController.js";
const router = express.Router();
// All routes require authentication
router.use(authMiddleware);
/**
 * @route GET /service-types
 * @desc Get all service types (global + org-specific)
 * @access Private
 */
router.get("/", getServiceTypes);
/**
 * @route GET /service-types/:id
 * @desc Get service type by ID
 * @access Private
 */
router.get("/:id", getServiceTypeById);
/**
 * @route POST /service-types
 * @desc Create a new service type (org-specific)
 * @access Private (Admin)
 */
router.post("/", createServiceType);
/**
 * @route PUT /service-types/:id
 * @desc Update service type
 * @access Private (Admin)
 */
router.put("/:id", updateServiceType);
/**
 * @route DELETE /service-types/:id
 * @desc Delete service type (soft delete)
 * @access Private (Admin)
 */
router.delete("/:id", deleteServiceType);
export default router;
//# sourceMappingURL=serviceTypes.js.map