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

// ==========================================
// Métriques Account Deletion
// ==========================================

// Demandes de suppression de compte
export const deletionRequestsCounter = new Counter({
  name: "account_deletion_requests_total",
  help: "Total number of account deletion requests",
  labelNames: ["status", "role"], // status: success/failure, role: MANAGER/ADMIN
  registers: [register],
});

// Validations échouées
export const deletionValidationFailuresCounter = new Counter({
  name: "account_deletion_validation_failures_total",
  help: "Total number of validation code failures",
  labelNames: ["reason"], // reason: invalid_code/expired_code/permission_denied
  registers: [register],
});

// Suppressions confirmées
export const deletionConfirmedCounter = new Counter({
  name: "account_deletion_confirmed_total",
  help: "Total number of confirmed account deletions",
  labelNames: ["role"],
  registers: [register],
});

// Durée du processus de suppression
export const deletionDurationHistogram = new Histogram({
  name: "account_deletion_duration_seconds",
  help: "Duration of complete account deletion process",
  buckets: [1, 3, 5, 10, 30, 60, 120],
  registers: [register],
});

// Nombre d'enregistrements supprimés par type
export const deletionRecordsGauge = new Gauge({
  name: "account_deletion_records_deleted",
  help: "Number of records deleted by resource type",
  labelNames: ["resource_type"], // users/dresses/customers/prospects/contracts
  registers: [register],
});

// ==========================================
// Métriques Audit Logs
// ==========================================

// Logs d'audit créés
export const auditLogsCounter = new Counter({
  name: "audit_logs_created_total",
  help: "Total number of audit logs created",
  labelNames: ["action", "status"], // action: ACCOUNT_DELETION_REQUESTED/etc, status: SUCCESS/FAILURE
  registers: [register],
});

// Nombre total d'audit logs
export const auditLogsTotalGauge = new Gauge({
  name: "audit_logs_total_count",
  help: "Total number of audit logs in database",
  registers: [register],
});

// Audit logs expirés (> 7 ans)
export const auditLogsExpiredGauge = new Gauge({
  name: "audit_logs_expired_count",
  help: "Number of audit logs older than retention period (7 years)",
  registers: [register],
});

// ==========================================
// Métriques Data Export
// ==========================================

// Exports de données
export const dataExportsCounter = new Counter({
  name: "data_exports_total",
  help: "Total number of data exports",
  labelNames: ["status"], // success/failure
  registers: [register],
});

// Taille des fichiers d'export
export const exportFileSizeHistogram = new Histogram({
  name: "export_file_size_bytes",
  help: "Size of exported data files in bytes",
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600], // 1KB, 10KB, 100KB, 1MB, 10MB, 100MB
  registers: [register],
});

// Durée des exports
export const exportDurationHistogram = new Histogram({
  name: "export_duration_seconds",
  help: "Duration of data export process",
  buckets: [1, 5, 10, 30, 60, 120],
  registers: [register],
});

// ==========================================
// Métriques Email
// ==========================================

// Emails envoyés
export const emailsSentCounter = new Counter({
  name: "emails_sent_total",
  help: "Total number of emails sent",
  labelNames: ["type", "status"], // type: validation/confirmation, status: success/failure
  registers: [register],
});

// Temps d'envoi d'email
export const emailSendDurationHistogram = new Histogram({
  name: "email_send_duration_seconds",
  help: "Duration of email sending process",
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// ==========================================
// Métriques Email Verification
// ==========================================

// Emails de vérification envoyés
export const emailVerificationSentCounter = new Counter({
  name: "email_verification_sent_total",
  help: "Total number of verification emails sent",
  labelNames: ["status"], // status: success/failure
  registers: [register],
});

// Vérifications d'email réussies
export const emailVerifiedCounter = new Counter({
  name: "email_verified_total",
  help: "Total number of successful email verifications",
  registers: [register],
});

// Vérifications d'email échouées
export const emailVerificationFailedCounter = new Counter({
  name: "email_verification_failed_total",
  help: "Total number of failed email verifications",
  labelNames: ["reason"], // reason: invalid_token/expired_token/already_verified
  registers: [register],
});

// Renvois d'email de vérification
export const emailVerificationResendCounter = new Counter({
  name: "email_verification_resend_total",
  help: "Total number of verification email resends",
  labelNames: ["status"], // status: success/failure
  registers: [register],
});

// ==========================================
// Métriques AI (Ollama)
// ==========================================

// Requêtes AI
export const aiRequestCounter = new Counter({
  name: "ai_requests_total",
  help: "Total number of AI requests",
  labelNames: ["status", "model"], // status: success/error, model: nom du modèle
  registers: [register],
});

// Durée des requêtes AI
export const aiRequestDuration = new Histogram({
  name: "ai_request_duration_seconds",
  help: "Duration of AI requests in seconds",
  labelNames: ["model"],
  buckets: [0.5, 1, 2, 5, 10, 30, 60, 120], // En secondes
  registers: [register],
});

// ==========================================
// Métriques Redis
// ==========================================

// Opérations Redis
export const redisOperationsCounter = new Counter({
  name: "redis_operations_total",
  help: "Total number of Redis operations",
  labelNames: ["operation", "status"], // operation: get/set/del, status: success/failure
  registers: [register],
});
