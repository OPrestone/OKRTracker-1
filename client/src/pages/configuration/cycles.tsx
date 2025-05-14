import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, MoreHorizontal, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { Cycle, Timeframe } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Cycles() {
  const { toast } = useToast();
  const [isNewCycleDialogOpen, setIsNewCycleDialogOpen] = useState(false);
  const [isEditCycleDialogOpen, setIsEditCycleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);

  // New cycle form state
  const [newCycle, setNewCycle] = useState({
    name: "",
    description: "",
    timeframeId: "",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    status: "active"
  });

  // Edit cycle form state
  const [editCycle, setEditCycle] = useState({
    name: "",
    description: "",
    timeframeId: "",
    startDate: new Date(),
    endDate: new Date(),
    status: "active"
  });

  // Fetch cycles
  const { data: cycles, isLoading: isLoadingCycles } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"]
  });

  // Fetch timeframes for the dropdown
  const { data: timeframes, isLoading: isLoadingTimeframes } = useQuery<Timeframe[]>({
    queryKey: ["/api/timeframes"]
  });

  // Create cycle mutation
  const createCycleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cycles", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      setIsNewCycleDialogOpen(false);
      resetNewCycleForm();
      toast({
        title: "Cycle created",
        description: "The cycle has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating cycle",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update cycle mutation
  const updateCycleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiRequest("PATCH", `/api/cycles/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      setIsEditCycleDialogOpen(false);
      setSelectedCycle(null);
      toast({
        title: "Cycle updated",
        description: "The cycle has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating cycle",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete cycle mutation
  const deleteCycleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      setIsDeleteDialogOpen(false);
      setSelectedCycle(null);
      toast({
        title: "Cycle deleted",
        description: "The cycle has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting cycle",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleNewCycleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCycle(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCycleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditCycle(prev => ({ ...prev, [name]: value }));
  };

  const handleNewSelectChange = (name: string, value: string) => {
    setNewCycle(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditCycle(prev => ({ ...prev, [name]: value }));
  };

  const resetNewCycleForm = () => {
    setNewCycle({
      name: "",
      description: "",
      timeframeId: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      status: "active"
    });
  };

  const handleCreateCycle = () => {
    createCycleMutation.mutate(newCycle);
  };

  const handleUpdateCycle = () => {
    if (!selectedCycle) return;
    
    updateCycleMutation.mutate({
      id: selectedCycle.id,
      data: editCycle
    });
  };

  const handleDeleteCycle = () => {
    if (!selectedCycle) return;
    deleteCycleMutation.mutate(selectedCycle.id);
  };

  const handleEditClick = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setEditCycle({
      name: cycle.name,
      description: cycle.description || "",
      timeframeId: cycle.timeframeId || "",
      startDate: new Date(cycle.startDate),
      endDate: new Date(cycle.endDate),
      status: cycle.status
    });
    setIsEditCycleDialogOpen(true);
  };

  const handleDeleteClick = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setIsDeleteDialogOpen(true);
  };

  const getTimeframeName = (timeframeId: string) => {
    if (!timeframes) return "N/A";
    const timeframe = timeframes.find(t => t.id === timeframeId);
    return timeframe ? timeframe.name : "N/A";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "upcoming":
        return <Badge className="bg-yellow-500">Upcoming</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Configuration - Cycles">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">Cycles</h1>
          <p className="text-gray-600 ml-1">Manage OKR cycles for your organization</p>
        </div>
        
        <Dialog open={isNewCycleDialogOpen} onOpenChange={setIsNewCycleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Cycle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Cycle</DialogTitle>
              <DialogDescription>
                Add a new cycle to track your organization's objectives and key results.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name"
                  value={newCycle.name}
                  onChange={handleNewCycleChange}
                  placeholder="e.g., Q2 2025" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description"
                  value={newCycle.description}
                  onChange={handleNewCycleChange}
                  placeholder="e.g., Focus on product expansion" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="timeframeId">Timeframe</Label>
                <Select 
                  value={newCycle.timeframeId} 
                  onValueChange={(value) => handleNewSelectChange("timeframeId", value)}
                >
                  <SelectTrigger id="timeframeId">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTimeframes ? (
                      <SelectItem value="loading" disabled>Loading timeframes...</SelectItem>
                    ) : timeframes && timeframes.length > 0 ? (
                      timeframes.map(timeframe => (
                        <SelectItem key={timeframe.id} value={timeframe.id}>
                          {timeframe.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No timeframes available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-full"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCycle.startDate ? format(newCycle.startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newCycle.startDate}
                      onSelect={(date) => date && setNewCycle(prev => ({ ...prev, startDate: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-full"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCycle.endDate ? format(newCycle.endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newCycle.endDate}
                      onSelect={(date) => date && setNewCycle(prev => ({ ...prev, endDate: date }))}
                      disabled={(date) => date < newCycle.startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newCycle.status} 
                  onValueChange={(value) => handleNewSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetNewCycleForm();
                  setIsNewCycleDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCycle}
                disabled={
                  !newCycle.name || 
                  !newCycle.startDate ||
                  !newCycle.endDate ||
                  createCycleMutation.isPending
                }
              >
                {createCycleMutation.isPending ? "Creating..." : "Create Cycle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table of Cycles */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Timeframe</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingCycles ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading cycles...
                </TableCell>
              </TableRow>
            ) : cycles && cycles.length > 0 ? (
              cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">{cycle.name}</TableCell>
                  <TableCell>{cycle.timeframeId ? getTimeframeName(cycle.timeframeId) : "N/A"}</TableCell>
                  <TableCell>{format(new Date(cycle.startDate), "PP")}</TableCell>
                  <TableCell>{format(new Date(cycle.endDate), "PP")}</TableCell>
                  <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditClick(cycle)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(cycle)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No cycles found. Create your first cycle to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Cycle Dialog */}
      <Dialog open={isEditCycleDialogOpen} onOpenChange={setIsEditCycleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cycle</DialogTitle>
            <DialogDescription>
              Update cycle information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Name</Label>
              <Input 
                id="editName" 
                name="name"
                value={editCycle.name}
                onChange={handleEditCycleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editDescription">Description</Label>
              <Input 
                id="editDescription" 
                name="description"
                value={editCycle.description}
                onChange={handleEditCycleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editTimeframeId">Timeframe</Label>
              <Select 
                value={editCycle.timeframeId} 
                onValueChange={(value) => handleEditSelectChange("timeframeId", value)}
              >
                <SelectTrigger id="editTimeframeId">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTimeframes ? (
                    <SelectItem value="loading" disabled>Loading timeframes...</SelectItem>
                  ) : timeframes && timeframes.length > 0 ? (
                    timeframes.map(timeframe => (
                      <SelectItem key={timeframe.id} value={timeframe.id}>
                        {timeframe.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No timeframes available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editStartDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal w-full"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editCycle.startDate ? format(editCycle.startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editCycle.startDate}
                    onSelect={(date) => date && setEditCycle(prev => ({ ...prev, startDate: date }))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editEndDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal w-full"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editCycle.endDate ? format(editCycle.endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editCycle.endDate}
                    onSelect={(date) => date && setEditCycle(prev => ({ ...prev, endDate: date }))}
                    disabled={(date) => date < editCycle.startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select 
                value={editCycle.status} 
                onValueChange={(value) => handleEditSelectChange("status", value)}
              >
                <SelectTrigger id="editStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditCycleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCycle}
              disabled={
                !editCycle.name || 
                !editCycle.startDate ||
                !editCycle.endDate ||
                updateCycleMutation.isPending
              }
            >
              {updateCycleMutation.isPending ? "Updating..." : "Update Cycle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Cycle Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cycle? 
              This action cannot be undone and may affect associated objectives and key results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCycle}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteCycleMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}