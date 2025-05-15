import { 
  InsertTenant, 
  InsertUserToTenant, 
  Tenant, 
  User, 
  UserToTenant,
  tenants,
  usersToTenants,
  users,
  insertTenantSchema,
  insertUserToTenantSchema
} from '@shared/schema';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import slugify from 'slugify';
import { ulid } from 'ulid';
import { stripeService } from './stripe-service';

class TenantService {
  // Create a new tenant
  async createTenant(
    tenantData: any, // Use any to avoid type issues
    user: any, // Use any to avoid type issues  
    userRole: 'owner' | 'admin' | 'member' = 'owner'
  ): Promise<{ tenant: any, userToTenant: any }> {
    try {
      // Check if user has any tenant connections already
      const userTenants = await this.getUserTenants(user.id);
      
      // If using tenant onboarding, allow creating organization even if user has existing ones
      // Check if this request came from tenant-onboarding (indicated by role = "owner")
      if (userTenants.length > 0 && !user.isAdmin && !user.role?.includes('admin') && userRole !== "owner") {
        throw new Error('Only administrators can create additional organizations');
      }
      
      // Generate a slug from the name
      const slug = slugify(tenantData.name, { 
        lower: true, 
        strict: true,
        trim: true
      });
      
      // Ensure slug is unique by adding a random suffix if needed
      let finalSlug = slug;
      
      // Use raw SQL for compatibility
      const { rows: existingTenants } = await db.execute(
        sql`SELECT id FROM tenants WHERE slug = ${slug} LIMIT 1`
      );
      
      if (existingTenants.length > 0) {
        // Add random suffix
        finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Generate ULID for the tenant ID
      const tenantId = ulid();
      
      // Create the tenant - use the direct SQL query to avoid type issues
      const { rows: [tenant] } = await db.execute(
        sql`INSERT INTO tenants (id, name, display_name, slug, plan, status, max_users, domain, logo_url, settings, enabled_features)
            VALUES (
              ${tenantId},
              ${tenantData.name}, 
              ${tenantData.displayName || tenantData.name}, 
              ${finalSlug}, 
              ${tenantData.plan || 'free'}, 
              ${tenantData.status || 'active'}, 
              ${tenantData.maxUsers || 5}, 
              ${tenantData.domain || null},
              ${tenantData.logoUrl || null},
              ${tenantData.settings ? JSON.stringify(tenantData.settings) : JSON.stringify({})},
              ${tenantData.enabledFeatures ? JSON.stringify(tenantData.enabledFeatures) : JSON.stringify([])}
            )
            RETURNING *`
      );
      
      // Link the user to the tenant with a unique ID
      const userToTenantId = ulid();
      const { rows: [userToTenant] } = await db.execute(
        sql`INSERT INTO users_to_tenants (id, user_id, tenant_id, role, is_default)
            VALUES (${userToTenantId}, ${user.id}, ${tenant.id}, ${userRole}, TRUE)
            RETURNING *`
      );
      
      return { tenant, userToTenant };
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }
  
  // Get tenant by ID
  async getTenantById(id: string): Promise<Tenant | undefined> {
    try {
      // Input validation - ensure id is not empty
      if (!id) {
        console.error(`Invalid tenant ID: ${id}`);
        return undefined;
      }

      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
      return tenant;
    } catch (error) {
      console.error('Error getting tenant by ID:', error);
      throw error;
    }
  }
  
  // Get tenant by slug
  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    try {
      const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
      return tenant;
    } catch (error) {
      console.error('Error getting tenant by slug:', error);
      throw error;
    }
  }
  
  // Get all tenants for a user
  async getUserTenants(userId: string): Promise<(Tenant & { userRole: string })[]> {
    try {
      // Using a raw SQL query to avoid schema property name mismatches
      const result = await db.execute(
        sql`SELECT t.*, ut.role as "userRole" 
            FROM tenants t 
            INNER JOIN users_to_tenants ut ON t.id = ut.tenant_id 
            WHERE ut.user_id = ${userId}`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user tenants:', error);
      throw error;
    }
  }
  
  // Get user's default tenant
  async getUserDefaultTenant(userId: string): Promise<(Tenant & { userRole: string }) | undefined> {
    try {
      // Using a raw SQL query to avoid schema property name mismatches
      const result = await db.execute(
        sql`SELECT t.*, ut.role as "userRole" 
            FROM tenants t 
            INNER JOIN users_to_tenants ut ON t.id = ut.tenant_id 
            WHERE ut.user_id = ${userId} AND ut.is_default = true 
            LIMIT 1`
      );
      
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error('Error getting user default tenant:', error);
      throw error;
    }
  }
  
  // Set a tenant as the default for a user
  async setDefaultTenant(userId: string, tenantId: string): Promise<void> {
    try {
      // First, unset all defaults using ORM
      await db
        .update(usersToTenants)
        .set({ isDefault: false })
        .where(eq(usersToTenants.userId, userId));
      
      // Then set the new default
      await db
        .update(usersToTenants)
        .set({ isDefault: true })
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        ));
    } catch (error) {
      console.error('Error setting default tenant:', error);
      throw error;
    }
  }
  
