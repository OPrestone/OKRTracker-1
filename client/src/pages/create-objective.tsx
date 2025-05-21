import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, Building, Calendar, Users, X } from "lucide-react";
import { useTenantContext } from "@/hooks/use-tenant-context";

export default function CreateObjective() {
  const [_, setLocation] = useLocation();
  const { currentTenant } = useTenantContext();
  
  const handleCancel = () => {
    setLocation("/objectives");
  };

  const handleSave = () => {
    // Here you would normally save the data
    // After saving, redirect to objectives page
    setLocation("/objectives");
  };

  return (
    <DashboardLayout 
      title="Create Objective" 
      subtitle="Define a new objective and its key results for your organization"
    >
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-1.5">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Add OKR</h1>
          </div>
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Objective Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Objective Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter the objective title" 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the objective" 
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Team</Label>
                  <div className="flex items-center mt-1 p-2 border rounded-md">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{currentTenant?.displayName || "Select Team"}</span>
                  </div>
                </div>
                
                <div>
                  <Label>Timeframe</Label>
                  <div className="flex items-center mt-1 p-2 border rounded-md">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Q2 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            className="bg-primary text-white" 
            onClick={handleSave}
          >
            Save Objective
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
