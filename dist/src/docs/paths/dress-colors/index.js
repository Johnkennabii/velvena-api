import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const getDressColors = loadJson("./get-dress-colors.json");
const createDressColor = loadJson("./create-dress-color.json");
const updateDressColor = loadJson("./update-dress-color.json");
const hardDeleteDressColor = loadJson("./hard-delete-dress-color.json");
const softDeleteDressColor = loadJson("./soft-delete-dress-color.json");
const dressColors = {
    // -------- /dress-colors --------
    "/dress-colors": {
        get: getDressColors["/dress-colors"]?.get,
        post: createDressColor["/dress-colors"]?.post,
    },
    // -------- /dress-colors/{id} --------
    "/dress-colors/{id}": {
        put: updateDressColor["/dress-colors/{id}"]?.put,
        patch: softDeleteDressColor["/dress-colors/{id}"]?.patch,
        delete: hardDeleteDressColor["/dress-colors/{id}"]?.delete,
    },
};
export default dressColors;
//# sourceMappingURL=index.js.map