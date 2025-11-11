import { Request } from "express";

// Interface exportable
export interface AuthUser {
  id: string;
  email?: string | null;
  role?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser | null;
}

// Extension globale (pour continuer à utiliser req.user partout sans importer)
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string | null;
      } | null;
    }
  }
}