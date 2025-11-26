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
const listAvatars = loadJson("list-avatars.json");
const getAvatarById = loadJson("get-avatar-by-id.json");
export default {
    ...listAvatars,
    ...getAvatarById,
};
//# sourceMappingURL=index.js.map