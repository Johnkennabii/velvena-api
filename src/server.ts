import pinoHttp from "pino-http";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger.js";
import { createServer } from "http"; // ⚠️ important
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma.js";
import pino from "./lib/logger.js";

import authRoutes from "./routes/userRoutes/auth.js";
import usersRoutes from "./routes/userRoutes/users.js";
import profilesRoutes from "./routes/userRoutes/profiles.js";
import rolesRoutes from "./routes/userRoutes/roles.js";

import organizationRoutes from "./routes/organizations.js";
import pricingRuleRoutes from "./routes/pricingRules.js";

import avatarRoutes from "./routes/bucketRoutes/avatar.js";
import dressStorage from "./routes/bucketRoutes/dressStorageRoutes.js";

import dressTypesRoutes from "./routes/dressRoutes/dressTypes.js";
import dressSizesRoutes from "./routes/dressRoutes/dressSizes.js";
import dressColorsRoutes from "./routes/dressRoutes/dressColors.js";
import dressConditionsRoutes from "./routes/dressRoutes/dressConditions.js";
import dressesRoutes from "./routes/dressRoutes/dresses.js";
import dressesAvailabilityRoutes from "./routes/dressRoutes/dresses.js";

import customerRoutes from "./routes/customers.js";
import customerNotesRoutes from "./routes/customerNotes.js";
import prospectRoutes from "./routes/prospects.js";

import contractTypesRoutes from "./routes/contractRoutes/contractTypes.js";
import contractAddonsRoutes from "./routes/contractRoutes/contractAddons.js";
import contractPackagesRoutes from "./routes/contractRoutes/contractPackages.js";
import contractTemplateRoutes from "./routes/contractTemplateRoutes.js";
import contractsRoutes from "./routes/contractRoutes/contractRoutes.js";
import contractsFullViewRoutes from "./routes/contractRoutes/contractRoutes.js";
import pocTemplateRoutes from "./routes/pocTemplateRoutes.js";

import notificationRoute from "./routes/notifications.js";
import mailRoutes from "./routes/mailRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import apiKeyRoutes from "./routes/apiKeys.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import healthRoutes from "./routes/health.js";
import billingRoutes from "./routes/billing.js";
import metricsRoutes from "./routes/metrics.js";
import stripeWebhooksRoutes from "./routes/stripe-webhooks.js";
import accountDeletionRoutes from "./routes/accountDeletionRoutes.js";
import dataExportRoutes from "./routes/dataExportRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import calendlyRoutes from "./routes/calendly.js";

import {
  getContractSignLink,
  signContractViaLink,
} from "./controllers/contractController/contractController.js";

import { oauthCallback as calendlyOAuthCallback } from "./controllers/calendlyController.js";
import authMiddleware from "./middleware/authMiddleware.js";

import { requireActiveSubscription } from "./middleware/subscriptionMiddleware.js";
import { startScheduler, stopScheduler } from "./jobs/scheduler.js";

// 🧩 1️⃣ Création de ton app Express
const app = express();

// 🧩 2️⃣ Création du serveur HTTP à partir de Express
const server = createServer(app); // ✅ ici on crée "server"

// 🧩 3️⃣ Création de Socket.IO relié à ce serveur
export const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://127.0.0.1:4174",
      "http://127.0.0.1:4173",
      "http://localhost:5174",
      "http://localhost:5173",
      "https://velvena.fr",
      "https://app.velvena.fr",
      "https://api.velvena.fr",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  },
});

// ✅ 4️⃣ Middleware d'authentification Socket.IO
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
  organizationId?: string;
}

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      pino.warn("❌ Socket.IO: Missing token");
      return next(new Error("Authentication error: Missing token"));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Fetch user with organization
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        organization_id: true,
        profile: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      pino.warn({ userId: decoded.id }, "❌ Socket.IO: User not found");
      return next(new Error("Authentication error: User not found"));
    }

    if (!user.organization_id) {
      pino.error({ userId: user.id }, "❌ Socket.IO: User has no organization");
      return next(new Error("Authentication error: User not assigned to organization"));
    }

    // Store user data in socket
    (socket as any).userId = user.id;
    (socket as any).userEmail = user.email;
    (socket as any).userRole = user.profile?.role?.name;
    (socket as any).organizationId = user.organization_id;

    pino.info(
      { userId: user.id, organizationId: user.organization_id, socketId: socket.id },
      "✅ Socket.IO: User authenticated"
    );

    next();
  } catch (err) {
    pino.error({ err }, "❌ Socket.IO: Authentication failed");
    return next(new Error("Authentication error: Invalid token"));
  }
});

// ✅ 5️⃣ Gestion des connexions Socket.IO avec rooms par organisation
io.on("connection", (socket) => {
  const organizationId = (socket as any).organizationId;
  const userId = (socket as any).userId;

  // Rejoindre la room de l'organisation
  socket.join(`org:${organizationId}`);

  pino.info(
    { socketId: socket.id, userId, organizationId },
    `🟢 Socket.IO: User joined organization room org:${organizationId}`
  );

  socket.on("disconnect", () => {
    pino.info(
      { socketId: socket.id, userId, organizationId },
      "🔴 Socket.IO: User disconnected"
    );
  });
});

