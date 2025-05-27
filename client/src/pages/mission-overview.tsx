import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategicDirectionsDisplay } from "@/components/mission/strategic-directions-display";
import { Separator } from "@/components/ui/separator";
import { Building2, Target, Eye, Heart } from "lucide-react";

interface OrganizationMission {
  id: string;
  mission: string;
  vision: string;
  values: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export default function MissionOverview() {
  const { data: missionData, isLoading: missionLoading, error: missionError } = useQuery({
    queryKey: ['organization-mission'],
    queryFn: async () => {
      const response = await fetch('/api/organization-mission');
      if (!response.ok) {
        throw new Error('Failed to fetch organization mission');
      }
      return response.json() as OrganizationMission;
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Mission Overview</h1>
          <p className="text-gray-600">Your organization's mission, vision, values, and strategic directions</p>
        </div>
      </div>

      {/* Mission, Vision, Values */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missionLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : missionError ? (
              <p className="text-sm text-red-600">Unable to load mission statement</p>
            ) : (
              <p className="text-sm leading-relaxed">
                {missionData?.mission || "No mission statement has been set yet."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missionLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : missionError ? (
              <p className="text-sm text-red-600">Unable to load vision statement</p>
            ) : (
              <p className="text-sm leading-relaxed">
                {missionData?.vision || "No vision statement has been set yet."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-600" />
              Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missionLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : missionError ? (
              <p className="text-sm text-red-600">Unable to load values statement</p>
            ) : (
              <p className="text-sm leading-relaxed">
                {missionData?.values || "No values statement has been set yet."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Strategic Directions */}
      <StrategicDirectionsDisplay />

      {missionData && (
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400">
            Last updated: {new Date(missionData.updated_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}