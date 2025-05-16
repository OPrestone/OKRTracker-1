import { NextFunction, Request, Response } from "express";

/**
 * Middleware to extract tenant ID from request
 * Looks for tenant ID in:
 * 1. Query parameter (?tenantId=...)
 * 2. Request body (body.tenantId)
 * 3. Request header (X-Tenant-ID)
 */
export function withTenant(req: Request, res: Response, next: NextFunction) {
  // Priority 1: Query parameter
  let tenantId = req.query.tenantId as string;
  
  // Priority 2: Request body
  if (!tenantId && req.body && req.body.tenantId) {
    tenantId = req.body.tenantId;
  }
  
  // Priority 3: Request header
  if (!tenantId && req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'] as string;
  }
  
  // Attach tenant ID to request object
  if (tenantId) {
    req.tenantId = tenantId;
    console.log(`Setting tenant context: tenantId=${tenantId}`);
  }
  
  next();
}