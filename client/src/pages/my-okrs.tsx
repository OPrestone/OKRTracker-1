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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [keyResultModalOpen, setKeyResultModalOpen] = useState(false);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [progressUpdateModalOpen, setProgressUpdateModalOpen] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState<any>(null);
  const [selectedObjective, setSelectedObjective] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "individual",
    status: "on_track"
  });
  const [keyResultForm, setKeyResultForm] = useState({
    title: "",
    description: "",
    targetValue: "100",
    currentValue: "0"
  });
  
  const [initiativeForm, setInitiativeForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: ""
  });
  
  const [checkInForm, setCheckInForm] = useState({
    progress: "",
    notes: ""
  });
  
  const [progressForm, setProgressForm] = useState({
    progress: "",
    comment: ""
  });
  
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleKeyResultInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setKeyResultForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInitiativeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInitiativeForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckInInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCheckInForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProgressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProgressForm(prev => ({ ...prev, [name]: value }));
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
  
  const handleViewDetails = (objective: any) => {
    setSelectedObjective(objective);
    setDetailsOpen(true);
  };
  
  const handleAddKeyResult = () => {
    console.log('Adding Key Result:', keyResultForm, 'to objective ID:', selectedObjective?.id);
    
    // Here you would typically call your API to create a new key result
    toast({
      title: "Key Result Added",
      description: "New key result has been added to this objective.",
    });
    
    // Close modal and reset form
    setKeyResultModalOpen(false);
    setKeyResultForm({
      title: "",
      description: "",
      targetValue: "100",
      currentValue: "0"
    });
  };
  
  const handleAddInitiative = () => {
    console.log('Adding Initiative:', initiativeForm, 'to objective ID:', selectedObjective?.id);
    
    // Here you would typically call your API to create a new initiative
    toast({
      title: "Initiative Added",
      description: "New initiative has been added to this objective.",
    });
    
    // Close modal and reset form
    setInitiativeModalOpen(false);
    setInitiativeForm({
      title: "",
      description: "",
      startDate: "",
      endDate: ""
    });
  };
  
  const handleAddCheckIn = () => {
    console.log('Adding Check-in:', checkInForm, 'to objective ID:', selectedObjective?.id);
    
    // Here you would typically call your API to create a new check-in
    toast({
      title: "Check-in Recorded",
      description: "Your check-in has been recorded successfully.",
    });
    
    // Close modal and reset form
    setCheckInModalOpen(false);
    setCheckInForm({
      progress: "",
      notes: ""
    });
  };
  
  const handleOpenProgressModal = (keyResult: any) => {
    setSelectedKeyResult(keyResult);
    setProgressForm({
      progress: keyResult.progress.toString(),
      comment: ""
    });
    setProgressUpdateModalOpen(true);
  };
  
  const handleUpdateProgress = () => {
    console.log('Updating progress for key result ID:', selectedKeyResult?.id, 'to', progressForm.progress, '%');
    
    // Here you would typically call your API to update the key result progress
    toast({
      title: "Progress Updated",
      description: `Key result progress has been updated to ${progressForm.progress}%.`,
    });
    
    // Close modal and reset form
    setProgressUpdateModalOpen(false);
    setProgressForm({
      progress: "",
      comment: ""
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
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-sm"
                    onClick={() => handleViewDetails(objective)}
                  >
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
      
      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedObjective && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedObjective.title}</span>
                  {getStatusBadge(selectedObjective.status)}
                </DialogTitle>
                <DialogDescription className="text-base mt-2">
                  {selectedObjective.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Overall Progress</h3>
                    <span className="text-lg font-medium">{selectedObjective.progress}%</span>
                  </div>
                  <Progress value={selectedObjective.progress} className="h-2.5" />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Key Results</h3>
                    <div className="space-y-4">
                      {selectedObjective.keyResults.map((kr) => (
                        <div key={kr.id} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium">{kr.title}</h4>
                            <span className="font-medium">{kr.progress}%</span>
                          </div>
                          <Progress value={kr.progress} className="h-2 mb-3" />
                          <div className="flex justify-end mt-2">
                            <Button size="sm" variant="outline" className="text-xs">Update Progress</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setKeyResultModalOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Key Result
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setInitiativeModalOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Initiative
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCheckInModalOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Check-in
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
                <Button>Edit Objective</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Key Result Modal */}
      <Dialog open={keyResultModalOpen} onOpenChange={setKeyResultModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Key Result</DialogTitle>
            <DialogDescription>
              Add a measurable outcome that defines success for this objective.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kr-title" className="text-right">
                Title
              </Label>
              <Input
                id="kr-title"
                name="title"
                value={keyResultForm.title}
                onChange={handleKeyResultInputChange}
                className="col-span-3"
                placeholder="Enter key result title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kr-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="kr-description"
                name="description"
                value={keyResultForm.description}
                onChange={handleKeyResultInputChange}
                className="col-span-3"
                placeholder="Enter detailed description of this key result"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kr-target" className="text-right">
                Target Value
              </Label>
              <Input
                id="kr-target"
                name="targetValue"
                value={keyResultForm.targetValue}
                onChange={handleKeyResultInputChange}
                className="col-span-3"
                placeholder="Enter target value (e.g. 100)"
                type="number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kr-current" className="text-right">
                Current Value
              </Label>
              <Input
                id="kr-current"
                name="currentValue"
                value={keyResultForm.currentValue}
                onChange={handleKeyResultInputChange}
                className="col-span-3"
                placeholder="Enter current value (e.g. 0)"
                type="number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyResultModalOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleAddKeyResult}>Add Key Result</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initiative Modal */}
      <Dialog open={initiativeModalOpen} onOpenChange={setInitiativeModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Initiative</DialogTitle>
            <DialogDescription>
              Add a project or task that will help achieve this objective.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initiative-title" className="text-right">
                Title
              </Label>
              <Input
                id="initiative-title"
                name="title"
                value={initiativeForm.title}
                onChange={handleInitiativeInputChange}
                className="col-span-3"
                placeholder="Enter initiative title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initiative-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="initiative-description"
                name="description"
                value={initiativeForm.description}
                onChange={handleInitiativeInputChange}
                className="col-span-3"
                placeholder="Enter detailed description of this initiative"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initiative-start" className="text-right">
                Start Date
              </Label>
              <Input
                id="initiative-start"
                name="startDate"
                value={initiativeForm.startDate}
                onChange={handleInitiativeInputChange}
                className="col-span-3"
                type="date"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initiative-end" className="text-right">
                End Date
              </Label>
              <Input
                id="initiative-end"
                name="endDate"
                value={initiativeForm.endDate}
                onChange={handleInitiativeInputChange}
                className="col-span-3"
                type="date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInitiativeModalOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleAddInitiative}>Add Initiative</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in Modal */}
      <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Check-in</DialogTitle>
            <DialogDescription>
              Record progress and notes for this objective.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkin-progress" className="text-right">
                Progress (%)
              </Label>
              <Input
                id="checkin-progress"
                name="progress"
                value={checkInForm.progress}
                onChange={handleCheckInInputChange}
                className="col-span-3"
                placeholder="Enter current progress (0-100)"
                type="number"
                min="0"
                max="100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkin-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="checkin-notes"
                name="notes"
                value={checkInForm.notes}
                onChange={handleCheckInInputChange}
                className="col-span-3"
                placeholder="Enter detailed notes about current progress, challenges, etc."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInModalOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleAddCheckIn}>Add Check-in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
