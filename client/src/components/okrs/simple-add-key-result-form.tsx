import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimpleAddKeyResultFormProps {
  objectiveId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SimpleAddKeyResultForm({
  objectiveId,
  open,
  onOpenChange
}: SimpleAddKeyResultFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startValue, setStartValue] = useState("0");
  const [targetValue, setTargetValue] = useState("100");
  const [currentValue, setCurrentValue] = useState("0");
  const [status, setStatus] = useState("not_started");

  const createKeyResultMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending key result data:", data);
      
      const response = await fetch("/api/simple-key-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Important for session authentication
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Successful response:", result);
      return result;
    },
    onSuccess: () => {
      // Invalidate multiple query patterns to ensure immediate refresh
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId, "key-results"] });
      queryClient.invalidateQueries({ queryKey: [`/api/objectives/${objectiveId}/key-results`] });
      queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
      
      toast({
        title: "Success",
        description: "Key result created successfully!",
      });
      handleClose();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      title: title.trim(),
      description: description.trim() || null,
      objectiveId,
      startValue,
      targetValue,
      currentValue,
      status,
      tenantId: currentTenant?.id
    };

    createKeyResultMutation.mutate(formData);
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setStartValue("0");
    setTargetValue("100");
    setCurrentValue("0");
    setStatus("not_started");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Key Result</DialogTitle>
          <DialogDescription>
            Create a new key result for this objective.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Increase monthly revenue to $50,000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional details about this key result..."
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startValue">Start Value</Label>
              <Input
                id="startValue"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value</Label>
              <Input
                id="currentValue"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createKeyResultMutation.isPending}
            >
              {createKeyResultMutation.isPending ? "Creating..." : "Create Key Result"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}