import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(filename: string) {
  const filePath = path.join(__dirname, filename);
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

const getDressColors = loadJson("./get-dress-colors.json");
const updateDressColor = loadJson("./update-dress-color.json");
const createDressColor = loadJson("./create-dress-color.json");
/*const softDeleteDressColor = loadJson("./soft-delete-dress-color.json");
const hardDeleteDressColor = loadJson("./hard-delete-dress-color.json");*/





export default {
  ...getDressColors,
  ...updateDressColor,
  ...createDressColor,
   /*...softDeleteDressColor,
    ...hardDeleteDressColor,*/
};