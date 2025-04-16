import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
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
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  CalendarIcon,
  Calendar as CalendarIcon2
} from "lucide-react";
import { Timeframe, Cadence } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Timeframes() {
  const { toast } = useToast();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const cadenceIdParam = searchParams.get("cadence");

  const [filterCadenceId, setFilterCadenceId] = useState<string | null>(cadenceIdParam);
  const [isNewTimeframeDialogOpen, setIsNewTimeframeDialogOpen] = useState(false);
  const [isEditTimeframeDialogOpen, setIsEditTimeframeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | null>(null);

  // New timeframe form state
  const [newTimeframe, setNewTimeframe] = useState({
    name: "",
    startDate: new Date(),
    endDate: new Date(),
    cadenceId: ""
  });

  // Edit timeframe form state
  const [editTimeframe, setEditTimeframe] = useState({
    name: "",
    startDate: new Date(),
    endDate: new Date(),
    cadenceId: ""
  });

  // Fetch cadences
  const { data: cadences } = useQuery<Cadence[]>({
    queryKey: ["/api/cadences"]
  });

  // Fetch timeframes
  const { data: timeframes, isLoading } = useQuery<Timeframe[]>({
    queryKey: filterCadenceId 
      ? [`/api/cadences/${filterCadenceId}/timeframes`] 
      : ["/api/timeframes"]
  });

  // Create timeframe mutation
  const createTimeframeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/timeframes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      if (filterCadenceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cadences/${filterCadenceId}/timeframes`] });
      }
      setIsNewTimeframeDialogOpen(false);
      resetNewTimeframeForm();
      toast({
        title: "Timeframe created",
        description: "The timeframe has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating timeframe",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update timeframe mutation
  const updateTimeframeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/timeframes/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      if (filterCadenceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cadences/${filterCadenceId}/timeframes`] });
      }
      setIsEditTimeframeDialogOpen(false);
      setSelectedTimeframe(null);
      toast({
        title: "Timeframe updated",
        description: "The timeframe has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating timeframe",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete timeframe mutation
  const deleteTimeframeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/timeframes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      if (filterCadenceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cadences/${filterCadenceId}/timeframes`] });
      }
      setIsDeleteDialogOpen(false);
      setSelectedTimeframe(null);
      toast({
        title: "Timeframe deleted",
        description: "The timeframe has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting timeframe",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Initialize form with filter cadence if provided
  useEffect(() => {
    if (cadenceIdParam) {
      setNewTimeframe(prev => ({ ...prev, cadenceId: cadenceIdParam }));
    }
  }, [cadenceIdParam]);

  const handleSelectChange = (name: string, value: string) => {
    setNewTimeframe(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditTimeframe(prev => ({ ...prev, [name]: value }));
  };

  const resetNewTimeframeForm = () => {
    setNewTimeframe({
      name: "",
      startDate: new Date(),
      endDate: new Date(),
      cadenceId: filterCadenceId !== "all" && filterCadenceId ? filterCadenceId : ""
    });
  };

  const handleCreateTimeframe = () => {
    const timeframeData = {
      ...newTimeframe,
      cadenceId: parseInt(newTimeframe.cadenceId),
      startDate: newTimeframe.startDate.toISOString(),
      endDate: newTimeframe.endDate.toISOString()
    };
    
    createTimeframeMutation.mutate(timeframeData);
  };

  const handleUpdateTimeframe = () => {
    if (!selectedTimeframe) return;
    
    const timeframeData = {
      ...editTimeframe,
      cadenceId: parseInt(editTimeframe.cadenceId),
      startDate: editTimeframe.startDate.toISOString(),
      endDate: editTimeframe.endDate.toISOString()
    };
    
    updateTimeframeMutation.mutate({
      id: selectedTimeframe.id,
      data: timeframeData
    });
  };

  const handleDeleteTimeframe = () => {
    if (!selectedTimeframe) return;
    deleteTimeframeMutation.mutate(selectedTimeframe.id);
  };

  // Find cadence name by ID
  const getCadenceName = (cadenceId: number | null | undefined) => {
    if (!cadenceId || !cadences) return "None";
    const cadence = cadences.find(c => c.id === cadenceId);
    return cadence ? cadence.name : "Unknown";
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "PP");
  };

  return (
    <DashboardLayout title="Configuration - Timeframes">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeframes</h1>
          <p className="text-gray-600">Manage timeframes for your OKR cycles</p>
        </div>
        
        <div className="flex gap-3">
          <div className="w-48">
            <Select 
              value={filterCadenceId || "all"} 
              onValueChange={(value) => setFilterCadenceId(value !== "all" ? value : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by cadence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cadences</SelectItem>
                {cadences?.map(cadence => (
                  <SelectItem key={cadence.id} value={cadence.id.toString()}>
                    {cadence.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isNewTimeframeDialogOpen} onOpenChange={setIsNewTimeframeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Timeframe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Timeframe</DialogTitle>
                <DialogDescription>
                  Add a new timeframe to structure your organization's OKR cycles.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={newTimeframe.name}
                    onChange={(e) => setNewTimeframe(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Q1 2025, Annual 2025" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="cadence">Cadence</Label>
                  <Select 
                    value={newTimeframe.cadenceId} 
                    onValueChange={(value) => handleSelectChange("cadenceId", value)}
                  >
                    <SelectTrigger id="cadence">
                      <SelectValue placeholder="Select cadence" />
                    </SelectTrigger>
                    <SelectContent>
                      {cadences?.map(cadence => (
                        <SelectItem key={cadence.id} value={cadence.id.toString()}>
                          {cadence.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTimeframe.startDate ? (
                          format(newTimeframe.startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTimeframe.startDate}
                        onSelect={(date) => date && setNewTimeframe(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTimeframe.endDate ? (
                          format(newTimeframe.endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTimeframe.endDate}
                        onSelect={(date) => date && setNewTimeframe(prev => ({ ...prev, endDate: date }))}
                        initialFocus
                        fromDate={newTimeframe.startDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetNewTimeframeForm();
                    setIsNewTimeframeDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTimeframe}
                  disabled={
                    !newTimeframe.name || 
                    !newTimeframe.cadenceId ||
                    !newTimeframe.startDate ||
                    !newTimeframe.endDate ||
                    createTimeframeMutation.isPending
                  }
                >
                  {createTimeframeMutation.isPending ? "Creating..." : "Create Timeframe"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Timeframe Dialog */}
      <Dialog open={isEditTimeframeDialogOpen} onOpenChange={setIsEditTimeframeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timeframe</DialogTitle>
            <DialogDescription>
              Update timeframe information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Name</Label>
              <Input 
                id="editName" 
                value={editTimeframe.name}
                onChange={(e) => setEditTimeframe(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editCadence">Cadence</Label>
              <Select 
                value={editTimeframe.cadenceId} 
                onValueChange={(value) => handleEditSelectChange("cadenceId", value)}
              >
                <SelectTrigger id="editCadence">
                  <SelectValue placeholder="Select cadence" />
                </SelectTrigger>
                <SelectContent>
                  {cadences?.map(cadence => (
                    <SelectItem key={cadence.id} value={cadence.id.toString()}>
                      {cadence.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editStartDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editTimeframe.startDate ? (
                      format(editTimeframe.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editTimeframe.startDate}
                    onSelect={(date) => date && setEditTimeframe(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editEndDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editTimeframe.endDate ? (
                      format(editTimeframe.endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editTimeframe.endDate}
                    onSelect={(date) => date && setEditTimeframe(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                    fromDate={editTimeframe.startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditTimeframeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTimeframe}
              disabled={
                !editTimeframe.name || 
                !editTimeframe.cadenceId ||
                !editTimeframe.startDate ||
                !editTimeframe.endDate ||
                updateTimeframeMutation.isPending
              }
            >
              {updateTimeframeMutation.isPending ? "Updating..." : "Update Timeframe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Timeframe Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeframe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timeframe? 
              This action cannot be undone and will affect any objectives linked to this timeframe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTimeframe}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTimeframeMutation.isPending}
            >
              {deleteTimeframeMutation.isPending ? "Deleting..." : "Delete Timeframe"}
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
        ) : timeframes && timeframes.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Cadence</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeframes.map(timeframe => (
                  <TableRow key={timeframe.id}>
                    <TableCell className="font-medium">{timeframe.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCadenceName(timeframe.cadenceId)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(timeframe.startDate)}</TableCell>
                    <TableCell>{formatDate(timeframe.endDate)}</TableCell>
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
                              setSelectedTimeframe(timeframe);
                              
                              // Initialize edit form with current values
                              setEditTimeframe({
                                name: timeframe.name,
                                cadenceId: timeframe.cadenceId.toString(),
                                startDate: new Date(timeframe.startDate),
                                endDate: new Date(timeframe.endDate)
                              });
                              
                              setIsEditTimeframeDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Timeframe
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // Navigate to objectives page filtered by this timeframe
                              window.location.href = `/company-strategy?timeframe=${timeframe.id}`;
                            }}
                          >
                            <CalendarIcon2 className="h-4 w-4 mr-2" />
                            View Objectives
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              setSelectedTimeframe(timeframe);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Timeframe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">No timeframes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterCadenceId 
                ? "No timeframes are associated with this cadence."
                : "Create a timeframe to begin structuring your OKR cycles."}
            </p>
            <Button 
              onClick={() => setIsNewTimeframeDialogOpen(true)}
              className="mt-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Timeframe
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
