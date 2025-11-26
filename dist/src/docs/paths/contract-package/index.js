import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const getContractPackages = loadJson("./get-contract-packages.json");
const getContractPackageById = loadJson("./get-contract-package-by-id.json");
const createContractPackage = loadJson("./create-contract-package.json");
const updateContractPackage = loadJson("./update-contract-package.json");
const softDeleteContractPackage = loadJson("./soft-delete-contract-package.json");
const hardDeleteContractPackage = loadJson("./hard-delete-contract-package.json");
const contractPackages = {
    // -------- /contract-packages --------
    "/contract-packages": {
        get: getContractPackages["/contract-packages"]?.get,
        post: createContractPackage["/contract-packages"]?.post,
    },
    // -------- /contract-packages/{id} --------
    "/contract-packages/{id}": {
        get: getContractPackageById["/contract-packages/{id}"]?.get,
        put: updateContractPackage["/contract-packages/{id}"]?.put,
    },
    ...softDeleteContractPackage,
    ...hardDeleteContractPackage,
};
export default contractPackages;
//# sourceMappingURL=index.js.map