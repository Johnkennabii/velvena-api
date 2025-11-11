import { Router } from "express";
import { getProfiles, createProfile } from "../../controllers/userController/profileController.js";

const router = Router();

router.get("/", getProfiles);
router.post("/", createProfile);

export default router;