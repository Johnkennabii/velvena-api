import getCustomers from "./get-customers.json" with { type: "json" };
import getCustomerById from "./get-customer-by-id.json" with { type: "json" };
import createCustomer from "./create-customer.json" with { type: "json" };
import updateCustomer from "./update-customer.json" with { type: "json" };
import softDeleteCustomer from "./soft-delete-customer.json" with { type: "json" };
import deleteCustomerHard from "./delete-customer-hard.json" with { type: "json" };
export default {
    "/customers": {
        ...getCustomers["/customers"],
        ...createCustomer["/customers"],
    },
    "/customers/{id}": {
        ...getCustomerById["/customers/{id}"],
        ...updateCustomer["/customers/{id}"],
        ...softDeleteCustomer["/customers/{id}"],
        ...deleteCustomerHard["/customers/{id}"],
    },
};
//# sourceMappingURL=index.js.map