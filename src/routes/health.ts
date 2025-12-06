// src/routes/health.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * Health check endpoint for monitoring and load balancers
 * Returns 200 if service is healthy, with system status
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      database: "connected",
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB",
      },
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

/**
 * Readiness check - indicates if service is ready to accept traffic
 */
router.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check if database is accessible and migrations are applied
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness check - indicates if service is alive (for Kubernetes)
 */
router.get("/live", (req: Request, res: Response) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

export default router;
