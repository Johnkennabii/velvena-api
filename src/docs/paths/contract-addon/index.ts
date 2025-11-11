
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

const getContractAddons = loadJson("./get-contract-addons.json");
const getContractAddonById = loadJson("./get-contract-addon-by-id.json");
const createContractAddon = loadJson("./create-contract-addon.json");
const updateContractAddon = loadJson("./update-contract-addon.json");
const softDeleteContractAddon = loadJson("./soft-delete-contract-addon.json");
const hardDeleteContractAddon = loadJson("./hard-delete-contract-addon.json");


const contractAddons = {
  // -------- /contract-addonss --------
  "/contract-addons": {
    get: getContractAddons["/contract-addons"]?.get,
    post: createContractAddon["/contract-addons"]?.post,
  },

  // -------- /contract-addons/{id} --------
  "/contract-addons/{id}": {
    get: getContractAddonById["/contract-addons/{id}"]?.get,
    put: updateContractAddon["/contract-addon/{id}"]?.put,
  },
  ...softDeleteContractAddon,
  ...hardDeleteContractAddon,
};

export default contractAddons;