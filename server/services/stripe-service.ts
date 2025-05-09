import Stripe from 'stripe';
import { User, Tenant, insertPaymentHistorySchema, insertSubscriptionSchema } from '@shared/schema';
import { db } from '../db';
import { subscriptions, paymentHistory, usersToTenants, tenants } from '@shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Payment functionality will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })
  : null;

// Price IDs for different subscription plans
const PRICE_IDS = {
  free: 'free',
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise'
};

// Maximum users for each plan
const MAX_USERS = {
  free: 5,
  starter: 20,
  professional: 50,
  enterprise: 500
};

class StripeService {
  // Create a Stripe customer for a tenant
  async createCustomer(tenant: Tenant, user: User) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    try {
      const customer = await stripe.customers.create({
        name: tenant.name,
        email: user.email,
        metadata: {
          tenantId: tenant.id.toString(),
          tenantSlug: tenant.slug
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription for a tenant
  async createSubscription(tenantId: number, plan: 'starter' | 'professional' | 'enterprise', customerId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    if (plan === 'free') {
      // For free plan, just update the tenant in database
      await db.update(tenants)
        .set({ 
          plan: 'free', 
          status: 'active', 
          maxUsers: MAX_USERS.free
        })
        .where(eq(tenants.id, tenantId));

      return null;
    }

    try {
      // Create a subscription with a trial period
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: PRICE_IDS[plan],
          },
        ],
        trial_period_days: 14,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription info to database
      const subscriptionData = insertSubscriptionSchema.parse({
        tenantId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: PRICE_IDS[plan],
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      const [savedSubscription] = await db.insert(subscriptions)
        .values(subscriptionData)
        .returning();

      // Update tenant with new plan and status
      await db.update(tenants)
        .set({ 
          plan, 
          status: 'trial',
          maxUsers: MAX_USERS[plan],
          trialEndsAt: new Date(subscription.trial_end ? subscription.trial_end * 1000 : Date.now() + 14 * 24 * 60 * 60 * 1000) 
        })
        .where(eq(tenants.id, tenantId));

      return {
        subscription,
        savedSubscription,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Create a payment method for a customer
  async createPaymentMethod(customerId: string, paymentMethodId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    try {
      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return true;
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // Update subscription plan
  async updateSubscriptionPlan(
    tenantId: number, 
    subscriptionId: string, 
    newPlan: 'free' | 'starter' | 'professional' | 'enterprise'
  ) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    // Handle downgrade to free
    if (newPlan === 'free') {
      try {
        // Cancel the subscription at period end
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });

        // Update tenant and subscription in database
        await db.update(tenants)
          .set({ 
            plan: 'free',
            maxUsers: MAX_USERS.free
          })
          .where(eq(tenants.id, tenantId));

        await db.update(subscriptions)
          .set({ 
            cancelAtPeriodEnd: true,
            status: 'canceling'
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

        return { status: 'downgrading' };
      } catch (error) {
        console.error('Error downgrading subscription:', error);
        throw error;
      }
    }

    // Handle upgrade/change between paid plans
    try {
      // Get current subscription
      const [currentSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

      if (!currentSubscription) {
        throw new Error('Subscription not found');
      }

      // Update the subscription item with the new price
      const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: updatedSubscription.items.data[0].id,
            price: PRICE_IDS[newPlan],
          },
        ],
        proration_behavior: 'create_prorations',
      });

      // Update tenant and subscription in database
      await db.update(tenants)
        .set({ 
          plan: newPlan,
          maxUsers: MAX_USERS[newPlan]
        })
        .where(eq(tenants.id, tenantId));

      await db.update(subscriptions)
        .set({ 
          stripePriceId: PRICE_IDS[newPlan],
          updatedAt: new Date()
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

      return { status: 'updated' };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, tenantId: number) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    try {
      // Cancel the subscription immediately
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

      // Update tenant and subscription in database
      await db.update(tenants)
        .set({ 
          plan: 'free',
          status: 'active',
          maxUsers: MAX_USERS.free
        })
        .where(eq(tenants.id, tenantId));

      await db.update(subscriptions)
        .set({ 
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

      return canceledSubscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Handle webhook events from Stripe
  async handleWebhookEvent(event: Stripe.Event) {
    if (!stripe) {
      console.warn('Stripe is not initialized. Webhook event ignored.');
      return;
    }

    try {
      switch (event.type) {
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  // Handle invoice paid event
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;

    try {
      // Find subscription in our database
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));

      if (!subscription) return;

      // Record payment in payment history
      const paymentData = insertPaymentHistorySchema.parse({
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        paidAt: new Date(invoice.status_transitions?.paid_at || Date.now())
      });

      await db.insert(paymentHistory).values(paymentData);

      // Update subscription status if needed
      if (subscription.status !== 'active') {
        await db.update(subscriptions)
          .set({ 
            status: 'active',
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, subscription.id));
        
        // Also update tenant status
        await db.update(tenants)
          .set({ status: 'active' })
          .where(eq(tenants.id, subscription.tenantId));
      }
    } catch (error) {
      console.error('Error handling invoice paid:', error);
      throw error;
    }
  }

  // Handle payment failed event
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;

    try {
      // Find subscription in our database
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));

      if (!subscription) return;

      // Record failed payment in payment history
      const paymentData = insertPaymentHistorySchema.parse({
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        paidAt: null
      });

      await db.insert(paymentHistory).values(paymentData);

      // Update subscription status
      await db.update(subscriptions)
        .set({ 
          status: 'past_due',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, subscription.id));
      
      // Also update tenant status
      await db.update(tenants)
        .set({ status: 'past_due' })
        .where(eq(tenants.id, subscription.tenantId));
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  // Handle subscription updated event
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
      // Find subscription in our database
      const [dbSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      if (!dbSubscription) return;

      // Update subscription in database
      await db.update(subscriptions)
        .set({ 
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, dbSubscription.id));
      
      // Update tenant status based on subscription status
      let tenantStatus = 'active';
      
      if (subscription.status === 'trialing') {
        tenantStatus = 'trial';
      } else if (subscription.status === 'past_due') {
        tenantStatus = 'past_due';
      } else if (subscription.status === 'canceled') {
        tenantStatus = 'cancelled';
      } else if (subscription.status === 'unpaid') {
        tenantStatus = 'past_due';
      }
      
      await db.update(tenants)
        .set({ status: tenantStatus })
        .where(eq(tenants.id, dbSubscription.tenantId));
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  // Handle subscription deleted event
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      // Find subscription in our database
      const [dbSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      if (!dbSubscription) return;

      // Update subscription in database
      await db.update(subscriptions)
        .set({ 
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, dbSubscription.id));
      
      // Update tenant to free plan
      await db.update(tenants)
        .set({ 
          plan: 'free',
          status: 'active',
          maxUsers: MAX_USERS.free
        })
        .where(eq(tenants.id, dbSubscription.tenantId));
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  // Create a checkout session for initial subscription setup
  async createCheckoutSession(tenantId: number, plan: 'starter' | 'professional' | 'enterprise', customerId: string, successUrl: string, cancelUrl: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: PRICE_IDS[plan],
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          tenantId: tenantId.toString(),
          plan
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create a payment intent for subscription
  async createPaymentIntent(amount: number, customerId: string, metadata: Record<string, string> = {}) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        metadata
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();