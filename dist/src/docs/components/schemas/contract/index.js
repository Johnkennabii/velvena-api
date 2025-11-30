import getContract from "./get-contract.json" with { type: "json" };
import getContractById from "./get-contract-by-id.json" with { type: "json" };
import createContract from "./create-contract.json" with { type: "json" };
import updateContract from "./update-contract.json" with { type: "json" };
import deleteContractSoft from "./delete-contract-soft.json" with { type: "json" };
import deleteContractHard from "./delete-contract-hard.json" with { type: "json" };
import generateSignature from "./generate-signature.json" with { type: "json" };
export default {
    ...getContract,
    ...getContractById,
    ...createContract,
    ...updateContract,
    ...deleteContractSoft,
    ...deleteContractHard,
    ...generateSignature,
};
//# sourceMappingURL=index.js.map