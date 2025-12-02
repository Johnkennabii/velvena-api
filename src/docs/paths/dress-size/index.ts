import getDressSizes from "./get-dress-sizes.json" with { type: "json" };
import createDressSize from "./create-dress-size.json" with { type: "json" };
import updateDressSize from "./update-dress-size.json" with { type: "json" };
import softDeleteDressSize from "./soft-delete-dress-size.json" with { type: "json" };
import deleteDressSizeHard from "./delete-dress-size-hard.json" with { type: "json" };

export default {
  "/dress-sizes": {
    ...getDressSizes["/dress-sizes"],
    ...createDressSize["/dress-sizes"],
  },
  "/dress-sizes/{id}": {
    ...updateDressSize["/dress-sizes/{id}"],
    ...softDeleteDressSize["/dress-sizes/{id}"],
    ...deleteDressSizeHard["/dress-sizes/{id}"],
  },
};
