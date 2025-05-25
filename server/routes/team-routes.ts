import { Request, Response, NextFunction, Router } from "express";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { teams, usersToTenants, users } from "@shared/schema";
import { z } from "zod";

export function setupTeamRoutes(router: Router) {
  // Update team leader
  router.put("/:id/leader", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teamId = req.params.id;
      const tenantId = req.tenantId!;
      const userId = (req.user as any).id;
      
      // Validate input
      const { leaderId } = z.object({
        leaderId: z.string().min(1)
      }).parse(req.body);
      
      // Check if user is authorized (admin or team leader/owner)
      const userRole = await db.query.usersToTenants.findFirst({
        where: (utt, { and, eq }) => and(
          eq(utt.userId, userId),
          eq(utt.tenantId, tenantId)
        )
      });
      
      if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
        return res.status(403).json({ error: "Not authorized to update team leader" });
      }
      
      // Check if team exists and belongs to this tenant
      const team = await db.query.teams.findFirst({
        where: (t, { and, eq }) => and(
          eq(t.id, teamId),
          eq(t.tenantId, tenantId)
        )
      });
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Check if the new leader is a user in the system
      const leaderUser = await db.query.users.findFirst({
        where: eq(users.id, leaderId)
      });
      
      if (!leaderUser) {
        return res.status(400).json({ error: "User not found" });
      }
      
      // Update the team leader
      await db.update(teams)
        .set({ leaderId: leaderId })
        .where(eq(teams.id, teamId));
      
      // Return the updated team with leader information
      const updatedTeam = await db.query.teams.findFirst({
        where: eq(teams.id, teamId),
        with: {
          leader: true
        }
      });
      
      res.json(updatedTeam);
    } catch (error) {
      next(error);
    }
  });
}