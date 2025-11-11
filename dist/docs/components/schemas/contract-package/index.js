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
const getContractPackages = loadJson("./get-contract-packages.json");
const getContractPackageById = loadJson("./get-contract-package-by-id.json");
const updateContractPackage = loadJson("./update-contract-package.json");
const createContractPackage = loadJson("./create-contract-package.json");
const softDeleteContractPackage = loadJson("./soft-delete-contract-package.json");
const hardDeleteContractPackage = loadJson("./hard-delete-contract-package.json");
export default {
    ...getContractPackages,
    ...getContractPackageById,
    ...updateContractPackage,
    ...createContractPackage,
    ...softDeleteContractPackage,
    ...hardDeleteContractPackage,
};
//# sourceMappingURL=index.js.map