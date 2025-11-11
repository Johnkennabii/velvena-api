import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// utilitaire de chargement JSON
const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

// chargement des fichiers JSON
const getDressSizes = loadJson("./get-dress-sizes.json");
const createDressSize = loadJson("./create-dress-size.json");
const updateDressSize = loadJson("./update-dress-size.json");
const softDeleteDressSize = loadJson("./soft-delete-dress-size.json");
const hardDeleteDressSize = loadJson("./delete-dress-size-hard.json");

// construction de l’objet Swagger
const dressSizes = {
  // -------- /dress-sizes --------
  "/dress-sizes": {
    get: getDressSizes["/dress-sizes"]?.get,
    post: createDressSize["/dress-sizes"]?.post,
  },

  // -------- /dress-sizes/{id} --------
  "/dress-sizes/{id}": {
    put: updateDressSize["/dress-sizes/{id}"]?.put,
    patch: softDeleteDressSize["/dress-sizes/{id}"]?.patch,
    delete: hardDeleteDressSize["/dress-sizes/{id}"]?.delete,
  },
};

export default dressSizes;