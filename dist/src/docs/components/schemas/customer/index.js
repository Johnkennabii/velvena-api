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
let errorResponse = {};
try {
    errorResponse = loadJson("../shared/error-response.json");
}
catch {
    // facultatif
}
export default {
    ...getCustomers,
    ...getCustomerById,
    ...createCustomer,
    ...updateCustomer,
    ...softDeleteCustomer,
    ...hardDeleteCustomer,
    ...errorResponse,
};
//# sourceMappingURL=index.js.map