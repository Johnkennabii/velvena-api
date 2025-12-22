/**
 * Test manual subscription sync
 */

import dotenv from "dotenv";
dotenv.config();

import { syncSubscription } from "../src/services/stripeService.js";
import pino from "pino";

const logger = pino({
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
});

async function testSync() {
  const subscriptionId = process.argv[2] || "sub_1ShCOORJ7PlLrfUPhG2A4d9F";

  logger.info({ subscriptionId }, "Testing subscription sync");

  try {
    const result = await syncSubscription(subscriptionId);
    logger.info({ result }, "✅ Sync completed");
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, "❌ Sync failed");
  }

  process.exit(0);
}

testSync();
