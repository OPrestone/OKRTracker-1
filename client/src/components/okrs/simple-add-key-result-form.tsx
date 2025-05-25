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

  const createKeyResultMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending key result data:", data);
      const response = await apiRequest("POST", "/api/simple-key-results", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId, "key-results"] });
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