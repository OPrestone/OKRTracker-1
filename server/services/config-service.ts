import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { ulid } from "ulid";

/**
 * ConfigService handles configuration storage and retrieval, managing both:
 * 1. Tenant-specific settings (stored in database tenant_settings table)
 * 2. Global/system settings (stored in database and/or environment variables)
 */
export class ConfigService {
  /**
   * Get a tenant-specific configuration value
   * @param tenantId The tenant ID
   * @param key The configuration key
   * @param defaultValue Optional default value if not found
   */
  async getTenantConfig<T = any>(
    tenantId: string,
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    try {
      const result = await db.execute(
        sql`SELECT value, value_type FROM tenant_settings WHERE tenant_id = ${tenantId} AND key = ${key} LIMIT 1`
      );
      
      // Convert raw SQL result to array
      const rows = result.rows as any[];
      
      if (!rows || rows.length === 0) {
        return defaultValue;
      }
      
      const setting = rows[0];
      return this.parseValue(setting.value, setting.value_type);
    } catch (error) {
      console.error("Error getting tenant config:", error);
      return defaultValue;
    }
  }

  /**
   * Set a tenant-specific configuration value
   * @param tenantId The tenant ID
   * @param key The configuration key
   * @param value The value to store
   * @param options Additional options
   */
  async setTenantConfig<T = any>(
    tenantId: string,
    key: string,
    value: T,
    options: {
      valueType?: "string" | "number" | "boolean" | "json";
      isSecret?: boolean;
      description?: string;
      createdById?: string;
    } = {}
  ): Promise<void> {
    const { valueType = "string", isSecret = false, description, createdById } = options;

    // Convert value to string based on type
    const stringValue = this.stringifyValue(value, valueType);

    // Check if setting already exists
    const existingSettings = await db.execute(
      sql`SELECT id FROM tenant_settings WHERE tenant_id = ${tenantId} AND key = ${key} LIMIT 1`
    );

    // Convert raw SQL result to usable format
    const rows = existingSettings.rows as any[] || [];
    
    if (rows.length > 0) {
      // Update existing setting
      await db.execute(sql`
        UPDATE tenant_settings
        SET value = ${stringValue},
            value_type = ${valueType},
            is_secret = ${isSecret},
            description = ${description || null},
            updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND key = ${key}
      `);
    } else {
      // Insert new setting
      await db.execute(sql`
        INSERT INTO tenant_settings (
          id, tenant_id, key, value, value_type, is_secret, description, created_by_id
        ) VALUES (
          ${ulid()}, ${tenantId}, ${key}, ${stringValue}, ${valueType}, ${isSecret}, 
          ${description || null}, ${createdById || null}
        )
      `);
    }
  }

  /**
   * Get all configuration values for a tenant
   * @param tenantId The tenant ID
   */
  async getAllTenantConfigs(tenantId: string): Promise<Record<string, any>> {
    const results = await db.execute(
      sql`SELECT key, value, value_type FROM tenant_settings WHERE tenant_id = ${tenantId}`
    );

    const configs: Record<string, any> = {};
    const rows = results.rows as any[] || [];

    for (const setting of rows) {
      configs[setting.key] = this.parseValue(setting.value, setting.value_type);
    }

    return configs;
  }

  /**
   * Delete a tenant configuration
   * @param tenantId The tenant ID
   * @param key The configuration key
   */
  async deleteTenantConfig(tenantId: string, key: string): Promise<void> {
    await db.execute(
      sql`DELETE FROM tenant_settings WHERE tenant_id = ${tenantId} AND key = ${key}`
    );
  }

