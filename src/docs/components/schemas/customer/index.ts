import getCustomers from "./get-customers.json" with { type: "json" };
import getCustomerById from "./get-customer-by-id.json" with { type: "json" };
import createCustomer from "./create-customer.json" with { type: "json" };
import updateCustomer from "./update-customer.json" with { type: "json" };
import softDeleteCustomer from "./soft-delete-customer.json" with { type: "json" };
import deleteCustomerHard from "./delete-customer-hard.json" with { type: "json" };

export default {
  ...getCustomers,
  ...getCustomerById,
  ...createCustomer,
  ...updateCustomer,
  ...softDeleteCustomer,
  ...deleteCustomerHard,
};
