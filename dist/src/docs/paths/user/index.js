import getUsers from "./get-users.json" with { type: "json" };
import getUserById from "./get-user-by-id.json" with { type: "json" };
import updateUser from "./update-user.json" with { type: "json" };
import softDeleteUser from "./soft-delete-user.json" with { type: "json" };
import deleteUserHard from "./delete-user-hard.json" with { type: "json" };
export default {
    ...getUsers,
    "/users/{id}": {
        ...getUserById["/users/{id}"],
        ...updateUser["/users/{id}"],
        ...softDeleteUser["/users/{id}"],
        ...deleteUserHard["/users/{id}"],
    },
};
//# sourceMappingURL=index.js.map