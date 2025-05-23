import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import { ensureAuthenticated } from "../auth";
import { withTenant } from "../middleware/tenant-middleware";

export function registerUserProgressRoutes(router: Router, storage: IStorage) {
  // Get progress for all objectives for a specific user
  router.get("/progress/user/:userId", ensureAuthenticated, withTenant, async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }
    
    try {
      const progress = await storage.getUserObjectivesProgress(userId, tenantId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });
  
  // Get progress for a specific objective for a specific user
  router.get("/progress/objective/:objectiveId/user/:userId", ensureAuthenticated, async (req: Request, res: Response) => {
    const { userId, objectiveId } = req.params;
    
    try {
      const progress = await storage.getUserProgressByUserAndObjective(userId, objectiveId);
      
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress for objective:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });
  
  // Create or update user progress for an objective
  router.post("/progress", ensureAuthenticated, withTenant, async (req: Request, res: Response) => {
    try {
      const { tenantId } = req;
      const progressData = req.body;
      
      if (!progressData.userId || !progressData.objectiveId || progressData.progress === undefined) {
        return res.status(400).json({ error: "Missing required fields: userId, objectiveId, progress" });
      }
      
      // Ensure tenantId is included
      progressData.tenantId = tenantId;
      
      const progress = await storage.createUserProgress(progressData);
      
      // If updateObjective flag is true, also update the objective's progress
      if (progressData.updateObjective && progressData.objectiveId) {
        try {
          const objective = await storage.getObjective(progressData.objectiveId);
          if (objective) {
            await storage.updateObjective(objective.id, { 
              progress: progressData.progress 
            });
          }
        } catch (err) {
          console.error("Error updating objective progress:", err);
          // Continue with the response even if objective update fails
        }
      }
      
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating user progress:", error);
      res.status(500).json({ error: "Failed to create user progress" });
    }
  });
  
  // Update existing user progress
  router.put("/progress/:id", ensureAuthenticated, withTenant, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const progressData = req.body;
      
      if (progressData.progress === undefined) {
        return res.status(400).json({ error: "Missing required field: progress" });
      }
      
      const existingProgress = await storage.getUserProgress(id);
      if (!existingProgress) {
        return res.status(404).json({ error: "Progress record not found" });
      }
      
      const updatedProgress = await storage.updateUserProgress(id, progressData);
      
      // If updateObjective flag is true, also update the objective's progress
      if (progressData.updateObjective && existingProgress.objectiveId) {
        try {
          const objective = await storage.getObjective(existingProgress.objectiveId);
          if (objective) {
            await storage.updateObjective(objective.id, { 
              progress: progressData.progress 
            });
          }
        } catch (err) {
          console.error("Error updating objective progress:", err);
          // Continue with the response even if objective update fails
        }
      }
      
      res.json(updatedProgress);
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ error: "Failed to update user progress" });
    }
  });
}