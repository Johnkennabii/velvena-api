import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const getProfiles = loadJson("./get-profiles.json");
const createProfile = loadJson("./create-profile.json");
let errorResponse = {};
try {
    errorResponse = loadJson("../shared/error-response.json");
}
catch {
    // facultatif
}
export default {
    ...getProfiles,
    ...createProfile,
    ...errorResponse,
};
//# sourceMappingURL=index.js.map