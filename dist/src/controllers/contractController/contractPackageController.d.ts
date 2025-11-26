import type { Request, Response } from "express";
export declare const getAllContractPackages: (req: Request, res: Response) => Promise<void>;
export declare const getContractPackageById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createContractPackage: (req: Request, res: Response) => Promise<void>;
export declare const updateContractPackage: (req: Request, res: Response) => Promise<void>;
export declare const softDeleteContractPackage: (req: Request, res: Response) => Promise<void>;
export declare const hardDeleteContractPackage: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=contractPackageController.d.ts.map