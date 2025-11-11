import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const listDressImage = loadJson("./list-dress-images.json");
const uploadDressimage = loadJson("./upload-dress-images.json");
const deleteDressImage = loadJson("./delete-dress-image.json");
const dressesStorage = {
    // -------- /dress-storage--------
    "/dress-storage": {
        get: listDressImage["/dress-storage"]?.get,
        post: uploadDressimage["/dress-storage"]?.post,
    },
    ...deleteDressImage
    // -------- /dress-storage/{id} --------
    /*"/dress-storage/{id}": {
      get: getAvatarById["/avatars/{id}"]?.get,
      delete: deleteAvatar["/avatars/{id}"]?.delete,
    },*/
};
export default dressesStorage;
//# sourceMappingURL=index.js.map