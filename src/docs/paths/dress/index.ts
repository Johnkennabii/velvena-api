import getDress from "./get-dress.json" with { type: "json" };
import getDressById from "./get-dress-by-id.json" with { type: "json" };
import getDressesAvailability from "./get-dresses-availability.json" with { type: "json" };
import createDress from "./create-dress.json" with { type: "json" };
import updateDress from "./update-dress.json" with { type: "json" };
import deleteDressHard from "./delete-dress-hard.json" with { type: "json" };
import deleteDressSoft from "./delete-dress-soft.json" with { type: "json" };
import detailsView from "./details-view.json" with { type: "json" };
import deleteDressImage from "./delete-dress-image.json" with { type: "json" };
import createDressImage from "./create-dress-image.json" with { type: "json" };

export default {
  ...getDress,
  ...getDressById,
  ...getDressesAvailability,
  ...createDress,
  ...updateDress,
  ...deleteDressHard,
  ...deleteDressSoft,
  ...detailsView,
  ...deleteDressImage,
  ...createDressImage,
};
