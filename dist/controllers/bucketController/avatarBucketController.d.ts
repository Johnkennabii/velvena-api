import type { Request, Response } from "express";
import multer from "multer";
export declare const upload: multer.Multer;
export declare const listAvatars: (_req: Request, res: Response) => Promise<void>;
export declare const getAvatarById: (req: Request, res: Response) => Promise<void>;
export declare const deleteAvatarById: (req: Request, res: Response) => Promise<void>;
export declare const uploadAvatar: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=avatarBucketController.d.ts.map