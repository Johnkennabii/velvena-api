import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));
const contract = loadJson("./get-contract.json");
const contractById = loadJson("./get-contract-by-id.json");
const contractCreate = loadJson("./create-contract.json");
const contractUpdate = loadJson("./update-contract.json");
const deleteSoft = loadJson("./delete-contract-soft.json");
const deleteHard = loadJson("./delete-contract-hard.json");
const generateSignature = loadJson("./generate-signature.json");
export default {
    ...contract,
    ...contractById,
    ...contractCreate,
    ...contractUpdate,
    ...deleteSoft,
    ...deleteHard,
    ...generateSignature,
};
//# sourceMappingURL=index.js.map