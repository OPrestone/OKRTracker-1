import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import { Cadence } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Cadences() {
  const { toast } = useToast();
  const [isNewCadenceDialogOpen, setIsNewCadenceDialogOpen] = useState(false);
  const [isEditCadenceDialogOpen, setIsEditCadenceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState<Cadence | null>(null);

  // New cadence form state
  const [newCadence, setNewCadence] = useState({
    name: "",
    description: "",
    period: "quarterly",
    startMonth: "1"
  });

  // Edit cadence form state
  const [editCadence, setEditCadence] = useState({
    name: "",
    description: "",
    period: "quarterly",
    startMonth: "1" 
  });

  // Fetch cadences
  const { data: cadences, isLoading } = useQuery<Cadence[]>({
    queryKey: ["/api/cadences"]
  });

  // Create cadence mutation
  const createCadenceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cadences", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cadences"] });
      setIsNewCadenceDialogOpen(false);
      resetNewCadenceForm();
      toast({
        title: "Cadence created",
        description: "The cadence has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating cadence",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update cadence mutation
  const updateCadenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/cadences/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cadences"] });
      setIsEditCadenceDialogOpen(false);
      setSelectedCadence(null);
      toast({
        title: "Cadence updated",
        description: "The cadence has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating cadence",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete cadence mutation
  const deleteCadenceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cadences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cadences"] });
      setIsDeleteDialogOpen(false);
      setSelectedCadence(null);
      toast({
        title: "Cadence deleted",
        description: "The cadence has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting cadence",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleNewCadenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCadence(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewCadence(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditCadence(prev => ({ ...prev, [name]: value }));
  };

  const resetNewCadenceForm = () => {
    setNewCadence({
      name: "",
      description: "",
      period: "quarterly",
      startMonth: "1"
    });
  };

  const handleCreateCadence = () => {
    const cadenceData = {
      ...newCadence,
      startMonth: parseInt(newCadence.startMonth)
    };
    
    createCadenceMutation.mutate(cadenceData);
  };

  const handleUpdateCadence = () => {
    if (!selectedCadence) return;
    
    const cadenceData = {
      ...editCadence,
      startMonth: parseInt(editCadence.startMonth)
    };
    
    updateCadenceMutation.mutate({
      id: selectedCadence.id,
      data: cadenceData
    });
  };

  const handleDeleteCadence = () => {
    if (!selectedCadence) return;
    deleteCadenceMutation.mutate(selectedCadence.id);
  };

  return (
    <DashboardLayout title="Configuration - Cadences">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadences</h1>
          <p className="text-gray-600">Manage cadences for your OKR cycles</p>
        </div>
        
        <Dialog open={isNewCadenceDialogOpen} onOpenChange={setIsNewCadenceDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Cadence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Cadence</DialogTitle>
              <DialogDescription>
                Add a new cadence to structure your organization's OKR cycles.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name"
                  value={newCadence.name}
                  onChange={handleNewCadenceChange}
                  placeholder="e.g., Quarterly, Annual" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description"
                  value={newCadence.description}
                  onChange={handleNewCadenceChange}
                  placeholder="e.g., Standard quarterly planning cycle" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="period">Period</Label>
                <Select 
                  value={newCadence.period} 
                  onValueChange={(value) => handleSelectChange("period", value)}
                >
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="biannual">Biannual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="startMonth">Start Month</Label>
                <Select 
                  value={newCadence.startMonth} 
                  onValueChange={(value) => handleSelectChange("startMonth", value)}
                >
                  <SelectTrigger id="startMonth">
                    <SelectValue placeholder="Select start month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetNewCadenceForm();
                  setIsNewCadenceDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCadence}
                disabled={
                  !newCadence.name || 
                  !newCadence.period ||
                  createCadenceMutation.isPending
                }
              >
                {createCadenceMutation.isPending ? "Creating..." : "Create Cadence"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Cadence Dialog */}
      <Dialog open={isEditCadenceDialogOpen} onOpenChange={setIsEditCadenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cadence</DialogTitle>
            <DialogDescription>
              Update cadence information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Name</Label>
              <Input 
                id="editName" 
                value={editCadence.name}
                onChange={(e) => setEditCadence(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editDescription">Description</Label>
              <Input 
                id="editDescription" 
                value={editCadence.description}
                onChange={(e) => setEditCadence(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editPeriod">Period</Label>
              <Select 
                value={editCadence.period} 
                onValueChange={(value) => handleEditSelectChange("period", value)}
              >
                <SelectTrigger id="editPeriod">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="biannual">Biannual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editStartMonth">Start Month</Label>
              <Select 
                value={editCadence.startMonth} 
                onValueChange={(value) => handleEditSelectChange("startMonth", value)}
              >
                <SelectTrigger id="editStartMonth">
                  <SelectValue placeholder="Select start month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditCadenceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCadence}
              disabled={
                !editCadence.name || 
                !editCadence.period ||
                updateCadenceMutation.isPending
              }
            >
              {updateCadenceMutation.isPending ? "Updating..." : "Update Cadence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Cadence Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cadence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cadence? 
              This action cannot be undone and will remove all associated timeframes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCadence}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCadenceMutation.isPending}
            >
              {deleteCadenceMutation.isPending ? "Deleting..." : "Delete Cadence"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-slate-200 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                    <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : cadences && cadences.length > 0 ? (
          <div className="overflow-x-auto">
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
                {cadences.map(cadence => {
                  // Convert numeric month to name
                  const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ];
                  const startMonth = cadence.startMonth || 1; // Default to January if null
                  const monthName = monthNames[(startMonth - 1) % 12];
                  
                  return (
                    <TableRow key={cadence.id}>
                      <TableCell className="font-medium">{cadence.name}</TableCell>
                      <TableCell>{cadence.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cadence.period.charAt(0).toUpperCase() + cadence.period.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{monthName}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedCadence(cadence);
                                
                                // Initialize edit form with current values
                                setEditCadence({
                                  name: cadence.name,
                                  description: cadence.description || "",
                                  period: cadence.period,
                                  startMonth: (cadence.startMonth || 1).toString()
                                });
                                
                                setIsEditCadenceDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Cadence
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Navigate to timeframes page filtered by this cadence
                                window.location.href = `/configuration/timeframes?cadence=${cadence.id}`;
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              View Timeframes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedCadence(cadence);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Cadence
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">No cadences found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a cadence to begin structuring your OKR cycles.
            </p>
            <Button 
              onClick={() => setIsNewCadenceDialogOpen(true)}
              className="mt-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Cadence
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
