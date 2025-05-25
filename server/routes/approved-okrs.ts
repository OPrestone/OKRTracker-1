import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { User } from '@shared/schema';

export function setupApprovedOkrsRoutes(router: Router) {
  // Endpoint to get approved OKRs for a specific tenant ID
  router.get('/:tenantId/approved-okrs', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.params.tenantId;
      console.log(`Processing request for approved OKRs from specific tenant path: ${tenantId}/approved-okrs`);
      
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      
      // Check user's access to this tenant
      const user = req.user as User;
      const userTenants = await storage.getUserTenants(user.id);
      const hasTenantAccess = userTenants.some(tenant => tenant.id === tenantId);
      
      if (!hasTenantAccess) {
        return res.status(403).json({ error: "Access to tenant denied" });
      }
      
      // Get approved objectives with key results for this tenant
      const approvedObjectives = await storage.getApprovedObjectives(tenantId);
      
      console.log(`Found ${approvedObjectives.length} approved objectives for tenant: ${tenantId}`);
      
      res.json(approvedObjectives);
    } catch (error) {
      console.error(`Error getting approved OKRs for tenant ${req.params.tenantId}:`, error);
      next(error);
    }
  });
}