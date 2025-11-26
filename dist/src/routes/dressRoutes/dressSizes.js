import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { getDressSizes, createDressSize, updateDressSize, softDeleteDressSize, hardDeleteDressSize, } from "../../controllers/dressController/dressSizeController.js";
const router = Router();
router.get("/", authMiddleware, getDressSizes);
router.post("/", authMiddleware, createDressSize);
router.put("/:id", authMiddleware, updateDressSize);
router.patch("/:id", authMiddleware, softDeleteDressSize);
router.delete("/:id", authMiddleware, hardDeleteDressSize);
export default router;
//# sourceMappingURL=dressSizes.js.map