import getContractAddons from "./get-contract-addons.json" with { type: "json" };
import getContractAddonById from "./get-contract-addon-by-id.json" with { type: "json" };
import createContractAddon from "./create-contract-addon.json" with { type: "json" };
import updateContractAddon from "./update-contract-addon.json" with { type: "json" };
import softDeleteContractAddon from "./soft-delete-contract-addon.json" with { type: "json" };
import hardDeleteContractAddon from "./hard-delete-contract-addon.json" with { type: "json" };
export default {
    "/contract-addons": {
        ...getContractAddons["/contract-addons"],
        ...createContractAddon["/contract-addons"],
    },
    "/contract-addons/{id}": {
        ...getContractAddonById["/contract-addons/{id}"],
        ...updateContractAddon["/contract-addons/{id}"],
    },
    ...softDeleteContractAddon,
    ...hardDeleteContractAddon,
};
//# sourceMappingURL=index.js.map