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

const getDressSizes = loadJson("./get-dress-sizes.json");
const createDressSize = loadJson("./create-dress-size.json");
const updateDressSize = loadJson("./update-dress-size.json");
const softDeleteDressSize = loadJson("./soft-delete-dress-size.json");
const hardDeleteDressSize = loadJson("./delete-dress-size-hard.json");

export default {
  ...getDressSizes,
  ...createDressSize,
  ...updateDressSize,
  ...softDeleteDressSize,
  ...hardDeleteDressSize
};