import { 
  InsertTenant, 
  InsertUserToTenant, 
  Tenant, 
  User, 
  UserToTenant,
  tenants,
  usersToTenants,
  insertTenantSchema,
  insertUserToTenantSchema
} from '@shared/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import slugify from 'slugify';
import { stripeService } from './stripe-service';

class TenantService {
  // Create a new tenant
  async createTenant(
    tenantData: Omit<InsertTenant, 'slug'>, 
    user: User, 
    userRole: 'owner' | 'admin' | 'member' = 'owner'
  ): Promise<{ tenant: Tenant, userToTenant: UserToTenant }> {
    try {
      // Check if user has permission to create tenants (only admins can)
      if (user.role !== 'admin') {
        throw new Error('Only administrators can create organizations');
      }
      
      // Generate a slug from the name
      const slug = slugify(tenantData.name, { 
        lower: true, 
        strict: true,
        trim: true
      });
      
      // Ensure slug is unique by adding a random suffix if needed
      let finalSlug = slug;
      const existingTenant = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug));
      
      if (existingTenant.length > 0) {
        // Add random suffix
        finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Create the tenant
      const validatedTenantData = insertTenantSchema.parse({
        ...tenantData,
        slug: finalSlug
      });
      
      const [tenant] = await db.insert(tenants).values(validatedTenantData).returning();
      
      // Link the user to the tenant
      const userToTenantData = insertUserToTenantSchema.parse({
        userId: user.id,
        tenantId: tenant.id,
        role: userRole,
        isDefault: true
      });
      
      const [userToTenant] = await db.insert(usersToTenants).values(userToTenantData).returning();
      
      return { tenant, userToTenant };
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }
  
  // Get tenant by ID
  async getTenantById(id: number): Promise<Tenant | undefined> {
    try {
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
  async getUserTenants(userId: number): Promise<(Tenant & { userRole: string })[]> {
    try {
      const result = await db
        .select({
          ...tenants,
          userRole: usersToTenants.role
        })
        .from(tenants)
        .innerJoin(usersToTenants, eq(usersToTenants.tenantId, tenants.id))
        .where(eq(usersToTenants.userId, userId));
      
      return result;
    } catch (error) {
      console.error('Error getting user tenants:', error);
      throw error;
    }
  }
  
  // Get user's default tenant
  async getUserDefaultTenant(userId: number): Promise<(Tenant & { userRole: string }) | undefined> {
    try {
      const [result] = await db
        .select({
          ...tenants,
          userRole: usersToTenants.role
        })
        .from(tenants)
        .innerJoin(usersToTenants, eq(usersToTenants.tenantId, tenants.id))
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.isDefault, true)
        ));
      
      return result;
    } catch (error) {
      console.error('Error getting user default tenant:', error);
      throw error;
    }
  }
  
  // Set a tenant as the default for a user
  async setDefaultTenant(userId: number, tenantId: number): Promise<void> {
    try {
      // First, unset all defaults
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
  async updateTenant(id: number, data: Partial<InsertTenant>): Promise<Tenant> {
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
    userId: number, 
    tenantId: number, 
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
      
      const userCount = await db
        .select({ count: sql`count(*)` })
        .from(usersToTenants)
        .where(eq(usersToTenants.tenantId, tenantId));
      
      if (userCount[0].count >= tenant.maxUsers) {
        throw new Error(`Tenant has reached the maximum number of users (${tenant.maxUsers})`);
      }
      
      // If this is the default tenant for the user, unset any existing default
      if (isDefault) {
        await db
          .update(usersToTenants)
          .set({ isDefault: false })
          .where(eq(usersToTenants.userId, userId));
      }
      
      // Add user to tenant
      const userToTenantData = insertUserToTenantSchema.parse({
        userId,
        tenantId,
        role,
        isDefault
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
  async removeUserFromTenant(userId: number, tenantId: number): Promise<void> {
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
        // Count how many owners the tenant has
        const ownerCount = await db
          .select({ count: sql`count(*)` })
          .from(usersToTenants)
          .where(and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.role, 'owner')
          ));
        
        if (ownerCount[0].count <= 1) {
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
    tenantId: number, 
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
    tenantId: number,
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
  async getTenantMembers(tenantId: number) {
    try {
      const members = await db
        .select({
          id: usersToTenants.id,
          userId: usersToTenants.userId,
          role: usersToTenants.role,
          isDefault: usersToTenants.isDefault,
          createdAt: usersToTenants.createdAt,
          user: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(usersToTenants)
        .innerJoin('users', eq(usersToTenants.userId, users.id))
        .where(eq(usersToTenants.tenantId, tenantId));
      
      return members;
    } catch (error) {
      console.error('Error getting tenant members:', error);
      throw error;
    }
  }
}

export const tenantService = new TenantService();