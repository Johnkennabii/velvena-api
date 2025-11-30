import getDressConditions from "./get-dress-conditions.json" with { type: "json" };
import createDressCondition from "./create-dress-condition.json" with { type: "json" };
import updateDressCondition from "./update-dress-condition.json" with { type: "json" };
import softDeleteDressCondition from "./soft-delete-dress-condition.json" with { type: "json" };
import hardDeleteDressCondition from "./hard-delete-dress-condition.json" with { type: "json" };
export default {
    ...getDressConditions,
    ...createDressCondition,
    ...updateDressCondition,
    ...softDeleteDressCondition,
    ...hardDeleteDressCondition,
};
//# sourceMappingURL=index.js.map