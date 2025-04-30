import { useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Users, Info, Star, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

// Define the feedback form schema
const feedbackFormSchema = z.object({
  receiverId: z.number({
    required_error: "Please select a recipient",
  }),
  type: z.enum(["praise", "suggestion", "criticism", "question"], {
    required_error: "Please select a feedback type",
  }),
  title: z.string().min(3, {
    message: "Title must be at least 3 characters",
  }).max(100, {
    message: "Title must not exceed 100 characters",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters",
  }).max(1000, {
    message: "Message must not exceed 1000 characters",
  }),
  visibility: z.enum(["public", "private"], {
    required_error: "Please select visibility",
  }),
  objectiveId: z.number().optional().nullable(),
  keyResultId: z.number().optional().nullable(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

type FeedbackModalProps = {
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    role?: string;
  };
  trigger?: ReactNode;
};

export function FeedbackModal({ recipient, trigger }: FeedbackModalProps = {}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: open && !recipient,
  });

  // Set up form with default values
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      receiverId: recipient?.id || undefined,
      type: undefined,
      title: "",
      message: "",
      visibility: "public",
      objectiveId: null,
      keyResultId: null,
    },
  });

  // Set up mutation for submitting feedback
  const feedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      const response = await apiRequest("POST", "/api/feedback", values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/public"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FeedbackFormValues) {
    feedbackMutation.mutate(values);
  }

  // Helper to get user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Function to render the feedback type help text
  const renderFeedbackTypeHelp = (type: string) => {
    switch (type) {
      case "praise":
        return "Recognize someone's good work or achievements";
      case "suggestion":
        return "Offer ideas for improvement in a constructive way";
      case "criticism":
        return "Provide respectful criticism to help someone improve";
      case "question":
        return "Ask a question about someone's work or approach";
      default:
        return "";
    }
  };

  const feedbackTypeIcons = {
    praise: <Star className="h-4 w-4 text-yellow-500" />,
    suggestion: <MessageSquare className="h-4 w-4 text-blue-500" />,
    criticism: <Info className="h-4 w-4 text-orange-500" />,
    question: <MessageSquare className="h-4 w-4 text-purple-500" />,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            Give Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share Feedback</DialogTitle>
          <DialogDescription>
            Provide constructive feedback to a colleague. This helps everyone grow and improve.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!recipient && (
              <FormField
                control={form.control}
                name="receiverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a recipient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users
                          .filter((u) => u.id !== user?.id)
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
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

            {recipient && (
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-md">
                <Avatar>
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
                    <p className="text-sm text-muted-foreground capitalize">
                      {recipient.role}
                    </p>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="praise">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-2" />
                          Praise
                        </div>
                      </SelectItem>
                      <SelectItem value="suggestion">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 text-blue-500 mr-2" />
                          Suggestion
                        </div>
                      </SelectItem>
                      <SelectItem value="criticism">
                        <div className="flex items-center">
                          <Info className="h-4 w-4 text-orange-500 mr-2" />
                          Criticism
                        </div>
                      </SelectItem>
                      <SelectItem value="question">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 text-purple-500 mr-2" />
                          Question
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <FormDescription>
                      {renderFeedbackTypeHelp(field.value)}
                    </FormDescription>
                  )}
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
                    <Input placeholder="A brief title for your feedback" {...field} />
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
                      placeholder="Share your feedback details here..."
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
                <FormItem className="space-y-3">
                  <FormLabel>Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="public" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                          Public (visible to everyone)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="private" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
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