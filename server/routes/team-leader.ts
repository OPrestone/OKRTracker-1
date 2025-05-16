import { Request, Response, NextFunction, Router } from "express";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { users, teams, objectives, usersToTenants, keyResults } from "@shared/schema";

export function setupTeamLeaderRoutes(router: Router) {
  // Middleware to check if the user is a team leader
  const ensureTeamLeader = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Check if user is a team leader by:
      // 1. Has team owner role in at least one team
      // 2. Has admin or owner role in tenant
      // 3. Is system admin
      
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ error: "Missing user ID or tenant ID" });
      }

      // Check if user is a team owner
      const teamOwnership = await db.select({
        id: teams.id
      })
      .from(teams)
      .where(and(
        eq(teams.ownerId, userId),
        eq(teams.tenantId, tenantId)
      ))
      .limit(1);

      // Check if user has admin or owner role in tenant
      const tenantRole = await db.select({
        role: usersToTenants.role
      })
      .from(usersToTenants)
      .where(and(
        eq(usersToTenants.userId, userId),
        eq(usersToTenants.tenantId, tenantId)
      ))
      .limit(1);

      // Check if user is a system admin
      const isSystemAdmin = req.user?.isAdmin === true;
      
      // Allow access if any of these conditions are met
      if (
        teamOwnership.length > 0 || 
        (tenantRole.length > 0 && ['admin', 'owner'].includes(tenantRole[0].role)) ||
        isSystemAdmin
      ) {
        return next();
      }
      
      return res.status(403).json({ error: "Access denied: Team leader role required" });
    } catch (error) {
      console.error("Error checking team leader role:", error);
      return res.status(500).json({ error: "Server error while checking permissions" });
    }
  };

  // Endpoint to check if user is a team leader
  router.get("/user/is-team-leader", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ error: "Missing user ID or tenant ID" });
      }

      // Check if user is a team owner
      const teamOwnership = await db.select({
        id: teams.id
      })
      .from(teams)
      .where(and(
        eq(teams.ownerId, userId),
        eq(teams.tenantId, tenantId)
      ))
      .limit(1);

      // Check if user has admin or owner role in tenant
      const tenantRole = await db.select({
        role: usersToTenants.role
      })
      .from(usersToTenants)
      .where(and(
        eq(usersToTenants.userId, userId),
        eq(usersToTenants.tenantId, tenantId)
      ))
      .limit(1);

      // Check if user is a system admin
      const isSystemAdmin = req.user?.isAdmin === true;
      
      // Return true if any of these conditions are met
      const isTeamLeader = 
        teamOwnership.length > 0 || 
        (tenantRole.length > 0 && ['admin', 'owner'].includes(tenantRole[0].role)) ||
        isSystemAdmin;
      
      return res.json(isTeamLeader);
    } catch (error) {
      console.error("Error checking team leader role:", error);
      return res.status(500).json({ error: "Server error while checking permissions" });
    }
  });

  // Get team members for the leader's teams
  router.get("/team/members", ensureTeamLeader, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ error: "Missing user ID or tenant ID" });
      }

      // Get teams owned by the user
      const userTeams = await db.select({
        id: teams.id
      })
      .from(teams)
      .where(and(
        eq(teams.ownerId, userId),
        eq(teams.tenantId, tenantId)
      ));

      if (userTeams.length === 0) {
        // If user doesn't own any teams but is still a team leader (admin/owner),
        // return all users in the tenant
        const teamMembers = await db.select({
          id: users.id,
          name: users.name,
          title: users.title,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.tenantId, tenantId));

        // Add mock progress data for demonstration
        const teamMembersWithProgress = teamMembers.map(member => ({
          ...member,
          progress: Math.floor(Math.random() * 100)
        }));

        return res.json(teamMembersWithProgress);
      } else {
        // Get team members from user's teams
        const teamIds = userTeams.map(team => team.id);
        
        const teamMembers = await db.select({
          id: users.id,
          name: users.name,
          title: users.title,
          avatarUrl: users.avatarUrl,
          teamId: users.teamId
        })
        .from(users)
        .where(and(
          eq(users.tenantId, tenantId),
          sql`${users.teamId} IN (${teamIds.join(',')})`
        ));

        // Add mock progress data for demonstration
        const teamMembersWithProgress = teamMembers.map(member => ({
          ...member,
          progress: Math.floor(Math.random() * 100)
        }));

        return res.json(teamMembersWithProgress);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      return res.status(500).json({ error: "Server error while fetching team members" });
    }
  });

  // Get objectives for the leader's teams
  router.get("/team/objectives", ensureTeamLeader, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ error: "Missing user ID or tenant ID" });
      }

      // Get teams owned by the user
      const userTeams = await db.select({
        id: teams.id
      })
      .from(teams)
      .where(and(
        eq(teams.ownerId, userId),
        eq(teams.tenantId, tenantId)
      ));

      let teamObjectives = [];
      
      if (userTeams.length === 0) {
        // If user doesn't own any teams but is still a team leader (admin/owner),
        // return all objectives in the tenant
        teamObjectives = await db.select({
          id: objectives.id,
          title: objectives.title,
          status: objectives.status,
          progress: objectives.progress,
          ownerId: objectives.ownerId
        })
        .from(objectives)
        .where(eq(objectives.tenantId, tenantId))
        .orderBy(desc(objectives.createdAt))
        .limit(10);
      } else {
        // Get objectives from user's teams
        const teamIds = userTeams.map(team => team.id);
        
        teamObjectives = await db.select({
          id: objectives.id,
          title: objectives.title,
          status: objectives.status,
          progress: objectives.progress,
          ownerId: objectives.ownerId,
          teamId: objectives.teamId
        })
        .from(objectives)
        .where(and(
          eq(objectives.tenantId, tenantId),
          sql`${objectives.teamId} IN (${teamIds.join(',')})`
        ))
        .orderBy(desc(objectives.createdAt))
        .limit(10);
      }

      // Get owner names
      const ownerIds = [...new Set(teamObjectives.map(obj => obj.ownerId))];

      if (ownerIds.length > 0) {
        const owners = await db.select({
          id: users.id,
          name: users.name
        })
        .from(users)
        .where(sql`${users.id} IN (${ownerIds.join(',')})`);

        const ownerMap = new Map(owners.map(owner => [owner.id, owner.name]));

        teamObjectives = teamObjectives.map(obj => ({
          ...obj,
          ownerName: ownerMap.get(obj.ownerId) || 'Unknown'
        }));
      }

      return res.json(teamObjectives);
    } catch (error) {
      console.error("Error fetching team objectives:", error);
      return res.status(500).json({ error: "Server error while fetching team objectives" });
    }
  });

  // Get performance data for the leader's teams
  router.get("/team/performance", ensureTeamLeader, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenant ID" });
      }

      // Get objective status counts for the team
      const results = await db.select({
        status: objectives.status,
        count: sql<number>`count(*)::int`
      })
      .from(objectives)
      .where(eq(objectives.tenantId, tenantId))
      .groupBy(objectives.status);

      // Transform the data for the pie chart
      const colors = {
        'draft': '#9CA3AF',
        'active': '#3B82F6',
        'completed': '#10B981',
        'archived': '#6B7280'
      };

      const performanceData = results.map(item => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        value: item.count,
        color: colors[item.status as keyof typeof colors] || '#9CA3AF'
      }));

      return res.json(performanceData);
    } catch (error) {
      console.error("Error fetching team performance:", error);
      return res.status(500).json({ error: "Server error while fetching team performance" });
    }
  });
}