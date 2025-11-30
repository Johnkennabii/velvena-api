import getDressTypes from "./get-dress-types.json" with { type: "json" };
import createDressType from "./create-dress-type.json" with { type: "json" };
import updateDressType from "./update-dress-type.json" with { type: "json" };
import softDeleteDressType from "./soft-delete-dress-type.json" with { type: "json" };
import deleteDressTypeHard from "./delete-dress-type-hard.json" with { type: "json" };

export default {
  ...getDressTypes,
  ...createDressType,
  ...updateDressType,
  ...softDeleteDressType,
  ...deleteDressTypeHard,
};
