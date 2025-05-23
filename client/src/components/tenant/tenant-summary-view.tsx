import { useState } from "react";
import { ArrowLeft, Building2, Loader2, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface TeamData {
  name: string;
  description: string;
  color: string;
  icon: string;
  members: any[];
}

interface OrganizationInfo {
  name: string;
  description: string;
  industry: string;
}

interface TenantSummaryProps {
  orgInfo: OrganizationInfo;
  addedTeams: TeamData[];
  onBack: () => void;
}

export default function TenantSummaryView({ orgInfo, addedTeams, onBack }: TenantSummaryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();

  const launchOrganization = async () => {
    setIsSubmitting(true);

    try {
      // Create the tenant with organization info and teams
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: orgInfo.name,
          description: orgInfo.description,
          industry: orgInfo.industry,
          timeframe_type: "quarterly", // Default timeframe
          settings: {
            theme: {
              primary_color: '#3b82f6',
            },
          },
          teams: addedTeams
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tenant');
      }

      const createdTenant = await response.json();
      
      // Show success message
      toast({
        title: "Organization created",
        description: `${orgInfo.name} has been created successfully.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });

      // Redirect to dashboard (after a small delay to show the success message)
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ready to Launch Your OKR Platform</h2>
        <p className="text-gray-500">Review your organization details and teams before launching</p>
      </div>

      <div className="space-y-8">
        {/* Organization Summary */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-primary mr-2" />
              <CardTitle>Organization Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Organization Name</h3>
                  <p className="mt-1 text-base font-medium">{orgInfo.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                  <p className="mt-1 text-base">{orgInfo.industry}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-600">{orgInfo.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Summary */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <CardTitle>Teams</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {addedTeams.length > 0 ? (
              <div className="space-y-4">
                {addedTeams.map((team, index) => (
                  <div key={index} className="flex items-start p-4 border rounded-lg bg-gray-50">
                    <div className="rounded-full p-2 mr-3 text-white" style={{ backgroundColor: team.color }}>
                      {team.icon === "megaphone" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <rect width="8" height="16" x="8" y="4" rx="2" /><line x1="12" x2="12" y1="4" y2="20" /><rect width="16" height="8" x="4" y="8" rx="2" /><line x1="20" x2="4" y1="12" y2="12" />
                        </svg>
                      )}
                      {team.icon === "briefcase" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                      )}
                      {team.icon === "code" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <polyline points="16 18 22 12 16 6"></polyline>
                          <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg text-gray-800">{team.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No teams have been added yet. Go back to the Team section to add teams.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Launch Button */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 text-center">
          <h3 className="text-xl font-semibold mb-3 text-gray-900">Ready to Launch Your OKR Platform</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Review your organization details and teams above. Once you're ready, click the button below to create your organization and start your OKR journey.
          </p>
          <Button 
            size="lg"
            onClick={launchOrganization}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Organization...
              </>
            ) : (
              <>
                Launch Your OKR Platform
                <Rocket className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Back navigation */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
}