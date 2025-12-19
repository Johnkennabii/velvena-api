import requestDeletion from "./request-deletion.json" with { type: "json" };
import confirmDeletion from "./confirm-deletion.json" with { type: "json" };

export const accountPaths = {
  ...requestDeletion,
  ...confirmDeletion,
};

export default accountPaths;
