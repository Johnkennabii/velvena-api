import getProfiles from "./get-profiles.json" with { type: "json" };
import createProfile from "./create-profile.json" with { type: "json" };
export default {
    "/profiles": {
        ...getProfiles["/profiles"],
        ...createProfile["/profiles"],
    },
};
//# sourceMappingURL=index.js.map