// ✅ Middleware globaux
app.use(
  cors({
    origin: [
      "http://127.0.0.1:4174",
      "http://127.0.0.1:4173",
      "http://127.0.0.1:3000",
      "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3001",
      "http://192.168.1.17:3000",
      "http://192.168.1.17:3001",
      "http://localhost:3000",
      "https://velvena.fr",
      "https://www.velvena.fr",
      "https://app.velvena.fr",
      "https://api.velvena.fr",
    ],
    credentials: true,
  })
);

// ✅ Stripe Webhooks route MUST come BEFORE express.json()
// Stripe needs raw body for signature verification
app.use(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooksRoutes
);

import { httpRequestCounter, httpRequestDuration } from "./utils/metrics.js";

app.use(express.json());
app.use(pinoHttp());

// ✅ Middleware pour vérifier l'expiration du trial sur routes protégées
// Routes publiques exemptées : auth, billing, organizations/initialize, sign-links, health, metrics, webhooks
const publicRoutes = [
  '/auth',
  '/billing',
  '/organizations/initialize',
  '/sign-links',
  '/health',
  '/metrics',
  '/webhooks',
  '/calendly/webhook',
  '/api-docs',
  '/'
];

app.use(async (req, res, next) => {
  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

  if (isPublicRoute) {
    return next();
  }

  // Si l'utilisateur est authentifié (authMiddleware déjà appliqué dans les routes),
  // vérifier l'expiration du trial
  if ((req as any).user) {
    return requireActiveSubscription(req as any, res, next);
  }

  // Pas authentifié, laisser authMiddleware des routes individuelles gérer
  next();
});

// ✅ Middleware Prometheus - Collecter les métriques HTTP
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // Convertir en secondes
    const route = req.route?.path || req.path || "unknown";
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Incrémenter le compteur de requêtes
    httpRequestCounter.inc({ method, route, status_code: statusCode });

    // Enregistrer la durée
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  });

  next();
});

// ✅ Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  })
);

// ✅ Routes API
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/profiles", profilesRoutes);
app.use("/roles", rolesRoutes);

app.use("/organizations", organizationRoutes);
app.use("/pricing-rules", pricingRuleRoutes);

app.use("/avatars", avatarRoutes);
app.use("/dress-storage", dressStorage);

app.use("/dress-types", dressTypesRoutes);
app.use("/dress-sizes", dressSizesRoutes);
app.use("/dress-colors", dressColorsRoutes);
app.use("/dress-conditions", dressConditionsRoutes);
app.use("/dresses", dressesRoutes);
app.use("/dresses-availability", dressesAvailabilityRoutes);

app.use("/customers", customerRoutes);
app.use("/customer-notes", customerNotesRoutes);
app.use("/prospects", prospectRoutes);
app.use("/api/prospects", prospectRoutes); // Alias pour compatibilité avec les nouveaux endpoints

app.use("/contract-types", contractTypesRoutes);
app.use("/contract-addons", contractAddonsRoutes);
app.use("/contract-packages", contractPackagesRoutes);
app.use("/contract-templates", contractTemplateRoutes);
app.use("/contracts", contractsRoutes);
app.use("/contracts/full-view", contractsFullViewRoutes);

// ✅ POC Routes - Unified Template System
app.use("/poc/template", pocTemplateRoutes);

// ✅ Routes publiques (signature électronique)
app.get("/sign-links/:token", getContractSignLink);
app.post("/sign-links/:token/sign", signContractViaLink);

app.use("/notifications", notificationRoute);
app.use("/mails", mailRoutes);
app.use("/emails", emailRoutes);
app.use("/api-keys", apiKeyRoutes);
app.use("/api", maintenanceRoutes);
app.use("/billing", billingRoutes);
app.use("/account", accountDeletionRoutes);
app.use("/data-export", dataExportRoutes);
app.use("/ai", aiRoutes);
app.use("/calendly", calendlyRoutes);

// Alias Calendly OAuth callback pour compatibilité frontend
// Le frontend appelle /auth/calendly/callback au lieu de /calendly/oauth/callback
app.post("/auth/calendly/callback", authMiddleware, calendlyOAuthCallback);

// Health check routes (no auth required)
app.use(healthRoutes);

// Prometheus metrics endpoint (no auth required)
app.use("/metrics", metricsRoutes);

// ✅ Route racine
app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "Velvena API is running 🚀" });
});

// ✅ Gestion des erreurs globales
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error("🔥 Internal Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 🟢 5️⃣ Lancer le serveur
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces (requis pour Docker)

// Variable pour stocker l'ID du scheduler
let schedulerIntervalId: NodeJS.Timeout | null = null;

server.listen(PORT, HOST, () => {
  console.log(`🚀 API + Socket.IO running on http://${HOST}:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://${HOST}:${PORT}/health`);

  // Démarrer le scheduler des jobs de maintenance
  schedulerIntervalId = startScheduler();
  console.log(`⏰ Scheduler de maintenance démarré (exécution quotidienne à 2h00)`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt gracieux du serveur...');
  if (schedulerIntervalId) {
    stopScheduler(schedulerIntervalId);
  }
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT reçu, arrêt gracieux du serveur...');
  if (schedulerIntervalId) {
    stopScheduler(schedulerIntervalId);
  }
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});
