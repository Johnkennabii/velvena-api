import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { contractPermissionMiddleware, isContractActionAllowed } from "../src/middleware/contractPermissionMiddleware.js";
import prisma from "../src/lib/prisma.js";
const originalFindUnique = prisma.contract.findUnique.bind(prisma);
afterEach(() => {
    prisma.contract.findUnique = originalFindUnique;
});
test("isContractActionAllowed respecte la matrice ADMIN/MANAGER/COLLABORATOR", () => {
    assert.equal(isContractActionAllowed("ADMIN", "SIGNED"), true);
    assert.equal(isContractActionAllowed("MANAGER", "PENDING_SIGNATURE"), true);
    assert.equal(isContractActionAllowed("MANAGER", "SIGNED"), false);
    assert.equal(isContractActionAllowed("COLLABORATOR", "DRAFT"), true);
    assert.equal(isContractActionAllowed("COLLABORATOR", "PENDING_SIGNATURE"), false);
});
test("middleware bloque un MANAGER sur un contrat signé", async () => {
    prisma.contract.findUnique = async () => ({
        id: "contract-1",
        status: "SIGNED",
        contract_number: "C-001",
    });
    const middleware = contractPermissionMiddleware();
    const req = { params: { id: "contract-1" }, user: { id: "user-1", role: "MANAGER" } };
    const res = {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        },
    };
    let nextCalled = false;
    await middleware(req, res, () => {
        nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.payload?.success, false);
});
test("middleware bloque un COLLABORATOR sur un contrat non brouillon", async () => {
    prisma.contract.findUnique = async () => ({
        id: "contract-2",
        status: "PENDING_SIGNATURE",
        contract_number: "C-002",
    });
    const middleware = contractPermissionMiddleware();
    const req = { params: { id: "contract-2" }, user: { id: "user-2", role: "COLLABORATOR" } };
    const res = {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        },
    };
    let nextCalled = false;
    await middleware(req, res, () => {
        nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.payload?.success, false);
});
test("middleware laisse passer un ADMIN quel que soit le statut", async () => {
    prisma.contract.findUnique = async () => ({
        id: "contract-3",
        status: "SIGNED_ELECTRONICALLY",
        contract_number: "C-003",
    });
    const middleware = contractPermissionMiddleware();
    const req = { params: { id: "contract-3" }, user: { id: "user-3", role: "ADMIN" } };
    const res = {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        },
    };
    let nextCalled = false;
    await middleware(req, res, () => {
        nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload, null);
});
//# sourceMappingURL=contractPermissionMiddleware.test.js.map