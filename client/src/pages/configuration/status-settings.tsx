import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Save,
  Trash2,
  XCircle,
  Flag,
  Circle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusOption {
  id: string;
  name: string;
  label: string;
  color: string;
  description: string;
  icon: string;
  order: number;
  isDefault: boolean;
  isSystem: boolean;
}

const StatusSettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("objective");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption | null>(null);
  
  // Form state for new status
  const [newStatus, setNewStatus] = useState<Omit<StatusOption, 'id'>>({
    name: "",
    label: "",
    color: "#6d28d9",
    description: "",
    icon: "circle",
    order: 0,
    isDefault: false,
    isSystem: false
  });

  // Status option data (derived from system status enum)
  const [objectiveStatuses, setObjectiveStatuses] = useState<StatusOption[]>([
    {
      id: "not_started",
      name: "not_started",
      label: "Not Started",
      color: "#94a3b8",
      description: "Objective has been created but work has not begun",
      icon: "clock",
      order: 1,
      isDefault: true,
      isSystem: true
    },
    {
      id: "on_track",
      name: "on_track",
      label: "On Track",
      color: "#10b981",
      description: "Objective is progressing as expected",
      icon: "check-circle",
      order: 2,
      isDefault: false,
      isSystem: true
    },
    {
      id: "at_risk",
      name: "at_risk",
      label: "At Risk",
      color: "#f59e0b",
      description: "Objective is in danger of not being completed",
      icon: "alert-circle",
      order: 3,
      isDefault: false,
      isSystem: true
    },
    {
      id: "behind",
      name: "behind",
      label: "Behind",
      color: "#ef4444",
      description: "Objective is behind schedule and needs attention",
      icon: "x-circle",
      order: 4,
      isDefault: false,
      isSystem: true
    },
    {
      id: "completed",
      name: "completed",
      label: "Completed",
      color: "#8b5cf6",
      description: "Objective has been successfully completed",
      icon: "flag",
      order: 5,
      isDefault: false,
      isSystem: true
    }
  ]);

  const [keyResultStatuses, setKeyResultStatuses] = useState<StatusOption[]>([
    {
      id: "not_started",
      name: "not_started",
      label: "Not Started",
      color: "#94a3b8",
      description: "Key Result has been created but work has not begun",
      icon: "clock",
      order: 1,
      isDefault: true,
      isSystem: true
    },
    {
      id: "on_track",
      name: "on_track",
      label: "On Track",
      color: "#10b981",
      description: "Key Result is progressing as expected",
      icon: "check-circle",
      order: 2,
      isDefault: false,
      isSystem: true
    },
    {
      id: "at_risk",
      name: "at_risk",
      label: "At Risk",
      color: "#f59e0b",
      description: "Key Result is in danger of not being completed",
      icon: "alert-circle",
      order: 3,
      isDefault: false,
      isSystem: true
    },
    {
      id: "behind",
      name: "behind",
      label: "Behind",
      color: "#ef4444",
      description: "Key Result is behind schedule and needs attention",
      icon: "x-circle",
      order: 4,
      isDefault: false,
      isSystem: true
    },
    {
      id: "completed",
      name: "completed",
      label: "Completed",
      color: "#8b5cf6",
      description: "Key Result has been successfully completed",
      icon: "flag",
      order: 5,
      isDefault: false,
      isSystem: true
    }
  ]);

  // Handler for setting default status
  const handleSetDefault = (id: string) => {
    if (activeTab === "objective") {
      setObjectiveStatuses(objectiveStatuses.map(status => ({
        ...status,
        isDefault: status.id === id
      })));
    } else {
      setKeyResultStatuses(keyResultStatuses.map(status => ({
        ...status,
        isDefault: status.id === id
      })));
    }
  };

  // Handler for opening edit dialog
  const handleEditStatus = (status: StatusOption) => {
    setSelectedStatus(status);
    setIsEditDialogOpen(true);
  };

  // Handler for updating status
  const handleUpdateStatus = () => {
    if (!selectedStatus) return;
    
    if (activeTab === "objective") {
      setObjectiveStatuses(
        objectiveStatuses.map(status => 
          status.id === selectedStatus.id ? selectedStatus : status
        )
      );
    } else {
      setKeyResultStatuses(
        keyResultStatuses.map(status => 
          status.id === selectedStatus.id ? selectedStatus : status
        )
      );
    }
    
    setIsEditDialogOpen(false);
    toast({
      title: "Status updated",
      description: `Status "${selectedStatus.label}" has been updated successfully.`
    });
  };

  // Handler for adding new status
  const handleAddStatus = () => {
    const id = newStatus.name.toLowerCase().replace(/\s+/g, '_');
    const statusOption: StatusOption = {
      ...newStatus,
      id
    };
    
    if (activeTab === "objective") {
      setObjectiveStatuses([...objectiveStatuses, statusOption]);
    } else {
      setKeyResultStatuses([...keyResultStatuses, statusOption]);
    }
    
    setIsAddDialogOpen(false);
    setNewStatus({
      name: "",
      label: "",
      color: "#6d28d9",
      description: "",
      icon: "circle",
      order: 0,
      isDefault: false,
      isSystem: false
    });
    
    toast({
      title: "Status added",
      description: `Status "${statusOption.label}" has been added successfully.`
    });
  };

  // Handler for saving all changes
  const handleSaveChanges = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Changes saved",
      description: "Status settings have been updated successfully."
    });
  };

  // Function to render the appropriate icon
  const renderStatusIcon = (iconName: string) => {
    switch (iconName) {
      case 'check-circle':
        return <CheckCircle className="h-4 w-4" />;
      case 'alert-circle':
        return <AlertCircle className="h-4 w-4" />;
      case 'x-circle':
        return <XCircle className="h-4 w-4" />;
      case 'clock':
        return <Clock className="h-4 w-4" />;
      case 'flag':
        return <Flag className="h-4 w-4" />;
      case 'circle':
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout title="Status Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Status Settings</h1>
        <p className="text-gray-600">Configure and manage status options for objectives and key results</p>
      </div>

      <Tabs defaultValue="objective" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="objective">Objective Statuses</TabsTrigger>
          <TabsTrigger value="keyresult">Key Result Statuses</TabsTrigger>
        </TabsList>

        <TabsContent value="objective">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Objective Status Settings</CardTitle>
                <CardDescription>
                  Manage the available status options for objectives
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Status</DialogTitle>
                    <DialogDescription>
                      Create a new status option for objectives
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newStatus.name}
                        onChange={(e) => setNewStatus({...newStatus, name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="label" className="text-right">
                        Display Label
                      </Label>
                      <Input
                        id="label"
                        value={newStatus.label}
                        onChange={(e) => setNewStatus({...newStatus, label: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="color" className="text-right">
                        Color
                      </Label>
                      <div className="col-span-3 flex gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={newStatus.color}
                          onChange={(e) => setNewStatus({...newStatus, color: e.target.value})}
                          className="w-12 h-9 p-1"
                        />
                        <Input
                          value={newStatus.color}
                          onChange={(e) => setNewStatus({...newStatus, color: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={newStatus.description}
                        onChange={(e) => setNewStatus({...newStatus, description: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="icon" className="text-right">
                        Icon
                      </Label>
                      <Select
                        value={newStatus.icon}
                        onValueChange={(value) => setNewStatus({...newStatus, icon: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="check-circle">Check Circle</SelectItem>
                          <SelectItem value="alert-circle">Alert Circle</SelectItem>
                          <SelectItem value="x-circle">X Circle</SelectItem>
                          <SelectItem value="clock">Clock</SelectItem>
                          <SelectItem value="flag">Flag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="order" className="text-right">
                        Display Order
                      </Label>
                      <Input
                        id="order"
                        type="number"
                        value={newStatus.order}
                        onChange={(e) => setNewStatus({...newStatus, order: parseInt(e.target.value)})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isDefault" className="text-right">
                        Default Status
                      </Label>
                      <div className="flex items-center space-x-2 col-span-3">
                        <Switch
                          id="isDefault"
                          checked={newStatus.isDefault}
                          onCheckedChange={(checked) => setNewStatus({...newStatus, isDefault: checked})}
                        />
                        <Label htmlFor="isDefault">Set as default</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddStatus}>Create Status</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display Label</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {objectiveStatuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell>{status.label}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-200" 
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center justify-center w-6 h-6 rounded-full"
                          style={{ color: status.color }}
                        >
                          {renderStatusIcon(status.icon)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={status.isDefault}
                            onCheckedChange={() => handleSetDefault(status.id)}
                            disabled={status.isDefault}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditStatus(status)}
                            disabled={status.isSystem}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="keyresult">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Key Result Status Settings</CardTitle>
                <CardDescription>
                  Manage the available status options for key results
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Status
                  </Button>
                </DialogTrigger>
                {/* Dialog content same as objective tab */}
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display Label</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keyResultStatuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell>{status.label}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-200" 
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center justify-center w-6 h-6 rounded-full"
                          style={{ color: status.color }}
                        >
                          {renderStatusIcon(status.icon)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={status.isDefault}
                            onCheckedChange={() => handleSetDefault(status.id)}
                            disabled={status.isDefault}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditStatus(status)}
                            disabled={status.isSystem}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Modify an existing status option
            </DialogDescription>
          </DialogHeader>
          {selectedStatus && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-label" className="text-right">
                  Display Label
                </Label>
                <Input
                  id="edit-label"
                  value={selectedStatus.label}
                  onChange={(e) => setSelectedStatus({...selectedStatus, label: e.target.value})}
                  className="col-span-3"
                  disabled={selectedStatus.isSystem}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-color" className="text-right">
                  Color
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={selectedStatus.color}
                    onChange={(e) => setSelectedStatus({...selectedStatus, color: e.target.value})}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={selectedStatus.color}
                    onChange={(e) => setSelectedStatus({...selectedStatus, color: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={selectedStatus.description}
                  onChange={(e) => setSelectedStatus({...selectedStatus, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-icon" className="text-right">
                  Icon
                </Label>
                <Select
                  value={selectedStatus.icon}
                  onValueChange={(value) => setSelectedStatus({...selectedStatus, icon: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="check-circle">Check Circle</SelectItem>
                    <SelectItem value="alert-circle">Alert Circle</SelectItem>
                    <SelectItem value="x-circle">X Circle</SelectItem>
                    <SelectItem value="clock">Clock</SelectItem>
                    <SelectItem value="flag">Flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-order" className="text-right">
                  Display Order
                </Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={selectedStatus.order}
                  onChange={(e) => setSelectedStatus({...selectedStatus, order: parseInt(e.target.value)})}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StatusSettings;