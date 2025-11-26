import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const getContractAddons: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getContractAddonById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createContractAddon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateContractAddon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteContractAddon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteContractAddon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=contractAddonController.d.ts.map