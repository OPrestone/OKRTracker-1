import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompanyMission() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Company Mission</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p>To provide cutting edge technological and digital solutions that ensures RAL is able to generate 1.5B in revenue and a cumulative audience of 37M</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Strategic Direction</CardTitle>
            </CardHeader>
            <CardContent>
              <p>To become the biggest reach, most influential and trusted company in the communications landscape in order to deliver sustainable profits for shareholders and staff.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}