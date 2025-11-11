import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

const getDressTypes = loadJson("./get-dress-types.json");
const createDressType = loadJson("./create-dress-type.json");
const updateDressType = loadJson("./update-dress-type.json");
const softDeleteDressType = loadJson("./soft-delete-dress-type.json");
const hardDeleteDressType = loadJson("./delete-dress-type-hard.json");

const dressTypes = {
  "/dress-types": {
    get: getDressTypes["/dress-types"]?.get,
    post: createDressType["/dress-types"]?.post,
  },
  "/dress-types/{id}": {
    put: updateDressType["/dress-types/{id}"]?.put,
    patch: softDeleteDressType["/dress-types/{id}"]?.patch,
    delete: hardDeleteDressType["/dress-types/{id}"]?.delete,
  },
};

export default dressTypes;