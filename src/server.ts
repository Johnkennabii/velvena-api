import pinoHttp from "pino-http";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger.js";
import { createServer } from "http"; // ⚠️ important
import { Server as SocketIOServer } from "socket.io";

import authRoutes from "./routes/userRoutes/auth.js";
import usersRoutes from "./routes/userRoutes/users.js";
import profilesRoutes from "./routes/userRoutes/profiles.js";
import rolesRoutes from "./routes/userRoutes/roles.js";

import avatarRoutes from "./routes/bucketRoutes/avatar.js";
import dressStorage from "./routes/bucketRoutes/dressStorageRoutes.js";

import dressTypesRoutes from "./routes/dressRoutes/dressTypes.js";
import dressSizesRoutes from "./routes/dressRoutes/dressSizes.js";
import dressColorsRoutes from "./routes/dressRoutes/dressColors.js";
import dressConditionsRoutes from "./routes/dressRoutes/dressConditions.js";
import dressesRoutes from "./routes/dressRoutes/dresses.js";
import dressesAvailabilityRoutes from "./routes/dressRoutes/dresses.js";

import customerRoutes from "./routes/customers.js";

import contractTypesRoutes from "./routes/contractRoutes/contractTypes.js";
import contractAddonsRoutes from "./routes/contractRoutes/contractAddons.js";
import contractPackagesRoutes from "./routes/contractRoutes/contractPackages.js";
import contractsRoutes from "./routes/contractRoutes/contractRoutes.js";
import contractsFullViewRoutes from "./routes/contractRoutes/contractRoutes.js";

import notificationRoute from "./routes/notifications.js";
import mailRoutes from "./routes/mailRoutes.js";

import {
  getContractSignLink,
  signContractViaLink,
} from "./controllers/contractController/contractController.js";

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
      "https://allure-creation.fr",
      "https://app.allure-creation.fr",
      "https://api.allure-creation.fr",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  },
});

// ✅ 4️⃣ Gestion des connexions Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Nouvelle connexion Socket.IO :", socket.id);
  socket.on("disconnect", () => console.log("🔴 Déconnexion :", socket.id));
});

// ✅ Middleware globaux
app.use(
  cors({
    origin: [
      "http://127.0.0.1:4174",
      "http://127.0.0.1:4173",
      "http://localhost:5174",
      "http://localhost:5173",
      "https://allure-creation.fr",
      "https://app.allure-creation.fr",
      "https://api.allure-creation.fr",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(pinoHttp());

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

app.use("/avatars", avatarRoutes);
app.use("/dress-storage", dressStorage);

app.use("/dress-types", dressTypesRoutes);
app.use("/dress-sizes", dressSizesRoutes);
app.use("/dress-colors", dressColorsRoutes);
app.use("/dress-conditions", dressConditionsRoutes);
app.use("/dresses", dressesRoutes);
app.use("/dresses-availability", dressesAvailabilityRoutes);

app.use("/customers", customerRoutes);

app.use("/contract-types", contractTypesRoutes);
app.use("/contract-addons", contractAddonsRoutes);
app.use("/contract-packages", contractPackagesRoutes);
app.use("/contracts", contractsRoutes);
app.use("/contracts/full-view", contractsFullViewRoutes);

// ✅ Routes publiques (signature électronique)
app.get("/sign-links/:token", getContractSignLink);
app.post("/sign-links/:token/sign", signContractViaLink);

app.use("/notifications", notificationRoute);
app.use("/mails", mailRoutes);

// ✅ Route racine
app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "Allure Creation API is running 🚀" });
});

// ✅ Gestion des erreurs globales
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error("🔥 Internal Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 🟢 5️⃣ Lancer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 API + Socket.IO running on http://localhost:${PORT}`);
});