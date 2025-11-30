import getDressSizes from "./get-dress-sizes.json" with { type: "json" };
import createDressSize from "./create-dress-size.json" with { type: "json" };
import updateDressSize from "./update-dress-size.json" with { type: "json" };
import softDeleteDressSize from "./soft-delete-dress-size.json" with { type: "json" };
import deleteDressSizeHard from "./delete-dress-size-hard.json" with { type: "json" };
export default {
    ...getDressSizes,
    ...createDressSize,
    ...updateDressSize,
    ...softDeleteDressSize,
    ...deleteDressSizeHard,
};
//# sourceMappingURL=index.js.map