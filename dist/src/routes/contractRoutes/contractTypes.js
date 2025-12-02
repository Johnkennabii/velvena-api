import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { hybridAuthMiddleware, requireApiKeyScope } from "../../middleware/hybridAuthMiddleware.js";
import { getContractTypes, getContractTypeById, createContractType, updateContractType, softDeleteContractType, hardDeleteContractType, } from "../../controllers/contractController/contractTypeController.js";
const router = Router();
router.get("/", hybridAuthMiddleware, requireApiKeyScope("read:contract-types"), getContractTypes);
router.get("/:id", hybridAuthMiddleware, requireApiKeyScope("read:contract-types"), getContractTypeById);
router.post("/", authMiddleware, createContractType);
router.put("/:id", authMiddleware, updateContractType);
router.patch("/:id/soft", authMiddleware, softDeleteContractType);
router.delete("/:id/hard", authMiddleware, hardDeleteContractType);
export default router;
//# sourceMappingURL=contractTypes.js.map