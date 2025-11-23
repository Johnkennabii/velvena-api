import type { Request, Response } from "express";
export declare const uploadSignedPdfMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const getAllContracts: (req: Request, res: Response) => Promise<void>;
export declare const getContractById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createContract: (req: Request, res: Response) => Promise<void>;
export declare const updateContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const softDeleteContract: (req: Request, res: Response) => Promise<void>;
export declare const restoreContract: (req: Request, res: Response) => Promise<void>;
export declare const hardDeleteContract: (req: Request, res: Response) => Promise<void>;
export declare const getContractsFullView: (req: Request, res: Response) => Promise<void>;
export declare const generateSignatureLink: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getContractSignLink: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const signContractViaLink: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateContractPdfManually: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadSignedContractPdf: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const downloadSignedContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=contractController.d.ts.map