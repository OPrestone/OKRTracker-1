import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useTenantContext } from "@/hooks/use-tenant-context";

const objectiveSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  timeframeId: z.string().min(1, "Timeframe is required"),
  teamId: z.string(),
  status: z.string().default("draft")
});

type ObjectiveFormValues = z.infer<typeof objectiveSchema>;

interface CreateObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export function CreateObjectiveModal({ isOpen, onClose, teamId }: CreateObjectiveModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  const tenantId = currentTenant?.id;

  // Query for timeframes
  const { data: timeframes = [] } = useQuery({
    queryKey: ["/api/timeframes", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/timeframes?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch timeframes");
      return res.json();
    },
    enabled: !!tenantId && isOpen
  });

  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      title: "",
      description: "",
      timeframeId: "",
      teamId: teamId,
      status: "draft"
    }
  });

  // Create objective mutation
  const createObjectiveMutation = useMutation({
    mutationFn: async (data: ObjectiveFormValues) => {
      return apiRequest("POST", `/api/objectives`, {
        ...data,
        tenantId
      });
    },
    onSuccess: () => {
      toast({
        title: "Objective Created",
        description: "The objective has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "performance"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create objective: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ObjectiveFormValues) => {
    createObjectiveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Objective</DialogTitle>
          <DialogDescription>
            Add a new objective for this team. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter objective title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for your objective
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
                      placeholder="Describe the objective in detail"
                      className="min-h-[100px]" 
                      {...field}
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional context and details
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="timeframeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeframe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timeframe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeframes.map((timeframe: any) => (
                        <SelectItem key={timeframe.id} value={timeframe.id}>
                          {timeframe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The timeframe this objective belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current status of the objective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createObjectiveMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createObjectiveMutation.isPending}
              >
                {createObjectiveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : "Create Objective"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}