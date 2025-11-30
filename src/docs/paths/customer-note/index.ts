import getCustomerNotes from "./get-customer-notes.json" with { type: "json" };
import getCustomerNoteById from "./get-customer-note-by-id.json" with { type: "json" };
import createCustomerNote from "./create-customer-note.json" with { type: "json" };
import updateCustomerNote from "./update-customer-note.json" with { type: "json" };
import softDeleteCustomerNote from "./soft-delete-customer-note.json" with { type: "json" };
import deleteCustomerNoteHard from "./delete-customer-note-hard.json" with { type: "json" };

export const customerNotePaths = {
  ...getCustomerNotes,
  ...getCustomerNoteById,
  ...createCustomerNote,
  ...updateCustomerNote,
  ...softDeleteCustomerNote,
  ...deleteCustomerNoteHard,
};
