import getUsers from "./get-users.json" with { type: "json" };
import getUserById from "./get-user-by-id.json" with { type: "json" };
import updateUser from "./update-user.json" with { type: "json" };
import softDeleteUser from "./soft-delete-user.json" with { type: "json" };
import deleteUserHard from "./delete-user-hard.json" with { type: "json" };

export default {
  ...getUsers,
  ...getUserById,
  ...updateUser,
  ...softDeleteUser,
  ...deleteUserHard,
};
