import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function loadJson(filename) {
    const filePath = path.join(__dirname, filename);
    const fileContents = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContents);
}
const getDress = loadJson("get-dress.json");
const getDressAvailability = loadJson("get-dresses-availability.json");
const getDressById = loadJson("get-dress-by-id.json");
const createDress = loadJson("create-dress.json");
const updateDress = loadJson("update-dress.json");
const hardDeleteDress = loadJson("delete-dress-hard.json");
const softDeleteDress = loadJson("delete-dress-soft.json");
const dressDetailsView = loadJson("details-view.json");
const deleteDressImage = loadJson("delete-dress-image.json");
const createDressImage = loadJson("create-dress-image.json");
export default {
    ...getDress,
    ...getDressById,
    ...createDress,
    ...updateDress,
    ...hardDeleteDress,
    ...softDeleteDress,
    ...dressDetailsView,
    ...deleteDressImage,
    ...createDressImage,
    ...getDressAvailability,
};
//# sourceMappingURL=index.js.map