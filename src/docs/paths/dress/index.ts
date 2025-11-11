import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

const getDress = loadJson("./get-dress.json");

const getDressById = loadJson("./get-dress-by-id.json");
const getDressAvailability= loadJson("./get-dresses-availability.json");
const createDress = loadJson("./create-dress.json");
const updateDress = loadJson("./update-dress.json");
const hardDeleteDress = loadJson("./delete-dress-hard.json");
const softDeleteDress = loadJson("./delete-dress-soft.json");
const dressDetailsView = loadJson("./details-view.json");
const deleteDressImage = loadJson("./delete-dress-image.json");
const createDressImage = loadJson("./create-dress-image.json");

const dresses = {
  // -------- /dresses --------
  "/dresses": {
    get: getDress["/dresses"]?.get,
    post: createDress["/dresses"]?.post,
  },


  // -------- /dresses/{id} --------
  "/dresses/{id}": {
    get: getDressById["/dresses/{id}"]?.get,
    put: updateDress["/dresses/{id}"]?.put,
  },

  // autres endpoints importés
  ...getDressAvailability,
  ...softDeleteDress,
  ...hardDeleteDress,
  ...dressDetailsView,
  ...deleteDressImage,
  ...createDressImage,
};

export default dresses;