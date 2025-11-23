import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

const getContract = loadJson("./get-contract.json");
const getContractById = loadJson("./get-contract-by-id.json");
const createContract = loadJson("./create-contract.json");
const updateContract = loadJson("./update-contract.json");
const generateSignature = loadJson("./generate-signature.json");
const getContractSignLink = loadJson("./get-contract-sign-link.json");
const signContractViaLink = loadJson("./sign-contract-via-link.json");
const fullView = loadJson("./full-view.json");
const hardDeleteContract = loadJson("./delete-contract-hard.json");
const softDeleteContract = loadJson("./delete-contract-soft.json");
const restoreContract = loadJson("./restore-contract.json");
const generatePDF = loadJson("./generate-pdf.json");
const uploadSignedPdf = loadJson("./upload-signed-pdf.json");
const downloadSignedContract = loadJson("./download-signed-contract.json");

const contract = {
  "/contracts": {
    get: getContract["/contracts"]?.get,
    post: createContract["/contracts"]?.post,
  },
  "/contracts/{id}": {
    get: getContractById["/contracts/{id}"]?.get,
    put: updateContract["/contracts/{id}"]?.put,
    patch: softDeleteContract["/contracts/{id}"]?.patch,
  },
  "/contracts/{id}/restore": {
    patch: restoreContract["/contracts/{id}/restore"]?.patch,
  },

  ...generateSignature,
  ...getContractSignLink,
  ...signContractViaLink,
  ...fullView,
  ...hardDeleteContract,
  ...generatePDF,
  ...uploadSignedPdf,
  ...downloadSignedContract,
};

export default contract;
