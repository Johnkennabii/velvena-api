import getContractTypes from "./get-contract-types.json" with { type: "json" };
import getContractTypeById from "./get-contract-type-by-id.json" with { type: "json" };
import createContractType from "./create-contract-type.json" with { type: "json" };
import updateContractType from "./update-contract-type.json" with { type: "json" };
import deleteContractType from "./delete-contract-type.json" with { type: "json" };

export default {
  ...getContractTypes,
  ...getContractTypeById,
  ...createContractType,
  ...updateContractType,
  ...deleteContractType,
};
