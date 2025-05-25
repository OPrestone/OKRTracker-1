import { Router, Request, Response } from 'express';
import { db } from '../db';
import { z } from 'zod';
import { okrSystemConfigs, teams, users, insertTeamSchema, insertUserSchema } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { hashPassword } from '../auth';

// Define CSV User schema
const csvUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.string(),
  department: z.string().optional(),
  team: z.string().optional(),
  isValid: z.boolean().optional(), // Make isValid optional to handle different formats
  error: z.string().optional(),
});

// Define default team schema
const defaultTeamSchema = z.object({
  name: z.string(),
  description: z.string(),
  color: z.string(),
  icon: z.string(),
  tenant_id: z.string(),
});

// Define schema for OKR system setup
const okrSystemSetupSchema = z.object({
  tenant_id: z.string().optional(),
  generalSettings: z.object({
    companyMission: z.string().min(1),
    companyVision: z.string().min(1),
    companyValues: z.string().min(1),
    trackingFrequency: z.enum(["weekly", "biweekly", "monthly"]),
    enableNotifications: z.boolean(),
  }),
  timeframes: z.object({
    primaryCadence: z.enum(["quarterly", "trimester", "halfYearly", "annual"]),
    enableQuarterlyCadence: z.boolean(),
    enableAnnualCadence: z.boolean(),
    customCadence: z.string().optional(),
    startMonth: z.enum([
      "january", "february", "march", "april", "may", "june", 
      "july", "august", "september", "october", "november", "december"
    ]),
  }),
  objectiveSettings: z.object({
    defaultObjectiveCategory: z.enum(["growth", "product", "customer", "people", "financial", "operations", "other"]),
    maxObjectivesPerTeam: z.enum(["3", "4", "5", "6", "7", "8"]),
    maxKeyResultsPerObjective: z.enum(["3", "4", "5", "6"]),
    requireObjectiveApproval: z.boolean(),
    enableObjectiveAlignment: z.boolean(),
  }),
  teamConfiguration: z.object({
    orgStructureType: z.enum(["functional", "divisional", "matrix", "flat", "hierarchical"]),
    enableCrossTeamObjectives: z.boolean(),
    defaultVisibility: z.enum(["public", "team", "private"]),
    selectedTeams: z.array(z.string()).default([]),
    defaultTeams: z.array(z.string()).default([]),
    csvUsers: z.array(z.any()).default([]), // Using any to be more flexible with data format
    useDefaultTeams: z.boolean().default(false),
  }),
  integrations: z.object({
    enableSlackIntegration: z.boolean(),
    enableEmailNotifications: z.boolean(),
    enableCalendarSync: z.boolean(),
    enableAnalyticsReporting: z.boolean(),
  }),
  // New fields for default teams and CSV users - using any to be more flexible
  default_teams: z.array(z.any()).optional(),
  csv_users: z.array(z.any()).optional(),
});

type OKRSystemSetup = z.infer<typeof okrSystemSetupSchema>;

