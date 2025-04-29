import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { FileDown, PenBox, Presentation } from "lucide-react";
import { TeamsOkrsView } from "@/components/mission/teams-okrs-view";

export default function Mission() {
  const [fullPageEditMode, setFullPageEditMode] = useState(false);
  
  // Minimalist version to ensure structure is correct
  if (fullPageEditMode) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <h1>Edit Mode</h1>
          <Button onClick={() => setFullPageEditMode(false)}>
            Cancel
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mission</h1>
          <div className="flex space-x-3">
            <Button variant="outline" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              <span>Present</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setFullPageEditMode(true)}
            >
              <PenBox className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <h2>Mission Page Content</h2>
          <p>This is a simplified version of the mission page.</p>
        </div>
        
        <div className="mt-6">
          <TeamsOkrsView />
        </div>
      </div>
    </DashboardLayout>
  );
}