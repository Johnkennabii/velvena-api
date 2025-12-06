import { Request } from "express";

// Interface exportable
export interface AuthUser {
  id: string;
  email?: string | null;
  role?: string | null;
  organizationId: string; // Required for multi-tenant isolation
}

export interface ApiKeyAuth {
  id: string;
  name: string;
  scopes: string[];
  organizationId?: string; // Optional for API keys (some may be global)
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser | null;
  apiKey?: ApiKeyAuth;
  organizationId?: string; // Extracted from user or apiKey
}

// Extension globale (pour continuer à utiliser req.user partout sans importer)
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string | null;
        organizationId: string;
      } | null;
      apiKey?: {
        id: string;
        name: string;
        scopes: string[];
        organizationId?: string;
      };
      organizationId?: string; // Convenience field for middleware
    }
  }
}