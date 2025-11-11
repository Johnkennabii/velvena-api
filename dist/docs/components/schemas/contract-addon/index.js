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
const getContractAddons = loadJson("./get-contract-addons.json");
const getContractAddonById = loadJson("./get-contract-addon-by-id.json");
const createContractAddon = loadJson("./create-contract-addon.json");
const updateContractAddon = loadJson("./update-contract-addon.json");
const softDeleteContractAddon = loadJson("./soft-delete-contract-addon.json");
const hardDeleteContractAddon = loadJson("./hard-delete-contract-addon.json");
export default {
    ...getContractAddons,
    ...getContractAddonById,
    ...createContractAddon,
    ...updateContractAddon,
    ...softDeleteContractAddon,
    ...hardDeleteContractAddon,
};
//# sourceMappingURL=index.js.map