/**
 * Scheduler pour les jobs récurrents
 *
 * Gère l'exécution automatique des tâches planifiées :
 * - Nettoyage des trials expirés (quotidien à 2h du matin)
 * - Nettoyage des souscriptions expirées (quotidien à 2h du matin)
 * - Nettoyage des fichiers d'export (+24h) (quotidien à 2h du matin)
 */

import pino from "pino";
import { runSubscriptionMaintenanceJobs } from "./trialExpirationJob.js";
import { cleanupOldExports } from "../services/dataExportService.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// Interval de vérification : toutes les heures
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 heure en millisecondes

// Heure d'exécution quotidienne (format 24h)
const EXECUTION_HOUR = 2; // 2h du matin

// Tracker de la dernière exécution
let lastExecutionDate: Date | null = null;

/**
 * Vérifie si le job doit être exécuté maintenant
 */
function shouldExecuteJob(): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  // Si c'est l'heure d'exécution (2h du matin)
  if (currentHour !== EXECUTION_HOUR) {
    return false;
  }

  // Si déjà exécuté aujourd'hui, ne pas ré-exécuter
  if (lastExecutionDate) {
    const lastDate = lastExecutionDate.toDateString();
    const currentDate = now.toDateString();
    if (lastDate === currentDate) {
      return false;
    }
  }

  return true;
}

/**
 * Exécute les jobs de maintenance
 */
async function executeMaintenanceJobs(): Promise<void> {
  try {
    logger.info("⏰ Heure d'exécution des jobs de maintenance atteinte");

    // Run subscription maintenance jobs
    const results = await runSubscriptionMaintenanceJobs();

    // Cleanup old export files (older than 24h)
    logger.info("🗑️ Cleaning up old export files...");
    await cleanupOldExports();

    lastExecutionDate = new Date();

    logger.info(
      {
        executedAt: lastExecutionDate,
        results: {
          trials: {
            checked: results.trials.totalChecked,
            expired: results.trials.expired,
            updated: results.trials.updated,
            errors: results.trials.errors,
          },
          subscriptions: {
            checked: results.subscriptions.totalChecked,
            expired: results.subscriptions.expired,
            updated: results.subscriptions.updated,
            errors: results.subscriptions.errors,
          },
        },
      },
      "✅ Jobs de maintenance exécutés avec succès"
    );
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "❌ Erreur lors de l'exécution des jobs de maintenance"
    );
  }
}

/**
 * Démarre le scheduler
 */
export function startScheduler(): NodeJS.Timeout {
  logger.info(
    {
      checkInterval: `${CHECK_INTERVAL / 1000 / 60} minutes`,
      executionHour: `${EXECUTION_HOUR}h00`,
    },
    "🚀 Démarrage du scheduler de jobs"
  );

  // Vérifier immédiatement si on doit exécuter (au démarrage du serveur)
  if (shouldExecuteJob()) {
    logger.info("▶️ Exécution immédiate des jobs (heure d'exécution atteinte)");
    executeMaintenanceJobs();
  }

  // Configurer l'intervalle de vérification
  const intervalId = setInterval(() => {
    if (shouldExecuteJob()) {
      executeMaintenanceJobs();
    }
  }, CHECK_INTERVAL);

  logger.info("✅ Scheduler démarré et actif");

  return intervalId;
}

/**
 * Arrête le scheduler
 */
export function stopScheduler(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  logger.info("🛑 Scheduler arrêté");
}

/**
 * Retourne les informations sur le scheduler
 */
export function getSchedulerInfo() {
  return {
    checkInterval: CHECK_INTERVAL,
    executionHour: EXECUTION_HOUR,
    lastExecutionDate: lastExecutionDate,
    nextExecutionEstimate: getNextExecutionTime(),
  };
}

/**
 * Calcule la prochaine heure d'exécution estimée
 */
function getNextExecutionTime(): Date {
  const now = new Date();
  const next = new Date(now);

  // Si l'heure d'exécution est déjà passée aujourd'hui, planifier pour demain
  if (now.getHours() >= EXECUTION_HOUR) {
    next.setDate(next.getDate() + 1);
  }

  next.setHours(EXECUTION_HOUR, 0, 0, 0);

  return next;
}
