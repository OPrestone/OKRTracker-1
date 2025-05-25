import { Express, Request, Response, NextFunction, Router } from 'express';
import { db } from '../db';
import { objectives, keyResults } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export function setupApprovedOkrsRoutes(router: Router) {
  // Get approved OKRs for a specific tenant
  router.get('/:tenantId/approved-okrs', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check if user has access to the requested tenant
      const userTenants = (req.user as any).tenants?.map((t: any) => t.id) || [];
      if (!userTenants.includes(tenantId)) {
        return res.status(403).json({ error: 'Access denied to this tenant' });
      }
      
      // Get all approved objectives for the tenant
      const approvedObjectives = await db.query.objectives.findMany({
        where: and(
          eq(objectives.tenant_id, tenantId),
          eq(objectives.status, 'approved')
        ),
      });
      
      // Get key results for each objective
      const objectivesWithKeyResults = await Promise.all(
        approvedObjectives.map(async (objective) => {
          const objectiveKeyResults = await db.query.keyResults.findMany({
            where: eq(keyResults.objective_id, objective.id),
          });
          
          // Calculate overall progress based on key results
          let totalProgress = 0;
          if (objectiveKeyResults.length > 0) {
            totalProgress = objectiveKeyResults.reduce(
              (sum, kr) => sum + (kr.progress || 0), 
              0
            ) / objectiveKeyResults.length;
          } else {
            totalProgress = objective.progress || 0;
          }
          
          // Format the data for the frontend
          return {
            id: objective.id,
            title: objective.title,
            description: objective.description,
            status: objective.status,
            level: objective.level,
            progress: Math.round(totalProgress),
            timeframeId: objective.timeframe_id,
            teamId: objective.team_id,
            ownerId: objective.owner_id,
            keyResults: objectiveKeyResults.map(kr => ({
              id: kr.id,
              title: kr.title,
              description: kr.description,
              current_value: kr.current_value,
              target_value: kr.target_value,
              start_value: kr.start_value,
              progress: kr.progress,
              status: kr.status,
              objective_id: kr.objective_id
            }))
          };
        })
      );
      
      return res.status(200).json(objectivesWithKeyResults);
    } catch (error) {
      console.error('Error fetching approved OKRs:', error);
      return next(error);
    }
  });
}