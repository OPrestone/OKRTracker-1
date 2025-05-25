import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTenantContext } from "@/hooks/use-tenant-context";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema that matches our database structure exactly
const keyResultSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  startValue: z.string().min(1, "Start value is required"),
  targetValue: z.string().min(1, "Target value is required"),
  currentValue: z.string().optional(),
  status: z.string().default("not_started")
});

type KeyResultFormValues = z.infer<typeof keyResultSchema>;

interface AddKeyResultDialogProps {
  objectiveId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddKeyResultDialog({
  objectiveId,
  open,
  onOpenChange
}: AddKeyResultDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();

  const form = useForm<KeyResultFormValues>({
    resolver: zodResolver(keyResultSchema),
    defaultValues: {
      title: "",
      description: "",
      startValue: "0",
      targetValue: "100",
      currentValue: "0",
      status: "not_started"
    },
    mode: "onSubmit"
  });

  const addKeyResultMutation = useMutation({
    mutationFn: async (data: KeyResultFormValues) => {
      // Validate that objectiveId is available
      if (!objectiveId) {
        throw new Error("Objective ID is required to create a key result");
      }
      
      // Calculate progress percentage
      const start = parseFloat(data.startValue) || 0;
      const target = parseFloat(data.targetValue) || 100;
      const current = parseFloat(data.currentValue || data.startValue) || start;
      const progress = target === start ? 100 : Math.round(((current - start) / (target - start)) * 100);
      
      // Format data to match our database schema
      const formattedData = {
        title: data.title,
        description: data.description || null,
        objectiveId: objectiveId,
        startValue: data.startValue,
        targetValue: data.targetValue,
        currentValue: data.currentValue || data.startValue,
        progress: Math.max(0, Math.min(100, progress)),
        status: data.status,
        tenantId: currentTenant?.id
      };
      
      console.log("Creating key result with data:", formattedData);
      const response = await apiRequest("POST", "/api/key-results", formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId, "key-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
      toast({
        title: "Success",
        description: "Key result has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Error creating key result:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create key result. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: KeyResultFormValues) => {
    console.log("Form submitted with data:", data);
    addKeyResultMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Key Result</DialogTitle>
          <DialogDescription>
            Create a new key result for this objective. Key results should be specific, measurable outcomes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Increase monthly revenue to $50,000" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide additional details about this key result..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Value *</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value *</FormLabel>
                    <FormControl>
                      <Input placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addKeyResultMutation.isPending}
              >
                {addKeyResultMutation.isPending ? "Creating..." : "Create Key Result"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}