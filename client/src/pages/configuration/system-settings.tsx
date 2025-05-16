import React from "react";
import { TenantConfigManager } from "@/components/configuration/tenant-config-manager";
import { useAuth } from "@/hooks/use-auth";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import Sidebar from "@/components/sidebar";

export default function SystemSettings() {
  const { user } = useAuth();
  const { currentTenant } = useTenantContext();
  
  // Check if user is admin or owner
  const isAdmin = 
    currentTenant?.userRole === "admin" || 
    currentTenant?.userRole === "owner" ||
    user?.role === "admin";
  
  // For system-wide admins, we'll allow access to both tenant and global configs
  const isSystemAdmin = user?.role === "admin";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4 p-8">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Configuration Settings</h2>
              <p className="text-muted-foreground">
                Manage configuration settings for your organization
              </p>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="organization">
            <TabsList>
              <TabsTrigger value="organization">Organization Settings</TabsTrigger>
              {isSystemAdmin && (
                <TabsTrigger value="system">Global System Settings</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="organization" className="space-y-4 py-4">
              <div className="grid gap-4">
                <TenantConfigManager />
                
                <Card>
                  <CardHeader className="flex flex-row space-y-0 items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        <Info className="h-5 w-5 mr-2 text-blue-500" />
                        About Organization Settings
                      </CardTitle>
                      <CardDescription>
                        Configuration settings stored in the database for this organization only
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>
                      Organization settings are specific to your organization and only visible to users within your organization.
                      These settings can be used to configure features, set defaults, and store organization-specific preferences.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Settings are isolated by organization (multi-tenant)</li>
                      <li>Only organization admins and owners can add or delete settings</li>
                      <li>All organization members can view non-secret settings</li>
                      <li>Secret settings values are masked in the UI</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {isSystemAdmin && (
              <TabsContent value="system" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Global System Settings</CardTitle>
                    <CardDescription>
                      System-wide configuration settings (available to system administrators only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-gray-500">
                        Global system settings administration is coming soon.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This area will allow system administrators to configure platform-wide settings.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row space-y-0 items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        <Info className="h-5 w-5 mr-2 text-blue-500" />
                        About System Settings
                      </CardTitle>
                      <CardDescription>
                        Configuration settings that apply to the entire platform
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>
                      System settings are global configurations that apply to the entire platform.
                      These settings can only be managed by system administrators and affect all organizations.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Settings are global and apply to all organizations</li>
                      <li>Can optionally use environment variables for deployment-specific values</li>
                      <li>Only system administrators can view and manage these settings</li>
                      <li>Used for platform-wide defaults and configurations</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}