import getContract from "./get-contract.json" with { type: "json" };
import getContractById from "./get-contract-by-id.json" with { type: "json" };
import createContract from "./create-contract.json" with { type: "json" };
import updateContract from "./update-contract.json" with { type: "json" };
import generateSignature from "./generate-signature.json" with { type: "json" };
import getContractSignLink from "./get-contract-sign-link.json" with { type: "json" };
import signContractViaLink from "./sign-contract-via-link.json" with { type: "json" };
import fullView from "./full-view.json" with { type: "json" };
import deleteContractHard from "./delete-contract-hard.json" with { type: "json" };
import deleteContractSoft from "./delete-contract-soft.json" with { type: "json" };
import restoreContract from "./restore-contract.json" with { type: "json" };
import generatePdf from "./generate-pdf.json" with { type: "json" };
import uploadSignedPdf from "./upload-signed-pdf.json" with { type: "json" };
import downloadSignedContract from "./download-signed-contract.json" with { type: "json" };

export default {
  ...getContract,
  ...getContractById,
  ...createContract,
  ...updateContract,
  ...generateSignature,
  ...getContractSignLink,
  ...signContractViaLink,
  ...fullView,
  ...deleteContractHard,
  ...deleteContractSoft,
  ...restoreContract,
  ...generatePdf,
  ...uploadSignedPdf,
  ...downloadSignedContract,
};
