import express from "express";
import { listDressImages,  uploadDressImages, deleteDressImage, upload} from "../../controllers/bucketController/dressStorageController.js";

const router = express.Router();

router.get("/", listDressImages);

router.post("/", upload.array("images", 5), uploadDressImages);

router.delete("/:key", deleteDressImage);

export default router;