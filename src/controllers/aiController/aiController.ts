import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
import logger from "../../lib/logger.js";
import { aiRequestCounter, aiRequestDuration } from "../../utils/metrics.js";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://ollama:11434";

/**
 * Generate AI completion
 * POST /ai/generate
 */
export const generateCompletion = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const startTime = Date.now();

  try {
    const { model, prompt, stream = false } = req.body;

    if (!model || !prompt) {
      aiRequestCounter.inc({ status: "error", model: model || "unknown" });
      return res.status(400).json({
        error: "model and prompt are required"
      });
    }

    logger.info(
      {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        model,
        promptLength: prompt.length,
      },
      "AI completion request"
    );

    // Proxy request to Ollama
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      logger.error(
        {
          status: ollamaResponse.status,
          error: errorText,
        },
        "Ollama API error"
      );

      aiRequestCounter.inc({ status: "error", model });
      return res.status(ollamaResponse.status).json({
        error: "AI service error",
        details: errorText,
      });
    }

    if (stream) {
      // Stream response
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Transfer-Encoding", "chunked");

      const reader = ollamaResponse.body?.getReader();
      if (!reader) {
        return res.status(500).json({ error: "Failed to get response stream" });
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }

      res.end();
    } else {
      // Non-streaming response
      const data = await ollamaResponse.json();
      res.json(data);
    }

    const duration = Date.now() - startTime;
    aiRequestCounter.inc({ status: "success", model });
    aiRequestDuration.observe({ model }, duration / 1000);

    logger.info(
      {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        model,
        duration,
      },
      "AI completion completed"
    );
  } catch (err: any) {
    const duration = Date.now() - startTime;
    aiRequestCounter.inc({ status: "error", model: req.body.model || "unknown" });
    aiRequestDuration.observe({ model: req.body.model || "unknown" }, duration / 1000);

    logger.error({ err }, "AI completion error");
    res.status(500).json({ error: "Failed to generate AI completion" });
  }
};

/**
 * Chat with AI
 * POST /ai/chat
 */
export const chat = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const { model, messages, stream = false } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      aiRequestCounter.inc({ status: "error", model: model || "unknown" });
      return res.status(400).json({
        error: "model and messages array are required",
      });
    }

    logger.info(
      {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        model,
        messagesCount: messages.length,
      },
      "AI chat request"
    );

    // Proxy request to Ollama
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      logger.error(
        {
          status: ollamaResponse.status,
          error: errorText,
        },
        "Ollama API error"
      );

      aiRequestCounter.inc({ status: "error", model });
      return res.status(ollamaResponse.status).json({
        error: "AI service error",
        details: errorText,
      });
    }

    if (stream) {
      // Stream response
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Transfer-Encoding", "chunked");

      const reader = ollamaResponse.body?.getReader();
      if (!reader) {
        return res.status(500).json({ error: "Failed to get response stream" });
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }

      res.end();
    } else {
      // Non-streaming response
      const data = await ollamaResponse.json();
      res.json(data);
    }

    const duration = Date.now() - startTime;
    aiRequestCounter.inc({ status: "success", model });
    aiRequestDuration.observe({ model }, duration / 1000);

    logger.info(
      {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        model,
        duration,
      },
      "AI chat completed"
    );
  } catch (err: any) {
    const duration = Date.now() - startTime;
    aiRequestCounter.inc({ status: "error", model: req.body.model || "unknown" });
    aiRequestDuration.observe({ model: req.body.model || "unknown" }, duration / 1000);

    logger.error({ err }, "AI chat error");
    res.status(500).json({ error: "Failed to process chat request" });
  }
};

/**
 * List available models
 * GET /ai/models
 */
export const listModels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      logger.error(
        {
          status: ollamaResponse.status,
          error: errorText,
        },
        "Ollama API error"
      );
      return res.status(ollamaResponse.status).json({
        error: "AI service error",
        details: errorText,
      });
    }

    const data = await ollamaResponse.json();
    res.json(data);
  } catch (err: any) {
    logger.error({ err }, "Failed to list AI models");
    res.status(500).json({ error: "Failed to list AI models" });
  }
};

/**
 * Get model info
 * GET /ai/models/:model
 */
export const getModelInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { model } = req.params;

    if (!model) {
      return res.status(400).json({ error: "model parameter is required" });
    }

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: model }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      logger.error(
        {
          status: ollamaResponse.status,
          error: errorText,
        },
        "Ollama API error"
      );
      return res.status(ollamaResponse.status).json({
        error: "AI service error",
        details: errorText,
      });
    }

    const data = await ollamaResponse.json();
    res.json(data);
  } catch (err: any) {
    logger.error({ err }, "Failed to get model info");
    res.status(500).json({ error: "Failed to get model info" });
  }
};
