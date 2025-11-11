import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const listAvatar = loadJson("./list-avatars.json");
const getAvatarById = loadJson("./get-avatar-by-id.json");
const deleteAvatar = loadJson("./delete-avatar-by-id.json");
const uploadAvatar = loadJson("./upload-avatar.json");
const avatarsStorage = {
    // -------- /avatars--------
    "/avatars": {
        get: listAvatar["/avatars"]?.get,
        post: uploadAvatar["/avatars"]?.post,
    },
    // -------- /avatar/{id} --------
    "/avatars/{id}": {
        get: getAvatarById["/avatars/{id}"]?.get,
        delete: deleteAvatar["/avatars/{id}"]?.delete,
    },
};
export default avatarsStorage;
//# sourceMappingURL=index.js.map