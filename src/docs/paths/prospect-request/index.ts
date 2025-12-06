import { readFileSync } from "node:fs";

const loadJson = (path: string) => JSON.parse(readFileSync(path, "utf-8"));

const createProspectRequest = loadJson(new URL("./create-prospect-request.json", import.meta.url).pathname);
const getProspectRequests = loadJson(new URL("./get-prospect-requests.json", import.meta.url).pathname);
const getProspectRequestById = loadJson(new URL("./get-prospect-request-by-id.json", import.meta.url).pathname);
const updateProspectRequest = loadJson(new URL("./update-prospect-request.json", import.meta.url).pathname);
const deleteProspectRequest = loadJson(new URL("./delete-prospect-request.json", import.meta.url).pathname);

export const prospectRequestPaths = {
  "/prospects/{prospectId}/requests": {
    ...createProspectRequest["/prospects/{prospectId}/requests"],
    ...getProspectRequests["/prospects/{prospectId}/requests"],
  },
  "/prospects/{prospectId}/requests/{requestId}": {
    ...getProspectRequestById["/prospects/{prospectId}/requests/{requestId}"],
    ...updateProspectRequest["/prospects/{prospectId}/requests/{requestId}"],
    ...deleteProspectRequest["/prospects/{prospectId}/requests/{requestId}"],
  },
};


console.log("✅ PROSPECT REQUEST PATHS LOADED:", Object.keys(prospectRequestPaths));
