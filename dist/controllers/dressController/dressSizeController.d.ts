import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const getDressSizes: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createDressSize: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateDressSize: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteDressSize: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteDressSize: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dressSizeController.d.ts.map