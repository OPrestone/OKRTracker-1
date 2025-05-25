import { Request, Response, NextFunction, Router } from "express";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { teams, usersToTenants, users } from "@shared/schema";
import { z } from "zod";

export function setupTeamRoutes(router: Router) {
  // Update team leader
  router.put("/teams/:id/leader", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teamId = req.params.id;
      const tenantId = req.tenantId!;
      const userId = (req.user as any).id;
      
      // Validate input
      const { leaderId } = z.object({
        leaderId: z.string().min(1)
      }).parse(req.body);
      
      // Check if user is authorized (admin, tenant owner, or team owner)
      const userRole = await db.query.usersToTenants.findFirst({
        where: (utt, { and, eq }) => and(
          eq(utt.userId, userId),
          eq(utt.tenantId, tenantId)
        )
      });
      
      // Check if team exists and belongs to this tenant first
      const team = await db.query.teams.findFirst({
        where: (t, { and, eq }) => and(
          eq(t.id, teamId),
          eq(t.tenantId, tenantId)
        )
      });
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Allow if user is tenant admin/owner OR team owner
      const isAuthorized = (userRole && (userRole.role === 'admin' || userRole.role === 'owner')) || 
                          (team.ownerId === userId);
      
      if (!isAuthorized) {
        return res.status(403).json({ error: "Not authorized to update team leader" });
      }
      
      // Check if the new leader is a user in the system
      const leaderUser = await db.query.users.findFirst({
        where: eq(users.id, leaderId)
      });
      
      if (!leaderUser) {
        return res.status(400).json({ error: "User not found" });
      }
      
      // Update the team leader
      console.log(`Updating team ${teamId} with leader ${leaderId}`);
      const updateResult = await db.update(teams)
        .set({ leaderId: leaderId })
        .where(eq(teams.id, teamId))
        .returning();
      
      console.log("Team update result:", updateResult);
      
      if (!updateResult || updateResult.length === 0) {
        return res.status(500).json({ error: "Failed to update team leader" });
      }
      
      // Return the updated team with leader information
      const updatedTeam = await db.query.teams.findFirst({
        where: eq(teams.id, teamId),
        with: {
          leader: true
        }
      });
      
      console.log("Updated team with leader:", updatedTeam);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team leader:", error);
      res.status(500).json({ error: `Failed to update team leader: ${error.message}` });
    }
  });
}