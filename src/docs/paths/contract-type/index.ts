import getContractTypes from "./get-contract-types.json" with { type: "json" };
import getContractTypeById from "./get-contract-type-by-id.json" with { type: "json" };
import createContractType from "./create-contract-type.json" with { type: "json" };
import updateContractType from "./update-contract-type.json" with { type: "json" };
import deleteContractTypeSoft from "./delete-contract-type-soft.json" with { type: "json" };
import deleteContractTypeHard from "./delete-contract-type-hard.json" with { type: "json" };

export default {
  "/contract-types": {
    ...getContractTypes["/contract-types"],
    ...createContractType["/contract-types"],
  },
  "/contract-types/{id}": {
    ...getContractTypeById["/contract-types/{id}"],
    ...updateContractType["/contract-types/{id}"],
  },
  ...deleteContractTypeSoft,
  ...deleteContractTypeHard,
};
