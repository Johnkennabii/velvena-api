import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { getDressConditions, createDressCondition, updateDressCondition, softDeleteDressCondition, hardDeleteDressCondition, } from "../../controllers/dressController/dressConditionController.js";
const router = Router();
router.get("/", authMiddleware, getDressConditions);
router.post("/", authMiddleware, createDressCondition);
router.put("/:id", authMiddleware, updateDressCondition);
router.patch("/:id", authMiddleware, softDeleteDressCondition);
router.delete("/:id", authMiddleware, hardDeleteDressCondition);
export default router;
//# sourceMappingURL=dressConditions.js.map