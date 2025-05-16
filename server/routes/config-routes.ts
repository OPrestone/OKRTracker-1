import { Express } from "express";
import { configService } from "../services/config-service";
import { withTenant } from "../middleware/tenant-middleware";
import { z } from "zod";

// Schema for tenant config settings
const tenantConfigSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  valueType: z.enum(["string", "number", "boolean", "json"]).default("string"),
  isSecret: z.boolean().default(false),
  description: z.string().optional(),
});

// Schema for system config settings
const systemConfigSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  valueType: z.enum(["string", "number", "boolean", "json"]).default("string"),
  isSecret: z.boolean().default(false),
  useEnv: z.boolean().default(false),
  envName: z.string().optional(),
  description: z.string().optional(),
});

export function registerConfigRoutes(app: Express) {
  // Middleware to check if user is admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { user } = req;
    const isSystemAdmin = user.role === "admin";
    
    // For tenant-specific endpoints, also check tenant role
    if (req.tenantId) {
      const tenantUser = user.tenants?.find((t: any) => t.id === req.tenantId);
      const isTenantAdmin = tenantUser?.userRole === "admin" || tenantUser?.userRole === "owner";
      
      if (!isSystemAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Forbidden: Only admins can manage configurations" });
      }
    } else if (!isSystemAdmin) {
      // For system-wide endpoints, must be system admin
      return res.status(403).json({ error: "Forbidden: Only system admins can manage system configurations" });
    }
    
    next();
  };

  // ===== Tenant Config Routes =====
  
  // Get all tenant configs
  app.get("/api/tenant-config", withTenant, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      const configs = await configService.getAllTenantConfigs(tenantId);
      res.json(configs);
    } catch (error) {
      console.error("Error getting tenant configs:", error);
      res.status(500).json({ error: "Failed to retrieve tenant configurations" });
    }
  });

  // Get specific tenant config
  app.get("/api/tenant-config/:key", withTenant, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      const { key } = req.params;
      const value = await configService.getTenantConfig(tenantId, key);
      
      if (value === undefined) {
        return res.status(404).json({ error: `Configuration '${key}' not found` });
      }
      
      res.json({ key, value });
    } catch (error) {
      console.error(`Error getting tenant config '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to retrieve tenant configuration" });
    }
  });

  // Set tenant config (admin only)
  app.post("/api/tenant-config", [withTenant, isAdmin], async (req, res) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      // Validate request
      const validation = tenantConfigSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }

      const { key, value, valueType, isSecret, description } = validation.data;
      
      await configService.setTenantConfig(tenantId, key, value, {
        valueType, 
        isSecret, 
        description,
        createdById: req.user?.id
      });
      
      res.status(201).json({ message: "Configuration saved successfully" });
    } catch (error) {
      console.error("Error setting tenant config:", error);
      res.status(500).json({ error: "Failed to save tenant configuration" });
    }
  });

  // Delete tenant config (admin only)
  app.delete("/api/tenant-config/:key", [withTenant, isAdmin], async (req, res) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      const { key } = req.params;
      await configService.deleteTenantConfig(tenantId, key);
      
      res.json({ message: "Configuration deleted successfully" });
    } catch (error) {
      console.error(`Error deleting tenant config '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to delete tenant configuration" });
    }
  });

  // ===== System Config Routes =====
  
  // Get all system configs (admin only)
  app.get("/api/system-config", isAdmin, async (req, res) => {
    try {
      const configs = await configService.getAllSystemConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error getting system configs:", error);
      res.status(500).json({ error: "Failed to retrieve system configurations" });
    }
  });

  // Get specific system config (admin only)
  app.get("/api/system-config/:key", isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const value = await configService.getSystemConfig(key);
      
      if (value === undefined) {
        return res.status(404).json({ error: `Configuration '${key}' not found` });
      }
      
      res.json({ key, value });
    } catch (error) {
      console.error(`Error getting system config '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to retrieve system configuration" });
    }
  });

  // Set system config (admin only)
  app.post("/api/system-config", isAdmin, async (req, res) => {
    try {
      // Validate request
      const validation = systemConfigSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }

      const { key, value, valueType, isSecret, useEnv, envName, description } = validation.data;
      
      await configService.setSystemConfig(key, value, {
        valueType, 
        isSecret, 
        useEnv,
        envName,
        description,
        createdById: req.user?.id
      });
      
      res.status(201).json({ message: "Configuration saved successfully" });
    } catch (error) {
      console.error("Error setting system config:", error);
      res.status(500).json({ error: "Failed to save system configuration" });
    }
  });

  // Delete system config (admin only)
  app.delete("/api/system-config/:key", isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      await configService.deleteSystemConfig(key);
      
      res.json({ message: "Configuration deleted successfully" });
    } catch (error) {
      console.error(`Error deleting system config '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to delete system configuration" });
    }
  });
}