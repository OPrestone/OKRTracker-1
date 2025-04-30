import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PenSquare, Award, ThumbsUp, Lightbulb } from "lucide-react";

const feedbackFormSchema = z.object({
  receiverId: z.number({
    required_error: "Please select a recipient",
  }),
  type: z.enum(["positive", "constructive", "general", "recognition"], {
    required_error: "Please select a feedback type",
  }),
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
  visibility: z.enum(["public", "private"], {
    required_error: "Please select visibility",
  }),
  objectiveId: z.number().optional(),
  keyResultId: z.number().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

type FeedbackModalProps = {
  recipient: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  objectiveId?: number;
  keyResultId?: number;
  trigger?: React.ReactNode;
};

export function FeedbackModal({
  recipient,
  objectiveId,
  keyResultId,
  trigger,
}: FeedbackModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Default values for the form
  const defaultValues: Partial<FeedbackFormValues> = {
    receiverId: recipient.id,
    type: "positive",
    visibility: "private",
    objectiveId: objectiveId,
    keyResultId: keyResultId,
  };

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues,
  });

  const feedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      const response = await apiRequest("POST", "/api/feedback", {
        ...values,
        senderId: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate feedback queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/users", recipient.id, "feedback"] 
      });
      
      // Show success toast
      toast({
        title: "Feedback sent",
        description: "Your feedback has been sent successfully.",
        variant: "default",
      });
      
      // Close the modal and reset form
      setOpen(false);
      form.reset(defaultValues);
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending feedback",
        description: error.message || "There was an error sending your feedback.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FeedbackFormValues) {
    feedbackMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <PenSquare className="mr-2 h-4 w-4" />
            Give Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription>
            Provide feedback to {recipient.firstName} {recipient.lastName}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Feedback Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="positive" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
                          Positive
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="constructive" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1 text-amber-500" />
                          Constructive
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="general" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <PenSquare className="h-4 w-4 mr-1 text-blue-500" />
                          General
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="recognition" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <Award className="h-4 w-4 mr-1 text-purple-500" />
                          Recognition
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief title for your feedback" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your feedback message"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">
                        Private (Only visible to recipient)
                      </SelectItem>
                      <SelectItem value="public">
                        Public (Visible on recognition wall)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Determine who can see this feedback
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={feedbackMutation.isPending}
              >
                {feedbackMutation.isPending ? "Sending..." : "Send Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}