import getContractPackages from "./get-contract-packages.json" with { type: "json" };
import getContractPackageById from "./get-contract-package-by-id.json" with { type: "json" };
import createContractPackage from "./create-contract-package.json" with { type: "json" };
import updateContractPackage from "./update-contract-package.json" with { type: "json" };
import softDeleteContractPackage from "./soft-delete-contract-package.json" with { type: "json" };
import hardDeleteContractPackage from "./hard-delete-contract-package.json" with { type: "json" };
export default {
    "/contract-packages": {
        ...getContractPackages["/contract-packages"],
        ...createContractPackage["/contract-packages"],
    },
    "/contract-packages/{id}": {
        ...getContractPackageById["/contract-packages/{id}"],
        ...updateContractPackage["/contract-packages/{id}"],
    },
    ...softDeleteContractPackage,
    ...hardDeleteContractPackage,
};
//# sourceMappingURL=index.js.map