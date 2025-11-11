import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(filename: string) {
  const filePath = path.join(__dirname, filename);
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

// Importation des schémas par fonctionnalité
const getDressConditions = loadJson("./get-dress-conditions.json");
const createDressCondition = loadJson("./create-dress-condition.json");
const updateDressCondition = loadJson("./update-dress-condition.json");
const softDeleteDressCondition = loadJson("./soft-delete-dress-condition.json");
const hardDeleteDressCondition = loadJson("./hard-delete-dress-condition.json");

// Export global (fusionne tous les schémas)
export default {
  ...getDressConditions,
  ...createDressCondition,
  ...updateDressCondition,
  ...softDeleteDressCondition,
  ...hardDeleteDressCondition,
};