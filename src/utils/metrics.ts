import { Registry, Counter, Histogram, Gauge } from "prom-client";

// Créer un registre pour nos métriques
export const register = new Registry();

// Métriques par défaut (CPU, mémoire, etc.)
import { collectDefaultMetrics } from "prom-client";
collectDefaultMetrics({ register });

// ==========================================
// Métriques HTTP
// ==========================================

// Compteur de requêtes HTTP
export const httpRequestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Durée des requêtes HTTP (histogramme pour p95, p99)
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10], // Buckets en secondes
  registers: [register],
});

// ==========================================
// Métriques Base de données
// ==========================================

// Connexions actives à la base de données
export const dbConnectionsActive = new Gauge({
  name: "db_connections_active",
  help: "Number of active database connections",
  registers: [register],
});

// Durée des requêtes DB
export const dbQueryDuration = new Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

// ==========================================
// Métriques Business
// ==========================================

// Utilisateurs actifs
export const activeUsers = new Gauge({
  name: "active_users_total",
  help: "Total number of active users",
  registers: [register],
});

// Contrats créés
export const contractsCreated = new Counter({
  name: "contracts_created_total",
  help: "Total number of contracts created",
  registers: [register],
});

// Robes disponibles
export const dressesAvailable = new Gauge({
  name: "dresses_available_total",
  help: "Total number of available dresses",
  registers: [register],
});

// ==========================================
// Métriques Socket.IO
// ==========================================

// Connexions WebSocket actives
export const websocketConnections = new Gauge({
  name: "websocket_connections_active",
  help: "Number of active WebSocket connections",
  registers: [register],
});

// Messages WebSocket
export const websocketMessages = new Counter({
  name: "websocket_messages_total",
  help: "Total number of WebSocket messages",
  labelNames: ["event"],
  registers: [register],
});