  // Update tenant
  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant> {
    try {
      // Don't allow updating the slug directly
      const { slug, ...updateData } = data;
      
      const [tenant] = await db
        .update(tenants)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(tenants.id, id))
        .returning();
      
      return tenant;
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  }
  
  // Add a user to a tenant
  async addUserToTenant(
    userId: string, 
    tenantId: string, 
    role: 'owner' | 'admin' | 'member' = 'member',
    isDefault = false
  ): Promise<UserToTenant> {
    try {
      // Check if user already belongs to this tenant
      const existingMembership = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        ));
      
      if (existingMembership.length > 0) {
        throw new Error('User is already a member of this tenant');
      }
      
      // Check if tenant has reached the maximum number of users
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Use SQL directly to get the count to avoid type issues
      const { rows } = await db.execute(
        sql`SELECT COUNT(*) as count FROM users_to_tenants WHERE tenant_id = ${tenantId}`
      );
      
      const count = parseInt(rows[0].count);
      const maxUsers = tenant.max_users || 5; // Fallback to 5 if not defined
      
      if (count >= maxUsers) {
        throw new Error(`Tenant has reached the maximum number of users (${maxUsers})`);
      }
      
      // If this is the default tenant for the user, unset any existing default
      if (isDefault) {
        await db
          .update(usersToTenants)
          .set({ isDefault: false })
          .where(eq(usersToTenants.userId, userId));
      }
      
      // Import ulid to generate IDs
      const { ulid } = await import("ulid");
      
      // Add user to tenant with an explicit ID
      const userToTenantData = insertUserToTenantSchema.parse({
        id: ulid(), // Generate a ULID for the relationship
        userId,
        tenantId,
        role,
        isDefault,
        createdAt: new Date()
      });
      
      const [userToTenant] = await db
        .insert(usersToTenants)
        .values(userToTenantData)
        .returning();
      
