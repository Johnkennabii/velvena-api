import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const getUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const changeUserPassword: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { hardDeleteUser as deleteUser };
//# sourceMappingURL=userController.d.ts.map