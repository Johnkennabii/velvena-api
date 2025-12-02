import listAvatars from "./list-avatars.json" with { type: "json" };
import getAvatarById from "./get-avatar-by-id.json" with { type: "json" };
import deleteAvatarById from "./delete-avatar-by-id.json" with { type: "json" };
import uploadAvatar from "./upload-avatar.json" with { type: "json" };

export default {
  "/avatars": {
    ...listAvatars["/avatars"],
    ...uploadAvatar["/avatars"],
  },
  "/avatars/{id}": {
    ...getAvatarById["/avatars/{id}"],
    ...deleteAvatarById["/avatars/{id}"],
  },
};
