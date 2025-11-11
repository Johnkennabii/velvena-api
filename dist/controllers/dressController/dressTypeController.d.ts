import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const getDressTypes: (_req: Request, res: Response) => Promise<void>;
export declare const createDressType: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDressType: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteDressType: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteDressType: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dressTypeController.d.ts.map