  /**
   * Get a system-wide configuration value
   * @param key The configuration key
   * @param defaultValue Optional default value if not found
   */
  async getSystemConfig<T = any>(
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    // First check if there's a system setting that uses env variable
    const result = await db.execute(
      sql`SELECT value, value_type, use_env, env_name FROM system_settings WHERE key = ${key} LIMIT 1`
    );

    const rows = result.rows as any[] || [];
    
    if (rows.length === 0) {
      return defaultValue;
    }

    const setting = rows[0];

    // If setting is configured to use env variable and it exists, use that
    if (setting.use_env && setting.env_name && process.env[setting.env_name]) {
      return this.parseValue(process.env[setting.env_name] || null, setting.value_type);
    }

    // Otherwise use the database value
    return this.parseValue(setting.value, setting.value_type);
  }

  /**
   * Set a system-wide configuration value
   * @param key The configuration key
   * @param value The value to store
   * @param options Additional options
   */
  async setSystemConfig<T = any>(
    key: string,
    value: T,
    options: {
      valueType?: "string" | "number" | "boolean" | "json";
      isSecret?: boolean;
      useEnv?: boolean;
      envName?: string;
      description?: string;
      createdById?: string;
    } = {}
  ): Promise<void> {
    const {
      valueType = "string",
      isSecret = false,
      useEnv = false,
      envName,
      description,
      createdById,
    } = options;

    // Convert value to string based on type
    const stringValue = this.stringifyValue(value, valueType);

    // Check if setting already exists
    const existingSettings = await db.execute(
      sql`SELECT id FROM system_settings WHERE key = ${key} LIMIT 1`
    );
    
    const rows = existingSettings.rows as any[] || [];
    
    if (rows.length > 0) {
      // Update existing setting
      await db.execute(sql`
        UPDATE system_settings
        SET value = ${stringValue},
            value_type = ${valueType},
            is_secret = ${isSecret},
            use_env = ${useEnv},
            env_name = ${envName || null},
            description = ${description || null},
            updated_at = NOW()
        WHERE key = ${key}
      `);
    } else {
      // Insert new setting
      await db.execute(sql`
        INSERT INTO system_settings (
          id, key, value, value_type, is_secret, use_env, env_name, description, created_by_id
        ) VALUES (
          ${ulid()}, ${key}, ${stringValue}, ${valueType}, ${isSecret}, ${useEnv},
          ${envName || null}, ${description || null}, ${createdById || null}
        )
      `);
    }
  }

  /**
   * Get all system-wide configuration values
   */
  async getAllSystemConfigs(): Promise<Record<string, any>> {
    const results = await db.execute(
      sql`SELECT key, value, value_type, use_env, env_name FROM system_settings`
    );

    const configs: Record<string, any> = {};
    const rows = results.rows as any[] || [];

    for (const setting of rows) {
      // If setting uses env variable and it exists, use that
      if (setting.use_env && setting.env_name && process.env[setting.env_name]) {
        configs[setting.key] = this.parseValue(
          process.env[setting.env_name] || null,
          setting.value_type
        );
      } else {
        // Otherwise use the database value
        configs[setting.key] = this.parseValue(setting.value, setting.value_type);
      }
    }

    return configs;
  }

  /**
   * Delete a system configuration
   * @param key The configuration key
   */
  async deleteSystemConfig(key: string): Promise<void> {
    await db.execute(sql`DELETE FROM system_settings WHERE key = ${key}`);
  }

  /**
   * Parse a string value based on its type
   */
  private parseValue(value: string | null, valueType: string = "string"): any {
    if (value === null) return null;

    switch (valueType) {
      case "number":
        return parseFloat(value);
      case "boolean":
        return value.toLowerCase() === "true";
      case "json":
        try {
          return JSON.parse(value);
        } catch (e) {
          console.error("Error parsing JSON config value:", e);
          return null;
        }
      case "string":
      default:
        return value;
    }
  }

  /**
   * Convert a value to string based on its type
   */
  private stringifyValue(
    value: any,
    valueType: "string" | "number" | "boolean" | "json" = "string"
  ): string {
    if (value === null || value === undefined) return "";

    switch (valueType) {
      case "json":
        return JSON.stringify(value);
      case "boolean":
      case "number":
      case "string":
      default:
        return String(value);
    }
  }
}

// Export a singleton instance
export const configService = new ConfigService();