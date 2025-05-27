import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, ThumbsUp, AlertTriangle, HelpCircle, Eye, EyeOff } from "lucide-react";

// Form schema
const feedbackFormSchema = z.object({
  receiverId: z.string().min(1, "Please select a recipient"),
  type: z.enum(["positive", "constructive", "recognition", "general"], {
    required_error: "Please select a feedback type",
  }),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
  visibility: z.enum(["public", "private"], {
    required_error: "Please select visibility",
  }),
  objectiveId: z.string().nullable().optional(),
  keyResultId: z.string().nullable().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

// Helper function to get user initials
function getUserInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Feedback type options
const feedbackTypes = [
  {
    value: "positive" as const,
    label: "Positive",
    description: "Recognize great work and achievements",
    icon: ThumbsUp,
    color: "text-green-600",
  },
  {
    value: "constructive" as const,
    label: "Constructive",
    description: "Offer ideas for improvement in a constructive way",
    icon: MessageSquare,
    color: "text-blue-600",
  },
  {
    value: "recognition" as const,
    label: "Recognition",
    description: "Highlight exceptional performance and contributions",
    icon: AlertTriangle,
    color: "text-orange-600",
  },
  {
    value: "general" as const,
    label: "General",
    description: "General feedback or observations",
    icon: HelpCircle,
    color: "text-purple-600",
  },
];

type FeedbackModalProps = {
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
  trigger?: React.ReactNode;
};

export function FeedbackModal({ recipient, trigger }: FeedbackModalProps = {}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for selection (only when modal is open and no specific recipient)
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: open && !recipient,
  });

  // Form setup
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      receiverId: recipient?.id || "",
      type: undefined,
      title: "",
      message: "",
      visibility: "public",
      objectiveId: null,
      keyResultId: null,
    },
  });

  // Feedback submission mutation
  const feedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormValues) => {
      console.log("Submitting feedback with data:", data);
      
      const requestBody = {
        receiverId: data.receiverId,
        type: data.type,
        title: data.title,
        content: data.message,
        message: data.message, // Schema has both content and message fields
        visibility: data.visibility,
        objectiveId: data.objectiveId,
        keyResultId: data.keyResultId,
      };
      
      console.log("Request body:", requestBody);
      
      return await apiRequest("POST", "/api/feedback", requestBody);
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted successfully!",
        description: "Your feedback has been sent to the recipient.",
      });
      
      // Reset form and close modal
      form.reset();
      setOpen(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      console.error("Feedback submission error:", error);
      toast({
        title: "Failed to submit feedback",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FeedbackFormValues) => {
    console.log("Form submitted with data:", data);
    feedbackMutation.mutate(data);
  };

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      form.reset({
        receiverId: recipient?.id || "",
        type: undefined,
        title: "",
        message: "",
        visibility: "public",
        objectiveId: null,
        keyResultId: null,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Give Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Feedback</DialogTitle>
          <DialogDescription>
            Provide constructive feedback to a colleague. This helps everyone grow and improve.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient Selection */}
            {!recipient && (
              <FormField
                control={form.control}
                name="receiverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserInitials(
                                    user.firstName,
                                    user.lastName
                                  )}`}
                                />
                                <AvatarFallback>
                                  {getUserInitials(user.firstName, user.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              {user.firstName} {user.lastName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show recipient info if pre-selected */}
            {recipient && (
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserInitials(
                      recipient.firstName,
                      recipient.lastName
                    )}`}
                  />
                  <AvatarFallback>
                    {getUserInitials(recipient.firstName, recipient.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {recipient.firstName} {recipient.lastName}
                  </p>
                  {recipient.role && (
                    <p className="text-sm text-muted-foreground">{recipient.role}</p>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {feedbackTypes.map((type) => (
                        <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={type.value} />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center cursor-pointer flex-1">
                            <type.icon className={`h-4 w-4 mr-2 ${type.color}`} />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief summary of your feedback"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short, descriptive title for your feedback
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your detailed feedback here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide specific, actionable feedback that helps the recipient grow
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility */}
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="public" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center cursor-pointer">
                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                          Public (visible to everyone)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="private" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center cursor-pointer">
                          <EyeOff className="h-4 w-4 mr-2 text-muted-foreground" />
                          Private (visible only to recipient)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    {field.value === "public"
                      ? "Will be displayed on the Recognition Wall"
                      : "Only the recipient will see this feedback"}
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
                disabled={feedbackMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={feedbackMutation.isPending}
              >
                {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}