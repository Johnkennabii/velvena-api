import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../types/express.js";
export declare const uploadSignedPdfMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const getAllContracts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getContractById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createContract: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateContract: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteContract: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const restoreContract: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const hardDeleteContract: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getContractsFullView: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generateSignatureLink: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getContractSignLink: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const signContractViaLink: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateContractPdfManually: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadSignedContractPdf: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const downloadSignedContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=contractController.d.ts.map