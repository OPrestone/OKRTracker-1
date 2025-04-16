import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample data
const myObjectives = [
  {
    id: 1,
    title: "Improve user engagement metrics",
    description: "Increase user session time by 20% and decrease bounce rate by 15%",
    status: "on_track",
    progress: 65,
    keyResults: [
      { id: 1, title: "Increase average session duration to 4 minutes", progress: 70 },
      { id: 2, title: "Decrease bounce rate to below 40%", progress: 60 },
      { id: 3, title: "Increase return visitor rate by 25%", progress: 50 }
    ]
  },
  {
    id: 2,
    title: "Launch new feature release",
    description: "Successfully launch the dashboard redesign with positive user feedback",
    status: "at_risk",
    progress: 45,
    keyResults: [
      { id: 4, title: "Complete UI development", progress: 80 },
      { id: 5, title: "Conduct user testing with 50 participants", progress: 30 },
      { id: 6, title: "Achieve 90% satisfaction rating", progress: 0 }
    ]
  },
  {
    id: 3,
    title: "Optimize development process",
    description: "Reduce deployment time and bugs through improved CI/CD",
    status: "on_track",
    progress: 70,
    keyResults: [
      { id: 7, title: "Reduce build time by 30%", progress: 85 },
      { id: 8, title: "Decrease production bugs by 40%", progress: 60 },
      { id: 9, title: "Increase test coverage to 90%", progress: 75 }
    ]
  },
  {
    id: 4,
    title: "Develop professional skills",
    description: "Complete required training and certifications for career growth",
    status: "behind",
    progress: 20,
    keyResults: [
      { id: 10, title: "Complete 3 professional courses", progress: 33 },
      { id: 11, title: "Obtain advanced certification", progress: 0 },
      { id: 12, title: "Mentor 2 junior team members", progress: 50 }
    ]
  }
];

export default function MyOKRs() {
  // For demonstration, we're not using isLoading since we have sample data
  const isLoading = false;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "individual",
    status: "on_track"
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Here you would typically call your API to create a new objective
    console.log('Creating new objective:', formData);
    
    // Show success toast
    toast({
      title: "Objective Created",
      description: "Your new objective has been created successfully.",
    });
    
    // Close modal and reset form
    setOpen(false);
    setFormData({
      title: "",
      description: "",
      level: "individual",
      status: "on_track"
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string, text: string }> = {
      "on_track": { bg: "bg-green-100", text: "text-green-800" },
      "at_risk": { bg: "bg-yellow-100", text: "text-yellow-800" },
      "behind": { bg: "bg-red-100", text: "text-red-800" },
      "completed": { bg: "bg-blue-100", text: "text-blue-800" }
    };
    
    const { bg, text } = variants[status] || { bg: "bg-gray-100", text: "text-gray-800" };
    
    return (
      <span className={`inline-block px-2 py-1 text-xs rounded-full ${bg} ${text} mr-2`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <DashboardLayout title="My OKRs">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My OKRs</h1>
          <p className="text-gray-600">Manage your personal objectives and key results</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Objective
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Objective</DialogTitle>
              <DialogDescription>
                Add a new objective to track. You can add key results later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Enter objective title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Enter detailed description of this objective"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">
                  Level
                </Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleSelectChange("level", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="behind">Behind</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSubmit}>Create Objective</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : myObjectives && myObjectives.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {myObjectives.map((objective) => (
            <Card key={objective.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{objective.title}</CardTitle>
                  {getStatusBadge(objective.status)}
                </div>
                <CardDescription className="mt-2">
                  {objective.description}
                </CardDescription>
              </CardHeader>
              <div className="px-6 py-2 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{objective.progress}%</span>
                </div>
                <Progress value={objective.progress} className="h-2" />
              </div>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm mb-2">Key Results</h4>
                <ul className="space-y-2">
                  {objective.keyResults.map((kr) => (
                    <li key={kr.id} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">{kr.title}</span>
                        <span className="text-gray-500">{kr.progress}%</span>
                      </div>
                      <Progress value={kr.progress} className="h-1.5" />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end">
                  <Button size="sm" variant="ghost" className="text-sm">
                    View Details <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No objectives found</CardTitle>
            <CardDescription>
              You don't have any objectives assigned to you yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first objective
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
