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
const listDressImages = loadJson("list-dress-images.json");
const uploadDressImages = loadJson("upload-dress-images.json");
const deleteDressImages = loadJson("delete-dress-image.json");
export default {
    ...listDressImages,
    ...uploadDressImages,
    ...deleteDressImages,
};
//# sourceMappingURL=index.js.map