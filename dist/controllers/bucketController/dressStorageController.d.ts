import type { Request, Response } from "express";
import multer from "multer";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const upload: multer.Multer;
export declare const listDressImages: (_req: Request, res: Response) => Promise<void>;
export declare const uploadDressImages: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteDressImage: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dressStorageController.d.ts.map