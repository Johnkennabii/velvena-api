import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, file), "utf-8"));

const getRoles = loadJson("./get-roles.json");
const getRoleById = loadJson("./get-role-by-id.json");

export default {
  ...getRoles,
  ...getRoleById,
};
