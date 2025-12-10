/**
 * Load environment variables before any other imports
 */
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const result = config({ path: join(__dirname, "..", ".env") });

if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
  process.exit(1);
}

// Verify that Stripe keys are loaded
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY not found in environment variables");
  console.error("📁 Looking for .env file at:", join(__dirname, "..", ".env"));
  process.exit(1);
}

console.log("✅ Environment variables loaded successfully");
console.log(`🔑 Stripe secret key: ${process.env.STRIPE_SECRET_KEY?.substring(0, 20)}...`);
