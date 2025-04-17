import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
import { Button } from "@/components/ui/button";

interface ArchiveObjectiveDialogProps {
  objectiveId: number;
  objectiveTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ArchiveObjectiveDialog({
  objectiveId,
  objectiveTitle,
  open,
  onOpenChange
}: ArchiveObjectiveDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const archiveObjectiveMutation = useMutation({
    mutationFn: async () => {
      // Instead of deleting, we update the status to "archived"
      const response = await apiRequest("PATCH", `/api/objectives/${objectiveId}`, {
        status: "archived"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Objective Archived",
        description: "The objective has been successfully archived.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to archive objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to archive this objective?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to archive "<strong>{objectiveTitle}</strong>". This will hide the objective from active views,
            but the data will be preserved for historical reporting. This action can be reversed by a system administrator.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              archiveObjectiveMutation.mutate();
            }}
            className="bg-red-600 hover:bg-red-700"
            disabled={archiveObjectiveMutation.isPending}
          >
            {archiveObjectiveMutation.isPending ? "Archiving..." : "Archive Objective"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}