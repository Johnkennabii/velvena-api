import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const getDressConditions: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createDressCondition: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateDressCondition: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteDressCondition: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteDressCondition: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dressConditionController.d.ts.map