import getCustomerNotes from "./get-customer-notes.json" with { type: "json" };
import getCustomerNoteById from "./get-customer-note-by-id.json" with { type: "json" };
import createCustomerNote from "./create-customer-note.json" with { type: "json" };
import updateCustomerNote from "./update-customer-note.json" with { type: "json" };
import softDeleteCustomerNote from "./soft-delete-customer-note.json" with { type: "json" };
import deleteCustomerNoteHard from "./delete-customer-note-hard.json" with { type: "json" };
export const customerNotePaths = {
    "/customer-notes/customer/{customerId}": {
        ...getCustomerNotes["/customer-notes/customer/{customerId}"],
        ...createCustomerNote["/customer-notes/customer/{customerId}"],
    },
    "/customer-notes/{id}": {
        ...getCustomerNoteById["/customer-notes/{id}"],
        ...updateCustomerNote["/customer-notes/{id}"],
        ...softDeleteCustomerNote["/customer-notes/{id}"],
        ...deleteCustomerNoteHard["/customer-notes/{id}"],
    },
};
//# sourceMappingURL=index.js.map