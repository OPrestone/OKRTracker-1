import { Request, Response } from "express";
import { db } from "../db";
import { users, usersToTenants, teams, tenants } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { hashPassword } from "../auth";

export async function createTestTeamLeader(req: Request, res: Response) {
  try {
    // Create a test team leader account
    const testPassword = await hashPassword("password123");
    
    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, "teamleader@test.com")
    });
    
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "Test team leader account already exists",
        user: {
          id: existingUser.id,
          email: existingUser.email,
          username: existingUser.username
        }
      });
    }
    
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        id: ulid(),
        email: "teamleader@test.com",
        username: "teamleader",
        password: testPassword,
        firstName: "Team",
        lastName: "Leader",
        role: "team_leader",
        createdAt: new Date(),
      })
      .returning();
    
    // Create or use test tenant
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.name, "Test Organization")
    });
    
    const tenantId = existingTenant ? existingTenant.id : ulid();
    
    if (!existingTenant) {
      await db
        .insert(tenants)
        .values({
          id: tenantId,
          name: "Test Organization",
          slug: "test-org",
          createdAt: new Date(),
          createdById: newUser.id
        });
    }
    
    // Assign user to tenant with team_leader role
    await db
      .insert(usersToTenants)
      .values({
        userId: newUser.id,
        tenantId: tenantId,
        role: "team_leader",
        isDefault: true,
        createdAt: new Date()
      });
    
    // Create test team
    const [team] = await db
      .insert(teams)
      .values({
        id: ulid(),
        name: "Test Team",
        description: "A team for testing",
        tenantId: tenantId,
        createdById: newUser.id,
        createdAt: new Date()
      })
      .returning();
    
    // Connect user to team by setting the teamId field in the users table
    // Since we don't have a separate team_members table, users are part of teams directly
    await db
      .update(users)
      .set({
        teamId: team.id, 
        role: "team_leader" // Set the user's role to team leader
      })
      .where(eq(users.id, newUser.id));
      
    // Create some test team members
    const testMembers = [
      { name: "Emily Johnson", role: "developer" },
      { name: "Michael Chen", role: "designer" },
      { name: "Sarah Williams", role: "product_manager" },
      { name: "James Rodriguez", role: "developer" },
      { name: "Alex Kim", role: "qa_tester" }
    ];
    
    for (const testMember of testMembers) {
      const [member] = await db
        .insert(users)
        .values({
          id: ulid(),
          email: `${testMember.name.toLowerCase().replace(' ', '.')}@test.com`,
          username: testMember.name.toLowerCase().replace(' ', '.'),
          password: await hashPassword("password123"),
          firstName: testMember.name.split(' ')[0],
          lastName: testMember.name.split(' ')[1],
          role: testMember.role,
          teamId: team.id, // Assign directly to the team
          createdAt: new Date(),
          name: testMember.name, // Set full name
          tenantId: tenantId // Set tenant ID
        })
        .returning();
      
      // Assign to tenant
      await db
        .insert(usersToTenants)
        .values({
          userId: member.id,
          tenantId: tenantId,
          role: "member",
          isDefault: true,
          createdAt: new Date()
        });
    }
    
    // Return success with user details
    return res.status(200).json({
      success: true,
      message: "Test team leader account and team created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      },
      team: {
        id: team.id,
        name: team.name
      },
      login: {
        username: "teamleader",
        password: "password123"
      }
    });
  } catch (error) {
    console.error("Error creating test team leader:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating test team leader account",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}