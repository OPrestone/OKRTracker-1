import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

const keyResultSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  startValue: z.number().min(0, "Start value must be at least 0"),
  targetValue: z.number().min(1, "Target value must be at least 1"),
  unit: z.string().min(1, "Unit is required (e.g., %, tasks, revenue)"),
  currentValue: z.number().optional()
});

type KeyResultFormValues = z.infer<typeof keyResultSchema>;

interface AddKeyResultDialogProps {
  objectiveId: number;
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
  const [progress, setProgress] = useState(0);

  const form = useForm<KeyResultFormValues>({
    resolver: zodResolver(keyResultSchema),
    defaultValues: {
      title: "",
      description: "",
      startValue: 0,
      targetValue: 100,
      unit: "%",
      currentValue: 0
    }
  });

  const addKeyResultMutation = useMutation({
    mutationFn: async (data: KeyResultFormValues) => {
      const calculatedProgress = calculateProgress(data.startValue, data.targetValue, data.currentValue || data.startValue);
      const response = await apiRequest("POST", "/api/key-results", {
        ...data,
        objectiveId,
        progress: calculatedProgress
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
      toast({
        title: "Key Result Added",
        description: "The key result has been successfully added to the objective.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add key result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateProgress = (startValue: number, targetValue: number, currentValue: number) => {
    if (targetValue === startValue) return 100;
    return Math.round(((currentValue - startValue) / (targetValue - startValue)) * 100);
  };

  const handleCurrentValueChange = (value: number) => {
    const startValue = form.getValues("startValue");
    const targetValue = form.getValues("targetValue");
    const newProgress = calculateProgress(startValue, targetValue, value);
    setProgress(newProgress);
    form.setValue("currentValue", value);
  };

  const onSubmit = (data: KeyResultFormValues) => {
    addKeyResultMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Key Result</DialogTitle>
          <DialogDescription>
            Create a new key result for your objective. Key results should be specific, measurable, and time-bound.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Increase revenue by 20%" {...field} />
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
                      placeholder="Provide more details about this key result..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(value);
                          if (form.getValues("currentValue") !== undefined) {
                            handleCurrentValueChange(form.getValues("currentValue") || value);
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
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(value);
                          if (form.getValues("currentValue") !== undefined) {
                            handleCurrentValueChange(form.getValues("currentValue") || form.getValues("startValue"));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="%, $, users, etc." {...field} />
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
                  <FormLabel>Current Value (Progress: {progress}%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(value);
                        handleCurrentValueChange(value);
                      }}
                      value={field.value === undefined ? form.getValues("startValue") : field.value}
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
                disabled={addKeyResultMutation.isPending}
              >
                {addKeyResultMutation.isPending ? "Adding..." : "Add Key Result"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}