import { Router } from "express";
import type { Request, Response } from "express";
import { register } from "../utils/metrics.js";

const router = Router();

/**
 * GET /metrics
 * Expose Prometheus metrics
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send("Error generating metrics");
  }
});

export default router;
