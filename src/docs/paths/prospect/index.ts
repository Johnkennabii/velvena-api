import getProspects from "./get-prospects.json" with { type: "json" };
import prospectById from "./prospect-by-id.json" with { type: "json" };
import createProspect from "./create-prospect.json" with { type: "json" };
import convertProspect from "./convert-prospect.json" with { type: "json" };

export const prospectPaths = {
  "/prospects": {
    ...getProspects["/prospects"],
    ...createProspect["/prospects"],
  },
  ...prospectById,
  ...convertProspect,
};
