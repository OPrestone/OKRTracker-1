import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, CalendarDays, Edit, Trash2, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Timeframe, Cadence } from "@shared/schema";

const Timeframes = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [timeframeForm, setTimeframeForm] = useState({
    id: 0,
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    cadenceId: ""
  });
  
  // Selected timeframe for editing
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | null>(null);
  
  // Fetch timeframes and cadences
  const { data: timeframes, isLoading: timeframesLoading } = useQuery<Timeframe[]>({
    queryKey: ["/api/timeframes"]
  });
  
  const { data: cadences } = useQuery<Cadence[]>({
    queryKey: ["/api/cadences"]
  });
  
  // Create timeframe mutation
  const createTimeframeMutation = useMutation({
    mutationFn: async (timeframeData: any) => {
      const res = await apiRequest("POST", "/api/timeframes", timeframeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Timeframe created",
        description: "The timeframe has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating timeframe",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update timeframe mutation
  const updateTimeframeMutation = useMutation({
    mutationFn: async (timeframeData: any) => {
      const { id, ...updateData } = timeframeData;
      const res = await apiRequest("PATCH", `/api/timeframes/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      setIsEditDialogOpen(false);
      setSelectedTimeframe(null);
      toast({
        title: "Timeframe updated",
        description: "The timeframe has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating timeframe",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleCreateTimeframe = () => {
    const timeframeData = {
      name: timeframeForm.name,
      description: timeframeForm.description,
      startDate: new Date(timeframeForm.startDate).toISOString(),
      endDate: new Date(timeframeForm.endDate).toISOString(),
      cadenceId: timeframeForm.cadenceId ? parseInt(timeframeForm.cadenceId) : null
    };
    
    createTimeframeMutation.mutate(timeframeData);
  };
  
  const handleEditTimeframe = (timeframe: Timeframe) => {
    const startDate = timeframe.startDate ? new Date(timeframe.startDate).toISOString().split('T')[0] : "";
    const endDate = timeframe.endDate ? new Date(timeframe.endDate).toISOString().split('T')[0] : "";
    
    setSelectedTimeframe(timeframe);
    setTimeframeForm({
      id: timeframe.id,
      name: timeframe.name,
      description: timeframe.description || "",
      startDate: startDate,
      endDate: endDate,
      cadenceId: timeframe.cadenceId ? timeframe.cadenceId.toString() : ""
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateTimeframe = () => {
    if (!selectedTimeframe) return;
    
    const timeframeData = {
      id: selectedTimeframe.id,
      name: timeframeForm.name,
      description: timeframeForm.description,
      startDate: new Date(timeframeForm.startDate).toISOString(),
      endDate: new Date(timeframeForm.endDate).toISOString(),
      cadenceId: timeframeForm.cadenceId ? parseInt(timeframeForm.cadenceId) : null
    };
    
    updateTimeframeMutation.mutate(timeframeData);
  };
  
  const resetForm = () => {
    setTimeframeForm({
      id: 0,
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      cadenceId: ""
    });
  };
  
  // Get cadence name by ID
  const getCadenceName = (cadenceId: number | null | undefined) => {
    if (!cadenceId || !cadences) return "None";
    const cadence = cadences.find(c => c.id === cadenceId);
    return cadence ? cadence.name : "Unknown";
  };
  
  return (
    <DashboardLayout title="Timeframes Configuration">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeframes Configuration</h1>
          <p className="text-gray-600">Manage specific timeframes for OKR planning cycles</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Timeframe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Timeframe</DialogTitle>
              <DialogDescription>
                Add a new timeframe for OKR planning.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Timeframe Name</Label>
                <Input 
                  id="name" 
                  value={timeframeForm.name} 
                  onChange={(e) => setTimeframeForm({...timeframeForm, name: e.target.value})}
                  placeholder="e.g., Q1 2023"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={timeframeForm.description} 
                  onChange={(e) => setTimeframeForm({...timeframeForm, description: e.target.value})}
                  placeholder="Brief description of this timeframe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate"
                    type="date"
                    value={timeframeForm.startDate}
                    onChange={(e) => setTimeframeForm({...timeframeForm, startDate: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate"
                    type="date"
                    value={timeframeForm.endDate}
                    onChange={(e) => setTimeframeForm({...timeframeForm, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="cadence">Cadence</Label>
                <Select 
                  value={timeframeForm.cadenceId} 
                  onValueChange={(value) => setTimeframeForm({...timeframeForm, cadenceId: value})}
                >
                  <SelectTrigger id="cadence">
                    <SelectValue placeholder="Select a cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {cadences?.map(cadence => (
                      <SelectItem key={cadence.id} value={cadence.id.toString()}>
                        {cadence.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTimeframe}
                disabled={
                  !timeframeForm.name || 
                  !timeframeForm.startDate || 
                  !timeframeForm.endDate || 
                  createTimeframeMutation.isPending
                }
              >
                {createTimeframeMutation.isPending ? "Creating..." : "Create Timeframe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Edit Timeframe Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timeframe</DialogTitle>
            <DialogDescription>
              Update timeframe information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Timeframe Name</Label>
              <Input 
                id="edit-name" 
                value={timeframeForm.name} 
                onChange={(e) => setTimeframeForm({...timeframeForm, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input 
                id="edit-description" 
                value={timeframeForm.description} 
                onChange={(e) => setTimeframeForm({...timeframeForm, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input 
                  id="edit-startDate"
                  type="date"
                  value={timeframeForm.startDate}
                  onChange={(e) => setTimeframeForm({...timeframeForm, startDate: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input 
                  id="edit-endDate"
                  type="date"
                  value={timeframeForm.endDate}
                  onChange={(e) => setTimeframeForm({...timeframeForm, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-cadence">Cadence</Label>
              <Select 
                value={timeframeForm.cadenceId} 
                onValueChange={(value) => setTimeframeForm({...timeframeForm, cadenceId: value})}
              >
                <SelectTrigger id="edit-cadence">
                  <SelectValue placeholder="Select a cadence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {cadences?.map(cadence => (
                    <SelectItem key={cadence.id} value={cadence.id.toString()}>
                      {cadence.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTimeframe}
              disabled={
                !timeframeForm.name || 
                !timeframeForm.startDate || 
                !timeframeForm.endDate || 
                updateTimeframeMutation.isPending
              }
            >
              {updateTimeframeMutation.isPending ? "Updating..." : "Update Timeframe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>OKR Timeframes</CardTitle>
          <CardDescription>
            Manage specific timeframes for OKR planning and implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeframesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : timeframes && timeframes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Cadence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeframes.map(timeframe => (
                  <TableRow key={timeframe.id}>
                    <TableCell className="font-medium">{timeframe.name}</TableCell>
                    <TableCell>{timeframe.description}</TableCell>
                    <TableCell>{timeframe.startDate ? new Date(timeframe.startDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>{timeframe.endDate ? new Date(timeframe.endDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>{getCadenceName(timeframe.cadenceId)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditTimeframe(timeframe)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No timeframes found</AlertTitle>
              <AlertDescription>
                You haven't created any timeframes yet. Create a new timeframe to get started.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Timeframes;