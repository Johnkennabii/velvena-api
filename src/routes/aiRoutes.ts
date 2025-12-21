import { Router } from "express";
import {
  generateCompletion,
  chat,
  listModels,
  getModelInfo,
} from "../controllers/aiController/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   POST /ai/generate
 * @desc    Generate AI completion
 * @access  Private (requires JWT)
 */
router.post("/generate", authMiddleware, generateCompletion);

/**
 * @route   POST /ai/chat
 * @desc    Chat with AI
 * @access  Private (requires JWT)
 */
router.post("/chat", authMiddleware, chat);

/**
 * @route   GET /ai/models
 * @desc    List available AI models
 * @access  Private (requires JWT)
 */
router.get("/models", authMiddleware, listModels);

/**
 * @route   GET /ai/models/:model
 * @desc    Get info about a specific AI model
 * @access  Private (requires JWT)
 */
router.get("/models/:model", authMiddleware, getModelInfo);

export default router;
