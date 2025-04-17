import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const checkInSchema = z.object({
  progress: z.number().min(0, "Progress must be at least 0").max(100, "Progress cannot be more than 100").optional(),
  notes: z.string().min(5, "Notes must be at least 5 characters"),
  keyResultId: z.number().optional()
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

interface KeyResult {
  id: number;
  title: string;
  progress: number;
}

interface CreateCheckInDialogProps {
  objectiveId: number;
  objectiveProgress: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCheckInDialog({
  objectiveId,
  objectiveProgress,
  open,
  onOpenChange
}: CreateCheckInDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedKeyResultProgress, setSelectedKeyResultProgress] = useState<number | null>(null);
  const [updateObjectiveProgress, setUpdateObjectiveProgress] = useState(objectiveProgress);

  const { data: keyResults = [] } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results", { objectiveId }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/objectives/${objectiveId}/key-results`);
      return response.json();
    },
    enabled: open
  });

  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      notes: "",
      progress: objectiveProgress
    }
  });

  const watchKeyResultId = form.watch("keyResultId");
  
  // Update progress when selecting a key result
  const updateProgressFromKeyResult = (keyResultId: number) => {
    const keyResult = keyResults.find(kr => kr.id === keyResultId);
    if (keyResult) {
      setSelectedKeyResultProgress(keyResult.progress);
      form.setValue("progress", keyResult.progress);
    } else {
      setSelectedKeyResultProgress(null);
      form.setValue("progress", objectiveProgress);
    }
  };

  const createCheckInMutation = useMutation({
    mutationFn: async (data: CheckInFormValues) => {
      const response = await apiRequest("POST", "/api/check-ins", {
        ...data,
        objectiveId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      if (form.getValues("keyResultId")) {
        queryClient.invalidateQueries({ queryKey: ["/api/key-results", form.getValues("keyResultId")] });
      }
      toast({
        title: "Check-in Created",
        description: "Your check-in has been successfully recorded.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create check-in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckInFormValues) => {
    createCheckInMutation.mutate(data);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "text-green-600";
    if (progress >= 50) return "text-blue-600";
    if (progress >= 25) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Check-in</DialogTitle>
          <DialogDescription>
            Record progress and updates for your objective or specific key result.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {keyResults.length > 0 && (
              <FormField
                control={form.control}
                name="keyResultId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Result (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        const id = parseInt(value);
                        field.onChange(id);
                        updateProgressFromKeyResult(id);
                      }}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a key result to update" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {keyResults.map((kr) => (
                          <SelectItem key={kr.id} value={kr.id.toString()}>
                            {kr.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="flex justify-between">
                      <span>Progress</span>
                      <span className={getProgressColor(field.value || 0)}>
                        {field.value || 0}%
                      </span>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value || 0]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(values) => {
                        field.onChange(values[0]);
                        if (!watchKeyResultId) {
                          setUpdateObjectiveProgress(values[0]);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about your progress or challenges..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
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
                disabled={createCheckInMutation.isPending}
              >
                {createCheckInMutation.isPending ? "Creating..." : "Create Check-in"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}