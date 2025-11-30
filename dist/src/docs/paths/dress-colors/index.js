import getDressColors from "./get-dress-colors.json" with { type: "json" };
import createDressColor from "./create-dress-color.json" with { type: "json" };
import updateDressColor from "./update-dress-color.json" with { type: "json" };
import hardDeleteDressColor from "./hard-delete-dress-color.json" with { type: "json" };
import softDeleteDressColor from "./soft-delete-dress-color.json" with { type: "json" };
export default {
    ...getDressColors,
    ...createDressColor,
    ...updateDressColor,
    ...hardDeleteDressColor,
    ...softDeleteDressColor,
};
//# sourceMappingURL=index.js.map