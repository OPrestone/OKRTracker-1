import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Sample data
const draftObjectives = [
  {
    id: 1,
    title: "Expand customer base in EMEA region",
    description: "Target enterprise customers in Europe, Middle East, and Africa to increase market share",
    createdAt: "2023-09-15",
    owner: { firstName: "Alex", lastName: "Morgan" },
    keyResults: [
      { id: 1, title: "Achieve 15 new enterprise customers" },
      { id: 2, title: "Generate €2M in new annual revenue" },
      { id: 3, title: "Establish 3 strategic partnerships" }
    ]
  },
  {
    id: 2,
    title: "Implement data-driven marketing strategy",
    description: "Use analytics to optimize marketing campaigns and improve ROI",
    createdAt: "2023-09-18",
    owner: { firstName: "Jamie", lastName: "Taylor" },
    keyResults: [
      { id: 4, title: "Increase marketing qualified leads by 30%" },
      { id: 5, title: "Reduce customer acquisition cost by 20%" },
      { id: 6, title: "Improve conversion rate by 15%" }
    ]
  },
  {
    id: 3,
    title: "Revamp customer onboarding process",
    description: "Streamline the onboarding experience to improve customer satisfaction and reduce churn",
    createdAt: "2023-09-20",
    owner: { firstName: "Sam", lastName: "Johnson" },
    keyResults: [
      { id: 7, title: "Reduce onboarding time from 14 days to 7 days" },
      { id: 8, title: "Achieve 90% customer satisfaction score" },
      { id: 9, title: "Decrease 30-day churn by 25%" }
    ]
  }
];

export default function DraftOKRs() {
  return (
    <DashboardLayout title="Draft OKRs">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Draft OKRs</h1>
          <p className="text-gray-600">Manage objectives that are in draft state before approval</p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Draft
        </Button>
      </div>

      {draftObjectives && draftObjectives.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {draftObjectives.map((objective) => (
            <Card key={objective.id} className="border-l-4 border-l-amber-400">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-amber-50">Draft</Badge>
                  <div className="text-sm text-gray-500">Created {objective.createdAt}</div>
                </div>
                <CardTitle>{objective.title}</CardTitle>
                <CardDescription className="mt-2">
                  {objective.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Results</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {objective.keyResults.map((kr) => (
                      <li key={kr.id} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{kr.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{`${objective.owner.firstName[0]}${objective.owner.lastName[0]}`}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{objective.owner.firstName} {objective.owner.lastName}</p>
                    <p className="text-xs text-gray-500">Draft Owner</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm">
                  Submit for Approval
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No draft objectives</CardTitle>
            <CardDescription>
              You don't have any draft objectives yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create your first draft
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
