import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Loader2,
  Rocket,
  Users,
} from "lucide-react";

interface TeamData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function TenantOnboardingSummaryDemo() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Sample organization info
  const orgInfo = {
    name: "Acme Corporation",
    description: "Leading provider of innovative solutions",
    industry: "Technology"
  };

  // Sample teams data
  const [teams] = useState<TeamData[]>([
    {
      name: "Marketing Team",
      description: "Team responsible for all marketing activities",
      color: "#3B82F6",
      icon: "megaphone"
    },
    {
      name: "Sales Team",
      description: "Team responsible for sales and revenue growth",
      color: "#10B981",
      icon: "briefcase"
    },
    {
      name: "Engineering Team",
      description: "Team responsible for product development and technical operations",
      color: "#8B5CF6",
      icon: "code"
    }
  ]);

  const handleLaunch = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Organization created",
        description: `${orgInfo.name} has been created successfully.`,
      });
      
      setIsSubmitting(false);
      
      // Redirect to dashboard after success
      // setTimeout(() => navigate("/dashboard"), 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Ready to Launch Your OKR Platform</h1>
          <p className="mt-2 text-lg text-gray-600">Review your organization details and teams before launching</p>
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
              {teams.length > 0 ? (
                <div className="space-y-4">
                  {teams.map((team, index) => (
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
                  <p>No teams have been added yet.</p>
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
              onClick={handleLaunch}
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
      </div>
    </div>
  );
}