import type { Request, Response } from "express";
/**
 * POST /api/webhook/maintenance
 * Active ou désactive le mode maintenance du site e-commerce
 */
export declare const toggleMaintenance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=maintenanceController.d.ts.map