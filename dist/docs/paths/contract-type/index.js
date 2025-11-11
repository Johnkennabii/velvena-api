import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const getContractTypes = loadJson("./get-contract-types.json");
const getContractTypeById = loadJson("./get-contract-type-by-id.json");
const createContractType = loadJson("./create-contract-type.json");
const updateContractType = loadJson("./update-contract-type.json");
const softDeleteContractType = loadJson("./delete-contract-type-soft.json");
const hardDeleteContractType = loadJson("./delete-contract-type-hard.json");
const contractTypes = {
    "/contract-types": {
        get: getContractTypes["/contract-types"]?.get,
        post: createContractType["/contract-types"]?.post,
    },
    ...getContractTypeById,
    ...updateContractType,
    ...softDeleteContractType,
    ...hardDeleteContractType,
};
export default contractTypes;
//# sourceMappingURL=index.js.map