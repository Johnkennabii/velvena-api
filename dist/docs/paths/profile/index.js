import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const getProfiles = loadJson("./get-profiles.json");
const createProfile = loadJson("./create-profile.json");
const profiles = {
    "/profiles": {
        get: getProfiles["/profiles"]?.get,
        post: createProfile["/profiles"]?.post,
    },
};
export default profiles;
//# sourceMappingURL=index.js.map