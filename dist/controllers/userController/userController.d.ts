import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const getUsers: (_req: Request, res: Response) => Promise<void>;
export declare const getUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { hardDeleteUser as deleteUser };
//# sourceMappingURL=userController.d.ts.map