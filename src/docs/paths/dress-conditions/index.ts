import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utilitaire de chargement de fichier JSON
const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

// Importation de chaque documentation JSON
const getDressConditions = loadJson("./get-dress-conditions.json");
const createDressCondition = loadJson("./create-dress-condition.json");
const updateDressCondition = loadJson("./update-dress-condition.json");
const softDeleteDressCondition = loadJson("./soft-delete-dress-condition.json");
const hardDeleteDressCondition = loadJson("./delete-dress-condition-hard.json");

// Construction de l’objet Swagger pour les routes
const dressConditions = {
  // -------- /dress-conditions --------
  "/dress-conditions": {
    get: getDressConditions["/dress-conditions"]?.get,
    post: createDressCondition["/dress-conditions"]?.post,
  },

  // -------- /dress-conditions/{id} --------
  "/dress-conditions/{id}": {
    put: updateDressCondition["/dress-conditions/{id}"]?.put,
    patch: softDeleteDressCondition["/dress-conditions/{id}"]?.patch,
    delete: hardDeleteDressCondition["/dress-conditions/{id}"]?.delete,
  },
};

export default dressConditions;