import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Utility function to load and parse a JSON schema file
 */
function loadJson(filename: string) {
  const filePath = path.join(__dirname, filename);
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

/**
 * Load all dress-type schema JSON files
 */
const getDressTypes = loadJson("./get-dress-types.json");
const createDressType = loadJson("./create-dress-type.json");
const updateDressType = loadJson("./update-dress-type.json");
const softDeleteDressType = loadJson("./soft-delete-dress-type.json");
const hardDeleteDressType = loadJson("./delete-dress-type-hard.json");

/**
 * Optionally shared schema (for consistent error responses)
 */
let errorResponse = {};
try {
  errorResponse = loadJson("../shared/error-response.json");
} catch {
  // Optional: silently skip if not present
}

/**
 * Combine and export all schemas
 */
export default {
  ...getDressTypes,
  ...createDressType,
  ...updateDressType,
  ...softDeleteDressType,
  ...hardDeleteDressType,
  ...errorResponse,
};