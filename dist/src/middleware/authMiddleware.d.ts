import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default authMiddleware;
//# sourceMappingURL=authMiddleware.d.ts.map