      return userToTenant;
    } catch (error) {
      console.error('Error adding user to tenant:', error);
      throw error;
    }
  }
  
  // Remove a user from a tenant
  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    try {
      // Check if user is the owner of the tenant
      const [userMembership] = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        ));
      
      if (!userMembership) {
        throw new Error('User is not a member of this tenant');
      }
      
      if (userMembership.role === 'owner') {
        // Count how many owners the tenant has - using raw SQL to avoid type issues
        const { rows } = await db.execute(
          sql`SELECT COUNT(*) as count 
              FROM users_to_tenants 
              WHERE tenant_id = ${tenantId} AND role = 'owner'`
        );
        
        const ownerCount = parseInt(rows[0].count);
        if (ownerCount <= 1) {
          throw new Error('Cannot remove the only owner of a tenant');
        }
      }
      
      // Remove user from tenant
      await db
        .delete(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        ));
      
      // If this was the user's default tenant, set a new default if possible
      if (userMembership.isDefault) {
        const [otherMembership] = await db
          .select()
          .from(usersToTenants)
          .where(eq(usersToTenants.userId, userId));
        
        if (otherMembership) {
          await db
            .update(usersToTenants)
            .set({ isDefault: true })
            .where(eq(usersToTenants.id, otherMembership.id));
        }
      }
    } catch (error) {
      console.error('Error removing user from tenant:', error);
      throw error;
    }
  }
  
  // Create subscription for a tenant
  async createSubscription(
    tenantId: string, 
    plan: 'free' | 'starter' | 'professional' | 'enterprise',
    user: User
  ) {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // For free plan, no need to interact with Stripe
      if (plan === 'free') {
        await db
          .update(tenants)
          .set({ 
            plan: 'free', 
            status: 'active',
            maxUsers: 5
          })
          .where(eq(tenants.id, tenantId));
        
        return { success: true, plan: 'free' };
      }
      
      // Create a Stripe customer for the tenant
      const customer = await stripeService.createCustomer(tenant, user);
      
      // Create a subscription
      const subscription = await stripeService.createSubscription(
        tenantId,
        plan as 'starter' | 'professional' | 'enterprise',
        customer.id
      );
      
      return {
        success: true,
        plan,
        clientSecret: subscription?.clientSecret,
        subscriptionId: subscription?.subscription.id
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }
  
  // Update tenant subscription plan
  async updateSubscriptionPlan(
    tenantId: string,
    newPlan: 'free' | 'starter' | 'professional' | 'enterprise'
  ) {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Find the subscription for this tenant
      const [subscription] = await db
        .select()
        .from(tenants.subscriptions)
        .where(eq(tenants.subscriptions.tenantId, tenantId));
      
      if (!subscription && newPlan !== 'free') {
        throw new Error('No existing subscription found for this tenant');
      }
      
      if (!subscription && newPlan === 'free') {
        // Just update the tenant plan to free
        await db
          .update(tenants)
          .set({ 
            plan: 'free', 
            status: 'active',
            maxUsers: 5
          })
          .where(eq(tenants.id, tenantId));
        
        return { success: true, plan: 'free' };
      }
      
      // Update the subscription plan in Stripe
      const result = await stripeService.updateSubscriptionPlan(
        tenantId,
        subscription.stripeSubscriptionId,
        newPlan
      );
      
      return {
        success: true,
        plan: newPlan,
        status: result.status
      };
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }
  
  // Get tenant members
  async getTenantMembers(tenantId: string) {
    try {
      // Using a raw SQL query to avoid schema property name mismatches
      const result = await db.execute(
        sql`SELECT ut.*, 
            json_build_object(
              'id', u.id,
              'username', u.username,
              'name', u.name,
              'email', u.email
            ) as "user"
            FROM users_to_tenants ut
            INNER JOIN users u ON ut.user_id = u.id
            WHERE ut.tenant_id = ${tenantId}`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting tenant members:', error);
      throw error;
    }
  }
  
  // Invite a user to a tenant
  async inviteUserToTenant(
    email: string,
    tenantId: string,
    role: 'owner' | 'admin' | 'member' = 'member'
  ): Promise<any> {
    try {
      // First, check if the user already exists
      const { rows: existingUsers } = await db.execute(
        sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
      );
      
      let userId: string;
      
      if (existingUsers.length > 0) {
        // User exists, get their ID
        userId = existingUsers[0].id;
        
        // Check if they're already in this tenant
        const { rows: existingMembership } = await db.execute(
          sql`SELECT * FROM users_to_tenants 
              WHERE user_id = ${userId} AND tenant_id = ${tenantId} 
              LIMIT 1`
        );
        
        if (existingMembership.length > 0) {
          // Update role if different
          if (existingMembership[0].role !== role) {
            await db.execute(
              sql`UPDATE users_to_tenants 
                  SET role = ${role} 
                  WHERE user_id = ${userId} AND tenant_id = ${tenantId}`
            );
          }
          
          return { success: true, message: 'User role updated', user: existingUsers[0] };
        }
      } else {
        // User doesn't exist, create them
        const tempPassword = Math.random().toString(36).substring(2, 15);
        userId = ulid();
        
        await db.execute(
          sql`INSERT INTO users (id, email, username, password, name)
              VALUES (
                ${userId}, 
                ${email}, 
                ${email.split('@')[0]}, 
                ${'temppassword'}, 
                ${email.split('@')[0]}
              )`
        );
        
        // Import email service for sending invitation emails
        const { emailService } = await import('./email-service');
        
        // Send invitation email
        await emailService.sendTenantInvitationEmail(
          email,
          tenantId,
          role
        );
      }
      
      // Add user to tenant
      const userToTenantId = ulid();
      
      await db.execute(
        sql`INSERT INTO users_to_tenants (id, user_id, tenant_id, role, is_default)
            VALUES (${userToTenantId}, ${userId}, ${tenantId}, ${role}, FALSE)`
      );
      
      return { success: true, message: 'User invited successfully' };
    } catch (error) {
      console.error('Error inviting user to tenant:', error);
      throw error;
    }
  }
}

export const tenantService = new TenantService();