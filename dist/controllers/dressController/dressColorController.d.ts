import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const getDressColors: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createDressColor: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateDressColor: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteDressColor: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteDressColor: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dressColorController.d.ts.map