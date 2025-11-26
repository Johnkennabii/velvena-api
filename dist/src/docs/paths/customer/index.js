import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loadJson = (file) => JSON.parse(fs.readFileSync(path.resolve(__dirname, file), "utf-8"));
const getCustomers = loadJson("./get-customers.json");
const getCustomerById = loadJson("./get-customer-by-id.json");
const createCustomer = loadJson("./create-customer.json");
const updateCustomer = loadJson("./update-customer.json");
const softDeleteCustomer = loadJson("./soft-delete-customer.json");
const hardDeleteCustomer = loadJson("./delete-customer-hard.json");
const customers = {
    "/customers": {
        get: getCustomers["/customers"]?.get,
        post: createCustomer["/customers"]?.post,
    },
    "/customers/{id}": {
        get: getCustomerById["/customers/{id}"]?.get,
        put: updateCustomer["/customers/{id}"]?.put,
        patch: softDeleteCustomer["/customers/{id}"]?.patch,
        delete: hardDeleteCustomer["/customers/{id}"]?.delete,
    },
};
export default customers;
//# sourceMappingURL=index.js.map