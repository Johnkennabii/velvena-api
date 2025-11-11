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

const register = loadJson("./register.json");
const login = loadJson("./login.json");
const me = loadJson("./me.json");
const refresh = loadJson("./refresh.json");


export default {
  ...register,
  ...login,
  ...me,
  ...refresh,

};