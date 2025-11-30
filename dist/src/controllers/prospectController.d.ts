import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
export declare const getProspects: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getProspectById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createProspect: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateProspect: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteProspect: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteProspect: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const convertProspectToCustomer: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=prospectController.d.ts.map