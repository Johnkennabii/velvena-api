
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (filename: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filename), "utf-8"));

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