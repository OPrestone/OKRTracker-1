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
import { format, addMonths, addYears } from "date-fns";
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
import { queryClient, apiRequest, getCurrentTenantFromUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ContextualTooltip } from "@/components/help/contextual-tooltip";
import { timeframesContextualHelp } from "@/components/help/contextual-help-content";
import { useHelp } from "@/hooks/use-help-context";

export default function Timeframes() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const helpContext = useHelp();
  
  // State for filter and dialogs
  const [filter, setFilter] = useState("");
  const [filterCadenceId, setFilterCadenceId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    start_date: new Date(),
    end_date: new Date(),
    cadence_id: "",
    description: ""
  });
  
  // Calculate end date based on cadence and start date
  const calculateEndDate = (startDate: Date, cadenceType: string) => {
    if (cadenceType === 'quarterly') {
      return addMonths(startDate, 3);
    } else if (cadenceType === 'biannual') {
      return addMonths(startDate, 6);
    } else if (cadenceType === 'annual') {
      return addYears(startDate, 1);
    }
    // For custom cadences, use the user-selected end date
    return formState.end_date;
  };

  // Reset form state
  const resetForm = () => {
    setFormState({
      name: "",
      start_date: new Date(),
      end_date: new Date(),
      cadence_id: "",
      description: ""
    });
    setSelectedTimeframe(null);
  };

  // Fetch timeframes query
  const timeframesQuery = useQuery({ 
    queryKey: ["/api/timeframes", filterCadenceId], 
    queryFn: async ({ queryKey }) => {
      const [endpoint, cadenceId] = queryKey;
      let url = endpoint as string;
      
      // Get tenant ID from URL or session storage
      const tenantId = getCurrentTenantFromUrl();
      
      // Add tenant ID as query parameter
      url = `${url}?tenantId=${tenantId}`;
      
      if (cadenceId) {
        url = `/api/cadences/${cadenceId}/timeframes?tenantId=${tenantId}`;
      }
      
      const res = await apiRequest("GET", url);
      return await res.json();
    },
    meta: { requiresTenant: true }
  });

  // Create timeframe mutation
  const createTimeframeMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get tenant ID from URL or session storage
      const tenantId = getCurrentTenantFromUrl();
      
      // Make sure the tenant ID is included in data
      const updatedData = {
        ...data,
        tenantId
      };
      
      const res = await apiRequest("POST", "/api/timeframes", updatedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      if (filterCadenceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cadences/${filterCadenceId}/timeframes`] });
      }
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success!",
        description: "Timeframe has been created."
      });
    }
  });

  // Update timeframe mutation
  const updateTimeframeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      // Get tenant ID from URL or session storage
      const tenantId = getCurrentTenantFromUrl();
      
      // Make sure the tenant ID is included in data
      const updatedData = {
        ...data,
        tenantId
      };
      
      const res = await apiRequest("PATCH", `/api/timeframes/${id}`, updatedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      if (filterCadenceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cadences/${filterCadenceId}/timeframes`] });
      }
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success!",
        description: "Timeframe has been updated."
      });
    }
  });

  // Delete timeframe mutation
  const deleteTimeframeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get tenant ID from URL or session storage
      const tenantId = getCurrentTenantFromUrl();
      
      // For DELETE requests, include the tenant ID as a query parameter
      await apiRequest("DELETE", `/api/timeframes/${id}?tenantId=${tenantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
      if (filterCadenceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cadences/${filterCadenceId}/timeframes`] });
      }
      setIsDeleteDialogOpen(false);
      setSelectedTimeframe(null);
      toast({
        title: "Success!",
        description: "Timeframe has been deleted."
      });
    }
  });

  // Fetch cadences for dropdown
  const cadencesQuery = useQuery({ 
    queryKey: ["/api/cadences"],
    meta: { requiresTenant: true }
  });

  // Handle form submission
  const handleCreateOrUpdate = () => {
    // Validate form
    if (!formState.name) {
      toast({
        title: "Error",
        description: "Please provide a name for the timeframe.",
        variant: "destructive"
      });
      return;
    }

    if (!formState.cadence_id) {
      toast({
        title: "Error",
        description: "Please select a cadence for the timeframe.",
        variant: "destructive"
      });
      return;
    }

    // Get selected cadence to determine its type
    const selectedCadence = cadencesQuery.data?.find((c: Cadence) => c.id === formState.cadence_id);
    
    // Calculate end date based on cadence type (unless it's a custom cadence)
    let endDate = formState.end_date;
    if (selectedCadence && selectedCadence.period !== 'custom') {
      endDate = calculateEndDate(formState.start_date, selectedCadence.period);
    }

    const data = {
      ...formState,
      start_date: formState.start_date.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };

    if (selectedTimeframe) {
      updateTimeframeMutation.mutate({ id: selectedTimeframe.id, data });
    } else {
      createTimeframeMutation.mutate(data);
    }
  };

  // Handle opening edit dialog
  const handleEdit = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
    setFormState({
      name: timeframe.name,
      description: timeframe.description || "",
      cadence_id: timeframe.cadence_id,
      start_date: new Date(timeframe.start_date),
      end_date: new Date(timeframe.end_date)
    });
    setIsDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDelete = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
    setIsDeleteDialogOpen(true);
  };

  // Update cadence and calculate end date if it's not a custom cadence
  const handleCadenceChange = (cadenceId: string) => {
    setFormState(prev => ({ ...prev, cadence_id: cadenceId }));
    
    // Get selected cadence to determine its type
    const selectedCadence = cadencesQuery.data?.find((c: Cadence) => c.id === cadenceId);
    
    // If it's not a custom cadence, calculate the end date
    if (selectedCadence && selectedCadence.period !== 'custom') {
      const newEndDate = calculateEndDate(formState.start_date, selectedCadence.period);
      setFormState(prev => ({ ...prev, end_date: newEndDate }));
    }
  };

  // Filter timeframes based on search input
  const filteredTimeframes = timeframesQuery.data?.filter(
    (timeframe: Timeframe) => 
      timeframe.name.toLowerCase().includes(filter.toLowerCase()) ||
      (timeframe.description && timeframe.description.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Timeframes</h1>
          <ContextualTooltip content={timeframesContextualHelp.title} />
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Timeframe
        </Button>
      </div>

      <div className="flex items-center mb-6 gap-4">
        <div className="grow">
          <Input 
            placeholder="Search timeframes..." 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div>
          <Select 
            value={filterCadenceId || "all"} 
            onValueChange={value => setFilterCadenceId(value === "all" ? null : value)}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by cadence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cadences</SelectItem>
              {cadencesQuery.data?.map((cadence: Cadence) => (
                <SelectItem key={cadence.id} value={cadence.id}>{cadence.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {timeframesQuery.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading timeframes...</p>
        </div>
      ) : timeframesQuery.isError ? (
        <div className="flex justify-center items-center h-64 text-red-500">
          <p>Error loading timeframes. Please try again.</p>
        </div>
      ) : filteredTimeframes?.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          <p>No timeframes found. Please create one or adjust your filter.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Cadence</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTimeframes?.map((timeframe: Timeframe) => (
              <TableRow key={timeframe.id}>
                <TableCell>
                  <div className="font-medium">{timeframe.name}</div>
                </TableCell>
                <TableCell>
                  {cadencesQuery.data?.find((c: Cadence) => c.id === timeframe.cadence_id)?.name || '-'}
                </TableCell>
                <TableCell>{new Date(timeframe.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(timeframe.end_date).toLocaleDateString()}</TableCell>
                <TableCell>{timeframe.description || '-'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(timeframe)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(timeframe)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedTimeframe ? 'Edit Timeframe' : 'Create Timeframe'}</DialogTitle>
            <DialogDescription>
              {selectedTimeframe 
                ? 'Update the details of this timeframe.' 
                : 'Set up a new timeframe for your OKR cycle.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formState.name} 
                onChange={e => setFormState({...formState, name: e.target.value})}
                placeholder="Q1 2023"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cadence">Cadence</Label>
              <Select 
                value={formState.cadence_id} 
                onValueChange={handleCadenceChange}
              >
                <SelectTrigger id="cadence">
                  <SelectValue placeholder="Select a cadence" />
                </SelectTrigger>
                <SelectContent>
                  {cadencesQuery.data?.map((cadence: Cadence) => (
                    <SelectItem key={cadence.id} value={cadence.id}>
                      {cadence.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="start-date"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.start_date ? format(formState.start_date, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.start_date}
                    onSelect={date => {
                      if (date) {
                        // Update start date
                        setFormState({...formState, start_date: date});
                        
                        // Get selected cadence
                        const selectedCadence = cadencesQuery.data?.find(
                          (c: Cadence) => c.id === formState.cadence_id
                        );
                        
                        // If not a custom cadence, automatically update end date
                        if (selectedCadence && selectedCadence.period !== 'custom') {
                          const newEndDate = calculateEndDate(date, selectedCadence.period);
                          setFormState(prev => ({ ...prev, end_date: newEndDate }));
                        }
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="end-date"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.end_date ? format(formState.end_date, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.end_date}
                    onSelect={date => date && setFormState({...formState, end_date: date})}
                    disabled={date => {
                      // Disable dates before start date
                      return date < formState.start_date;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input 
                id="description" 
                value={formState.description} 
                onChange={e => setFormState({...formState, description: e.target.value})}
                placeholder="Description of this timeframe"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateOrUpdate} 
              disabled={createTimeframeMutation.isPending || updateTimeframeMutation.isPending}
            >
              {createTimeframeMutation.isPending || updateTimeframeMutation.isPending 
                ? 'Saving...' 
                : selectedTimeframe ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the timeframe "{selectedTimeframe?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTimeframe && deleteTimeframeMutation.mutate(selectedTimeframe.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTimeframeMutation.isPending}
            >
              {deleteTimeframeMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}