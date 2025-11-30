import getRoles from "./get-roles.json" with { type: "json" };
import getRoleById from "./get-role-by-id.json" with { type: "json" };

export default {
  ...getRoles,
  ...getRoleById,
};
