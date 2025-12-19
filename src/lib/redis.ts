import { Redis } from "ioredis";
import pino from "./logger.js";

/**
 * Redis client singleton pour l'application
 * Utilisé pour :
 * - Stockage des codes de validation de suppression de compte
 * - Cache de session (futur)
 * - Rate limiting (futur)
 */

let redisClient: Redis | null = null;

/**
 * Crée et configure le client Redis
 */
function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    pino.warn("⚠️ REDIS_URL non défini, Redis désactivé (utilisation du fallback Map en mémoire)");
    throw new Error("REDIS_URL not configured");
  }

  const client = new Redis(redisUrl, {
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      pino.warn(`🔄 Reconnexion Redis tentative ${times} dans ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on("connect", () => {
    pino.info("✅ Redis connecté");
  });

  client.on("ready", () => {
    pino.info("🚀 Redis prêt");
  });

  client.on("error", (err: Error) => {
    pino.error({ err }, "❌ Erreur Redis");
  });

  client.on("close", () => {
    pino.warn("⚠️ Connexion Redis fermée");
  });

  client.on("reconnecting", () => {
    pino.info("🔄 Reconnexion à Redis...");
  });

  return client;
}

/**
 * Retourne le client Redis (singleton)
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * Ferme la connexion Redis (à utiliser lors du shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    pino.info("🔌 Redis déconnecté");
  }
}

/**
 * Vérifie si Redis est disponible
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === "PONG";
  } catch (err) {
    pino.error({ err }, "❌ Redis non disponible");
    return false;
  }
}

export default getRedisClient;
