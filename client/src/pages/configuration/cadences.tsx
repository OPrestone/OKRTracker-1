import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PlusCircle, Calendar, Edit, Trash2, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Cadence } from "@shared/schema";

// Define form type with number for startMonth
type CadenceForm = {
  id: number;
  name: string;
  description: string;
  period: string;
  startMonth: number;
};

const Cadences = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cadenceForm, setCadenceForm] = useState({
    id: 0,
    name: "",
    description: "",
    period: "quarterly",
    startMonth: "january"
  });
  
  // Selected cadence for editing
  const [selectedCadence, setSelectedCadence] = useState<Cadence | null>(null);
  
  // Fetch cadences
  const { data: cadences, isLoading: cadencesLoading } = useQuery<Cadence[]>({
    queryKey: ["/api/cadences"]
  });
  
  // Create cadence mutation
  const createCadenceMutation = useMutation({
    mutationFn: async (cadenceData: any) => {
      const res = await apiRequest("POST", "/api/cadences", cadenceData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cadences"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Cadence created",
        description: "The cadence has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating cadence",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update cadence mutation
  const updateCadenceMutation = useMutation({
    mutationFn: async (cadenceData: any) => {
      const { id, ...updateData } = cadenceData;
      const res = await apiRequest("PATCH", `/api/cadences/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cadences"] });
      setIsEditDialogOpen(false);
      setSelectedCadence(null);
      toast({
        title: "Cadence updated",
        description: "The cadence has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating cadence",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleCreateCadence = () => {
    const cadenceData = {
      name: cadenceForm.name,
      description: cadenceForm.description,
      period: cadenceForm.period,
      startMonth: cadenceForm.startMonth
    };
    
    createCadenceMutation.mutate(cadenceData);
  };
  
  const handleEditCadence = (cadence: Cadence) => {
    setSelectedCadence(cadence);
    setCadenceForm({
      id: cadence.id,
      name: cadence.name,
      description: cadence.description || "",
      period: cadence.period || "quarterly",
      startMonth: typeof cadence.startMonth === 'number' ? cadence.startMonth : 1
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateCadence = () => {
    if (!selectedCadence) return;
    
    const cadenceData = {
      id: selectedCadence.id,
      name: cadenceForm.name,
      description: cadenceForm.description,
      period: cadenceForm.period,
      startMonth: cadenceForm.startMonth
    };
    
    updateCadenceMutation.mutate(cadenceData);
  };
  
  const resetForm = () => {
    setCadenceForm({
      id: 0,
      name: "",
      description: "",
      period: "quarterly",
      startMonth: "january"
    });
  };
  
  return (
    <DashboardLayout title="Cadences Configuration">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadences Configuration</h1>
          <p className="text-gray-600">Manage OKR cadences and planning cycles</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Cadence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Cadence</DialogTitle>
              <DialogDescription>
                Add a new cadence for OKR planning cycles.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Cadence Name</Label>
                <Input 
                  id="name" 
                  value={cadenceForm.name} 
                  onChange={(e) => setCadenceForm({...cadenceForm, name: e.target.value})}
                  placeholder="e.g., Quarterly OKRs"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={cadenceForm.description} 
                  onChange={(e) => setCadenceForm({...cadenceForm, description: e.target.value})}
                  placeholder="Brief description of this cadence"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="period">Period</Label>
                <select 
                  id="period"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={cadenceForm.period}
                  onChange={(e) => setCadenceForm({...cadenceForm, period: e.target.value})}
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="biannual">Bi-Annual</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="startMonth">Start Month</Label>
                <select 
                  id="startMonth"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={cadenceForm.startMonth}
                  onChange={(e) => setCadenceForm({...cadenceForm, startMonth: e.target.value})}
                >
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </select>
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
                onClick={handleCreateCadence}
                disabled={!cadenceForm.name || createCadenceMutation.isPending}
              >
                {createCadenceMutation.isPending ? "Creating..." : "Create Cadence"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Edit Cadence Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cadence</DialogTitle>
            <DialogDescription>
              Update cadence information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Cadence Name</Label>
              <Input 
                id="edit-name" 
                value={cadenceForm.name} 
                onChange={(e) => setCadenceForm({...cadenceForm, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input 
                id="edit-description" 
                value={cadenceForm.description} 
                onChange={(e) => setCadenceForm({...cadenceForm, description: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-period">Period</Label>
              <select 
                id="edit-period"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={cadenceForm.period}
                onChange={(e) => setCadenceForm({...cadenceForm, period: e.target.value})}
              >
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="biannual">Bi-Annual</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-startMonth">Start Month</Label>
              <select 
                id="edit-startMonth"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={cadenceForm.startMonth}
                onChange={(e) => setCadenceForm({...cadenceForm, startMonth: e.target.value})}
              >
                <option value="january">January</option>
                <option value="february">February</option>
                <option value="march">March</option>
                <option value="april">April</option>
                <option value="may">May</option>
                <option value="june">June</option>
                <option value="july">July</option>
                <option value="august">August</option>
                <option value="september">September</option>
                <option value="october">October</option>
                <option value="november">November</option>
                <option value="december">December</option>
              </select>
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
              onClick={handleUpdateCadence}
              disabled={!cadenceForm.name || updateCadenceMutation.isPending}
            >
              {updateCadenceMutation.isPending ? "Updating..." : "Update Cadence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>OKR Cadences</CardTitle>
          <CardDescription>
            Manage the cycles and schedules for OKR planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cadencesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : cadences && cadences.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Start Month</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cadences.map(cadence => (
                  <TableRow key={cadence.id}>
                    <TableCell className="font-medium">{cadence.name}</TableCell>
                    <TableCell>{cadence.description}</TableCell>
                    <TableCell className="capitalize">{cadence.period}</TableCell>
                    <TableCell className="capitalize">{cadence.startMonth}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCadence(cadence)}>
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
              <AlertTitle>No cadences found</AlertTitle>
              <AlertDescription>
                You haven't created any cadences yet. Create a new cadence to get started.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Cadences;