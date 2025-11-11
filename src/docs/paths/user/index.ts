import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, file), "utf-8"));

const getUsers = loadJson("./get-users.json");
const getUserById = loadJson("./get-user-by-id.json");
const updateUser = loadJson("./update-user.json");
const softDeleteUser = loadJson("./soft-delete-user.json");
const hardDeleteUser = loadJson("./delete-user-hard.json");

const users = {
  "/users": {
    get: getUsers["/users"]?.get,
  },
  "/users/{id}": {
    get: getUserById["/users/{id}"]?.get,
    put: updateUser["/users/{id}"]?.put,
    patch: softDeleteUser["/users/{id}"]?.patch,
    delete: hardDeleteUser["/users/{id}"]?.delete,
  },
};

export default users;