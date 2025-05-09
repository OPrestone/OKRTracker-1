import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Check, CreditCard, Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { StripeElementsWrapper } from "./stripe-elements-wrapper";
import { PaymentForm } from "./payment-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { format } from "date-fns";

interface TenantSubscriptionProps {
  tenantId: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  popular?: boolean;
  maxUsers: number;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Basic OKR tracking for small teams",
    price: 0,
    features: [
      "Up to 5 users",
      "Basic OKR tracking",
      "Team management",
      "Limited reporting",
    ],
    maxUsers: 5,
  },
  {
    id: "starter",
    name: "Starter",
    description: "Everything in Free plus advanced features",
    price: 9.99,
    popular: true,
    features: [
      "Up to 20 users",
      "Advanced OKR tracking",
      "Team management",
      "Basic reporting and analytics",
      "Email support",
    ],
    maxUsers: 20,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Enhanced features for growing teams",
    price: 29.99,
    features: [
      "Up to 100 users",
      "Advanced OKR tracking",
      "Custom reporting",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    maxUsers: 100,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Full-featured solution for large organizations",
    price: 99.99,
    features: [
      "Unlimited users",
      "Advanced OKR tracking",
      "Custom reporting",
      "Advanced analytics",
      "Dedicated support",
      "API access",
      "Custom integrations",
      "SSO and advanced security",
      "Dedicated account manager",
    ],
    maxUsers: 1000,
  },
];

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "MMM d, yyyy");
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatStatus(status: string | null) {
  if (!status) return "Inactive";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function TenantSubscription({ tenantId }: TenantSubscriptionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch the tenant
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['/api/tenants', tenantId],
    enabled: !!tenantId,
  });
  
  // Fetch subscription info
  const subscriptionQuery = useQuery({
    queryKey: ['/api/tenants', tenantId, 'subscription'],
    enabled: !!tenantId,
  });

  // Get user's role in this tenant
  const { data: tenantUsers = [] } = useQuery({
    queryKey: ['/api/tenants', tenantId, 'users'],
    enabled: !!tenantId && !!user?.id,
  });

  const currentUserRole = tenantUsers.find((tu: any) => tu.id === user?.id)?.userRole;
  const canManageSubscription = 
    currentUserRole === "owner" || 
    user?.role === "admin";

  // Check if Stripe is configured
  const stripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  // Update subscription plan mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (plan: string) => {
      // For now, without Stripe integration, we'll just update the plan
      const response = await apiRequest("PATCH", `/api/tenants/${tenantId}/subscription`, { plan });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "Your subscription plan has been updated successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/tenants', tenantId] });
      
      // Close payment dialog if open
      setShowPaymentDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    if (!stripeConfigured && planId !== "free") {
      // For now, without Stripe integration, just show a message
      toast({
        title: "Stripe not configured",
        description: "Payment processing is not available at this time. The plan will be updated without payment.",
      });
    }
    
    // Update the subscription
    updateSubscriptionMutation.mutate(planId);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    
    // If not free and Stripe is configured, show payment dialog
    if (planId !== "free" && stripeConfigured) {
      setShowPaymentDialog(true);
    } else {
      // Otherwise just update the plan
      handleSubscribe(planId);
    }
  };

  const currentPlan = tenant?.plan || "free";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Manage your organization's subscription plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current subscription */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Current Plan</h3>
                <Badge variant={currentPlan === "free" ? "outline" : "default"}>
                  {plans.find(p => p.id === currentPlan)?.name || "Free"}
                </Badge>
              </div>
              
              {tenant?.subscriptionId && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Status</div>
                  <div>
                    <Badge 
                      variant={tenant.status === "active" ? "success" : "destructive"}
                      className="capitalize"
                    >
                      {formatStatus(tenant.status)}
                    </Badge>
                  </div>
                  
                  {tenant.status === "trial" && tenant.trialEndsAt && (
                    <>
                      <div className="text-muted-foreground">Trial ends</div>
                      <div>{formatDate(tenant.trialEndsAt)}</div>
                    </>
                  )}
                  
                  {tenant.nextBillingAt && (
                    <>
                      <div className="text-muted-foreground">Next billing</div>
                      <div>{formatDate(tenant.nextBillingAt)}</div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Plan selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Available Plans</h3>
              
              <RadioGroup 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                value={currentPlan}
                onValueChange={canManageSubscription ? handleSelectPlan : undefined}
              >
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`relative rounded-lg border p-4 hover:border-primary/80 transition-colors ${
                      currentPlan === plan.id ? "border-primary" : ""
                    } ${canManageSubscription ? "cursor-pointer" : "opacity-80"}`}
                  >
                    {plan.popular && (
                      <Badge className="absolute right-2 top-2" variant="secondary">
                        Popular
                      </Badge>
                    )}
                    <RadioGroupItem
                      value={plan.id}
                      id={`plan-${plan.id}`}
                      className="absolute right-4 top-4"
                      disabled={!canManageSubscription}
                    />
                    <div className="space-y-3">
                      <h3 className="font-medium">{plan.name}</h3>
                      <div className="text-2xl font-bold">
                        {formatCurrency(plan.price)} <span className="text-sm font-normal">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              
              {!canManageSubscription && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <Lock className="h-4 w-4 mr-1" />
                  Only organization owners can change subscription plans.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Your Subscription</DialogTitle>
              <DialogDescription>
                Enter your payment information to subscribe to the {plans.find(p => p.id === selectedPlan)?.name} plan.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg border p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{plans.find(p => p.id === selectedPlan)?.name} Plan</span>
                  <span className="font-bold">{formatCurrency(plans.find(p => p.id === selectedPlan)?.price || 0)}/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plans.find(p => p.id === selectedPlan)?.description}
                </p>
              </div>
              
              <div className="space-y-4">
                {stripeConfigured ? (
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium mb-2">Payment Details</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your payment information is processed securely by Stripe.
                    </p>
                    
                    <div className="p-4 border rounded-md">
                      <StripeElementsWrapper clientSecret={clientSecret}>
                        <PaymentForm 
                          clientSecret={clientSecret}
                          onPaymentComplete={(success) => {
                            if (success) {
                              toast({
                                title: "Payment successful",
                                description: "Your subscription has been updated",
                              });
                              setShowPaymentDialog(false);
                              // Refresh subscription data
                              subscriptionQuery.refetch();
                            }
                          }}
                        />
                      </StripeElementsWrapper>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Payment functionality will be integrated with Stripe.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedPlan && handleSubscribe(selectedPlan)}
                disabled={updateSubscriptionMutation.isPending}
              >
                {updateSubscriptionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!updateSubscriptionMutation.isPending && (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Complete Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}