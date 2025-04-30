import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge, User } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const badgeAwardSchema = z.object({
  userId: z.number({
    required_error: "Please select a recipient",
  }),
  badgeId: z.number({
    required_error: "Please select a badge",
  }),
  message: z.string().min(5, {
    message: "Message must be at least 5 characters.",
  }),
  isPublic: z.boolean().default(true),
});

type BadgeAwardValues = z.infer<typeof badgeAwardSchema>;

type BadgeAwardModalProps = {
  recipient?: User;
  trigger?: React.ReactNode;
};

export function BadgeAwardModal({
  recipient,
  trigger,
}: BadgeAwardModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch available badges
  const { data: badges, isLoading: loadingBadges } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  // Fetch users if no recipient is provided
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !recipient,
  });

  // Default values for the form
  const defaultValues: Partial<BadgeAwardValues> = {
    userId: recipient?.id,
    isPublic: true,
  };

  const form = useForm<BadgeAwardValues>({
    resolver: zodResolver(badgeAwardSchema),
    defaultValues,
  });

  const selectedBadgeId = form.watch("badgeId");
  const selectedBadge = badges?.find((b) => b.id === selectedBadgeId);

  const badgeAwardMutation = useMutation({
    mutationFn: async (values: BadgeAwardValues) => {
      const response = await apiRequest("POST", "/api/badges/award", {
        ...values,
        awardedById: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/badges/user"] });
      if (recipient) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/users", recipient.id, "badges"] 
        });
      }
      
      // Show success toast
      toast({
        title: "Badge awarded",
        description: "The badge has been awarded successfully.",
        variant: "default",
      });
      
      // Close the modal and reset form
      setOpen(false);
      form.reset(defaultValues);
    },
    onError: (error: Error) => {
      toast({
        title: "Error awarding badge",
        description: error.message || "There was an error awarding the badge.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: BadgeAwardValues) {
    badgeAwardMutation.mutate(data);
  }

  // Create initials for avatar fallback
  const getRecipientInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Award className="mr-2 h-4 w-4" />
            Award Badge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Award Badge</DialogTitle>
          <DialogDescription>
            {recipient
              ? `Award a badge to ${recipient.firstName} ${recipient.lastName}`
              : "Select a user and badge to award"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {!recipient && (
              <FormField
                control={form.control}
                name="userId"
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
                        {loadingUsers ? (
                          <div className="p-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full mt-2" />
                            <Skeleton className="h-5 w-full mt-2" />
                          </div>
                        ) : (
                          users?.map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id.toString()}
                              className="flex items-center"
                            >
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${getRecipientInitials(
                                      user
                                    )}`}
                                  />
                                  <AvatarFallback>
                                    {getRecipientInitials(user)}
                                  </AvatarFallback>
                                </Avatar>
                                {user.firstName} {user.lastName}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="badgeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a badge" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingBadges ? (
                        <div className="p-2">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full mt-2" />
                          <Skeleton className="h-5 w-full mt-2" />
                        </div>
                      ) : (
                        badges?.map((badge) => (
                          <SelectItem
                            key={badge.id}
                            value={badge.id.toString()}
                            className="flex items-center"
                          >
                            <div className="flex items-center">
                              <UIBadge
                                style={{ backgroundColor: badge.color }}
                                className="text-white mr-2 h-6 w-6 flex items-center justify-center p-0"
                              >
                                {badge.icon}
                              </UIBadge>
                              {badge.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedBadge && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {selectedBadge.description}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Award Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a message explaining why this badge is being awarded"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Public (Show on recognition wall)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Private (Only visible to recipient)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
                disabled={badgeAwardMutation.isPending}
              >
                {badgeAwardMutation.isPending ? "Awarding..." : "Award Badge"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}