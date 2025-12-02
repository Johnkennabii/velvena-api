import listDressImages from "./list-dress-images.json" with { type: "json" };
import uploadDressImages from "./upload-dress-images.json" with { type: "json" };
import deleteDressImage from "./delete-dress-image.json" with { type: "json" };

export default {
  "/dress-storage": {
    ...listDressImages["/dress-storage"],
    ...uploadDressImages["/dress-storage"],
  },
  ...deleteDressImage,
};