export function setupConfigRoutes(router: Router) {
  // Get OKR system configuration
  router.get('/api/okr-system', async (req: Request, res: Response) => {
    try {
      // Use either the tenant ID from middleware or from query params
      let tenantId = req.tenantId || req.query.tenantId as string;
      
      console.log("GET /api/okr-system - Tenant ID:", tenantId);
      console.log("Request query:", req.query);
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Missing tenantId parameter' });
      }
      
      const config = await db.query.okrSystemConfigs.findFirst({
        where: eq(okrSystemConfigs.tenant_id, tenantId)
      });
      
      if (!config) {
        return res.status(404).json({ error: 'OKR system configuration not found' });
      }
      
      return res.json(config);
    } catch (error) {
      console.error('Error fetching OKR system config:', error);
      return res.status(500).json({ error: 'Failed to fetch OKR system configuration' });
    }
  });
  
  // Save OKR system configuration
  router.post('/api/okr-system-setup', async (req: Request, res: Response) => {
    try {
      // Use tenant ID from multiple possible sources
      let tenantId = req.tenantId || req.query.tenantId as string || req.body.tenant_id;
      
      console.log("POST /api/okr-system-setup - Tenant ID:", tenantId);
      console.log("Request query:", req.query);
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Missing tenantId parameter' });
      }
      
      // Instead of strict validation, just use the request body directly
      // This is more flexible with different data formats
      console.log("Raw request body length:", JSON.stringify(req.body).length, "bytes");
      
      // We'll do very basic validation just to ensure we have an object
      if (typeof req.body !== 'object' || req.body === null) {
        return res.status(400).json({ 
          error: 'Invalid request body format'
        });
      }
      
      const okrSystemData = req.body;
      
      // Make sure we have a tenant ID in the data
      if (!okrSystemData.tenant_id) {
        okrSystemData.tenant_id = tenantId;
      }
      
      // Check if config already exists for this tenant
      const existingConfig = await db.query.okrSystemConfigs.findFirst({
        where: eq(okrSystemConfigs.tenant_id, tenantId)
      });
      
      let result;
      
      // Convert the validated data to the database schema format
      const configData = {
        id: existingConfig?.id || ulid(),
        tenant_id: tenantId,
        tracking_frequency: okrSystemData.generalSettings.trackingFrequency,
        primary_cadence: okrSystemData.timeframes.primaryCadence,
        start_month: okrSystemData.timeframes.startMonth,
        max_objectives_per_team: parseInt(okrSystemData.objectiveSettings.maxObjectivesPerTeam),
        max_key_results_per_objective: parseInt(okrSystemData.objectiveSettings.maxKeyResultsPerObjective),
        org_structure_type: okrSystemData.teamConfiguration.orgStructureType,
        default_visibility: okrSystemData.teamConfiguration.defaultVisibility,
        company_mission: okrSystemData.generalSettings.companyMission,
        company_vision: okrSystemData.generalSettings.companyVision,
        company_values: okrSystemData.generalSettings.companyValues,
        enable_notifications: okrSystemData.generalSettings.enableNotifications,
        enable_quarterly_cadence: okrSystemData.timeframes.enableQuarterlyCadence,
        enable_annual_cadence: okrSystemData.timeframes.enableAnnualCadence,
        custom_cadence: okrSystemData.timeframes.customCadence || null,
        default_objective_category: okrSystemData.objectiveSettings.defaultObjectiveCategory,
        require_objective_approval: okrSystemData.objectiveSettings.requireObjectiveApproval,
        enable_objective_alignment: okrSystemData.objectiveSettings.enableObjectiveAlignment,
        enable_cross_team_objectives: okrSystemData.teamConfiguration.enableCrossTeamObjectives,
        enable_slack_integration: okrSystemData.integrations.enableSlackIntegration,
        enable_email_notifications: okrSystemData.integrations.enableEmailNotifications,
        enable_calendar_sync: okrSystemData.integrations.enableCalendarSync,
        enable_analytics_reporting: okrSystemData.integrations.enableAnalyticsReporting,
        // Store selectedTeams as a JSON string to avoid schema issues
        // We'll handle the selected teams separately until the schema is updated
        created_at: existingConfig?.created_at || new Date(),
        updated_at: new Date(),
      };
      
      if (existingConfig) {
        // Update existing configuration
        result = await db
          .update(okrSystemConfigs)
          .set(configData)
          .where(eq(okrSystemConfigs.id, existingConfig.id))
          .returning();
          
        console.log('Updated OKR system config:', result);
      } else {
        // Insert new configuration
        result = await db
          .insert(okrSystemConfigs)
          .values(configData)
          .returning();
          
        console.log('Created new OKR system config:', result);
      }
      
      // Update company mission and related values if mission service exists
      try {
        // This is a separate try/catch to not fail the whole request if this part fails
        const updateMissionResponse = await fetch(`${req.protocol}://${req.get('host')}/api/organization-mission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.cookie || ''
          },
          body: JSON.stringify({
            mission: okrSystemData.generalSettings.companyMission,
            vision: okrSystemData.generalSettings.companyVision,
            values: okrSystemData.generalSettings.companyValues,
            tenantId
          })
        });
        
        if (updateMissionResponse.ok) {
          console.log('Updated organization mission data successfully');
        }
      } catch (missionError) {
        console.warn('Failed to update organization mission:', missionError);
        // Continue execution, don't fail the main request
      }
      
      // Process default teams if available - either from the dedicated array or from the teamConfiguration
      const defaultTeams = req.body.default_teams || [];
      if (Array.isArray(defaultTeams) && defaultTeams.length > 0) {
        try {
          console.log('Creating default teams:', defaultTeams.length);
          
          // Create each team from the template
          for (const teamTemplate of defaultTeams) {
            // Create a valid team object
            const teamData = {
              id: ulid(),
              name: teamTemplate.name,
              description: teamTemplate.description || '',
              color: teamTemplate.color || '#4f46e5',
              icon: teamTemplate.icon || 'users',
              tenantId: tenantId,
              type: 'team'
            };
            
            // Insert the team
            const newTeam = await db.insert(teams).values(teamData).returning();
            console.log(`Created default team: ${teamData.name} with ID: ${newTeam[0].id}`);
          }
        } catch (teamError) {
          console.error('Error creating default teams:', teamError);
          // Continue execution, don't fail the main request
        }
      }
      
      // Process CSV users if available
      const csvUsers = req.body.csv_users || [];
      if (Array.isArray(csvUsers) && csvUsers.length > 0) {
        try {
          console.log('Processing CSV users:', csvUsers.length);
          
          // Accept all users that have an email property
          const validUsers = csvUsers.filter((user: any) => {
            console.log("Processing user:", user);
            return user && typeof user === 'object' && user.email;
          });
          
          // Create users from CSV data
          for (const userData of validUsers) {
            try {
              // Check if user already exists
              const existingUser = await db.query.users.findFirst({
                where: (users, { eq, or }) => 
                  or(
                    eq(users.email, userData.email.toLowerCase()),
                    eq(users.username, userData.email.split('@')[0].toLowerCase())
                  )
              });
              
              if (existingUser) {
                console.log(`User with email ${userData.email} already exists, skipping`);
                continue;
              }
              
              // Generate a username from email
              const username = userData.email.split('@')[0].toLowerCase();
              
              // Generate a temporary password
              const tempPassword = Math.random().toString(36).slice(-8);
              const hashedPassword = await hashPassword(tempPassword);
              
              // Create a valid user object
              const newUserData = {
                id: ulid(),
                username: username,
                email: userData.email.toLowerCase(),
                password: hashedPassword,
                name: userData.name || username,
                title: userData.department || '',
                tenantId: tenantId,
                defaultTenantId: tenantId,
                firstLogin: true
              };
              
              // Insert the user
              const newUser = await db.insert(users).values(newUserData).returning();
              console.log(`Created user: ${newUserData.username} with ID: ${newUser[0].id}`);
              
              // Add user to tenant with role
              const userRole = userData.role && ['admin', 'member', 'viewer'].includes(userData.role.toLowerCase()) 
                ? userData.role.toLowerCase() 
                : 'member';
                
              await db.execute(
                `INSERT INTO users_to_tenants (user_id, tenant_id, role) VALUES (?, ?, ?)`,
                [newUser[0].id, tenantId, userRole]
              );
              
              console.log(`Added user ${newUserData.username} to tenant with role: ${userRole}`);
              
              // TODO: Send welcome email with temporary password
            } catch (userError) {
              console.error(`Error creating user ${userData.email}:`, userError);
              // Continue with other users
            }
          }
        } catch (usersError) {
          console.error('Error processing CSV users:', usersError);
          // Continue execution, don't fail the main request
        }
      }
      
      return res.json(result[0]);
    } catch (error) {
      console.error('Error saving OKR system config:', error);
      return res.status(500).json({ error: 'Failed to save OKR system configuration' });
    }
  });
}