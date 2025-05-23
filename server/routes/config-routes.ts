import { Router, Request, Response } from 'express';
import { db } from '../db';
import { z } from 'zod';
import { okrSystemConfigs } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

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
  }),
  integrations: z.object({
    enableSlackIntegration: z.boolean(),
    enableEmailNotifications: z.boolean(),
    enableCalendarSync: z.boolean(),
    enableAnalyticsReporting: z.boolean(),
  }),
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
      console.log("Request body:", req.body);
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Missing tenantId parameter' });
      }
      
      // Validate the request body
      const validationResult = okrSystemSetupSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid OKR system configuration data',
          details: validationResult.error.format()
        });
      }
      
      const okrSystemData = validationResult.data;
      
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
        selected_teams: okrSystemData.teamConfiguration.selectedTeams || [],
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
      
      return res.json(result[0]);
    } catch (error) {
      console.error('Error saving OKR system config:', error);
      return res.status(500).json({ error: 'Failed to save OKR system configuration' });
    }
  });
}