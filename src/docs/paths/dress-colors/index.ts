import getDressColors from "./get-dress-colors.json" with { type: "json" };
import createDressColor from "./create-dress-color.json" with { type: "json" };
import updateDressColor from "./update-dress-color.json" with { type: "json" };
import hardDeleteDressColor from "./hard-delete-dress-color.json" with { type: "json" };
import softDeleteDressColor from "./soft-delete-dress-color.json" with { type: "json" };

export default {
  "/dress-colors": {
    ...getDressColors["/dress-colors"],
    ...createDressColor["/dress-colors"],
  },
  "/dress-colors/{id}": {
    ...updateDressColor["/dress-colors/{id}"],
    ...softDeleteDressColor["/dress-colors/{id}"],
    ...hardDeleteDressColor["/dress-colors/{id}"],
  },
};
