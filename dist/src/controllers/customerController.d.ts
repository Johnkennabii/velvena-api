import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
export declare const getCustomers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCustomerById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createCustomer: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateCustomer: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteCustomer: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteCustomer: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=customerController.d.ts.map