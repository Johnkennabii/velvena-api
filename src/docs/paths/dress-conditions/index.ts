import getDressConditions from "./get-dress-conditions.json" with { type: "json" };
import createDressCondition from "./create-dress-condition.json" with { type: "json" };
import updateDressCondition from "./update-dress-condition.json" with { type: "json" };
import softDeleteDressCondition from "./soft-delete-dress-condition.json" with { type: "json" };
import deleteDressConditionHard from "./delete-dress-condition-hard.json" with { type: "json" };

export default {
  "/dress-conditions": {
    ...getDressConditions["/dress-conditions"],
    ...createDressCondition["/dress-conditions"],
  },
  "/dress-conditions/{id}": {
    ...updateDressCondition["/dress-conditions/{id}"],
    ...softDeleteDressCondition["/dress-conditions/{id}"],
    ...deleteDressConditionHard["/dress-conditions/{id}"],
  },
};
