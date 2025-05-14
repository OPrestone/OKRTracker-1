import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building, LayoutGrid, PaintBucket, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HexColorPicker } from "react-colorful";
import { Team } from "@shared/schema";

// Define the form schema
const teamFormSchema = z.object({
  name: z.string().min(1, "Team name is required").max(50, "Team name is too long"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTeams?: Team[];
}

export function CreateTeamModal({ isOpen, onClose, parentTeams = [] }: CreateTeamModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  const tenantId = currentTenant?.id;
  
  // Define default colors
  const defaultColors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#F97316", // Orange
  ];
  
  // Define default icons
  const defaultIcons = [
    { name: "building", icon: <Building size={24} /> },
    { name: "grid", icon: <LayoutGrid size={24} /> },
    { name: "palette", icon: <PaintBucket size={24} /> },
  ];
  
  // Form definition
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: defaultColors[0],
      icon: "building",
      parentId: undefined,
    },
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      // Add tenant ID to request context via the URL
      const response = await apiRequest("POST", `/api/teams?tenantId=${tenantId}`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate teams query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      
      // Show success message
      toast({
        title: "Team created",
        description: "The team has been created successfully.",
      });
      
      // Close the modal
      onClose();
      
      // Reset form
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: TeamFormValues) => {
    createTeamMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to organize your company's structure and manage team objectives.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter team name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the team as it will appear in the organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter team description" 
                      className="min-h-[80px]"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of the team's purpose and responsibilities.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Team (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No parent team</SelectItem>
                        {parentTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a parent team if this is a sub-team.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Tabs defaultValue="color">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="color">Color</TabsTrigger>
                <TabsTrigger value="icon">Icon</TabsTrigger>
              </TabsList>
              <TabsContent value="color" className="space-y-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Color</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {defaultColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-full transition-all ${
                                  field.value === color
                                    ? "ring-2 ring-offset-2 ring-primary"
                                    : ""
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => field.onChange(color)}
                              />
                            ))}
                          </div>
                          <HexColorPicker color={field.value} onChange={field.onChange} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="icon" className="space-y-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Icon</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          {defaultIcons.map((iconObj) => (
                            <button
                              key={iconObj.name}
                              type="button"
                              className={`flex items-center justify-center p-3 border rounded-md transition-all ${
                                field.value === iconObj.name
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => field.onChange(iconObj.name)}
                            >
                              {iconObj.icon}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Select an icon to represent the team.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createTeamMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}