/**
 * Load environment variables before any other imports
 */
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (optional in Docker environments)
const result = config({ path: join(__dirname, "..", ".env") });

if (result.error) {
  // In Docker, .env file might not exist - that's OK if env vars are set via docker-compose
  console.warn("⚠️  .env file not found (this is normal in Docker environments)");
  console.warn("📦 Using environment variables from docker-compose or system");
}

// Verify that Stripe keys are loaded
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY not found in environment variables");
  console.error("📁 Looking for .env file at:", join(__dirname, "..", ".env"));
  process.exit(1);
}

console.log("✅ Environment variables loaded successfully");
console.log(`🔑 Stripe secret key: ${process.env.STRIPE_SECRET_KEY?.substring(0, 20)}...`);
