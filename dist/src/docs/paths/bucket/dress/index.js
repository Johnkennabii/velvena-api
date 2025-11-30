import listDressImages from "./list-dress-images.json" with { type: "json" };
import uploadDressImages from "./upload-dress-images.json" with { type: "json" };
import deleteDressImage from "./delete-dress-image.json" with { type: "json" };
export default {
    ...listDressImages,
    ...uploadDressImages,
    ...deleteDressImage,
};
//# sourceMappingURL=index.js.map