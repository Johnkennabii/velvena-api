import getProspects from "./get-prospects.json" with { type: "json" };
import getProspectById from "./get-prospect-by-id.json" with { type: "json" };
import createProspect from "./create-prospect.json" with { type: "json" };
import updateProspect from "./update-prospect.json" with { type: "json" };
import softDeleteProspect from "./soft-delete-prospect.json" with { type: "json" };
import deleteProspectHard from "./delete-prospect-hard.json" with { type: "json" };
import convertProspect from "./convert-prospect.json" with { type: "json" };

export const prospectPaths = {
  ...getProspects,
  ...getProspectById,
  ...createProspect,
  ...updateProspect,
  ...softDeleteProspect,
  ...deleteProspectHard,
  ...convertProspect,
};
