import prospectRequest from "./prospect-request.json" with { type: "json" };
import createProspectRequest from "./create-prospect-request.json" with { type: "json" };
import getProspectRequests from "./get-prospect-requests.json" with { type: "json" };
import getProspectRequestById from "./get-prospect-request-by-id.json" with { type: "json" };
import updateProspectRequest from "./update-prospect-request.json" with { type: "json" };
import deleteProspectRequest from "./delete-prospect-request.json" with { type: "json" };
export const prospectRequestSchemas = {
    ...prospectRequest,
    ...createProspectRequest,
    ...getProspectRequests,
    ...getProspectRequestById,
    ...updateProspectRequest,
    ...deleteProspectRequest,
};
//# sourceMappingURL=index.js.map