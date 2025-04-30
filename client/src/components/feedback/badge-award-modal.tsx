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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Badge award form schema
const badgeAwardSchema = z.object({
  userId: z.number({
    required_error: "Please select a recipient",
  }),
  badgeId: z.number({
    required_error: "Please select a badge",
  }),
  message: z.string().min(3, {
    message: "Please add a message explaining why this badge is being awarded",
  }).max(500, {
    message: "Message must not exceed 500 characters",
  }),
});

type BadgeAwardFormValues = z.infer<typeof badgeAwardSchema>;

type BadgeAwardModalProps = {
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    role?: string;
  };
  trigger?: ReactNode;
};

export function BadgeAwardModal({ recipient, trigger }: BadgeAwardModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [openUserCombobox, setOpenUserCombobox] = useState(false);
  const [openBadgeCombobox, setOpenBadgeCombobox] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: open && !recipient,
  });

  // Fetch available badges
  const { data: badges = [] } = useQuery({
    queryKey: ["/api/badges"],
    enabled: open,
  });

  // Set up form with default values
  const form = useForm<BadgeAwardFormValues>({
    resolver: zodResolver(badgeAwardSchema),
    defaultValues: {
      userId: recipient?.id || undefined,
      badgeId: undefined,
      message: "",
    },
  });

  // Get current selections
  const selectedUserId = form.watch("userId");
  const selectedBadgeId = form.watch("badgeId");

  // Find selected user and badge from their IDs
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedBadge = badges.find((b) => b.id === selectedBadgeId);

  // Set up mutation for awarding badge
  const awardBadgeMutation = useMutation({
    mutationFn: async (values: BadgeAwardFormValues) => {
      const response = await apiRequest("POST", "/api/badges/award", values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Badge Awarded",
        description: "The badge has been awarded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/badges/public"] });
      if (recipient) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", recipient.id, "badges"] });
      }
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to award badge",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: BadgeAwardFormValues) {
    awardBadgeMutation.mutate(values);
  }

  // Helper to get user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <Award className="mr-2 h-4 w-4" />
            Award Badge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Award a Badge</DialogTitle>
          <DialogDescription>
            Recognize outstanding contributions and achievements with a badge.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!recipient && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Recipient</FormLabel>
                    <Popover open={openUserCombobox} onOpenChange={setOpenUserCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openUserCombobox}
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value && selectedUser
                              ? `${selectedUser.firstName} ${selectedUser.lastName}`
                              : "Select user"}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Search users..." />
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {users.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.firstName} ${user.lastName}`}
                                  onSelect={() => {
                                    form.setValue("userId", user.id);
                                    setOpenUserCombobox(false);
                                  }}
                                >
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
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      selectedUserId === user.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
              name="badgeId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Badge</FormLabel>
                  <Popover open={openBadgeCombobox} onOpenChange={setOpenBadgeCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openBadgeCombobox}
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value && selectedBadge ? (
                            <div className="flex items-center">
                              <Badge
                                style={{ backgroundColor: selectedBadge.color }}
                                className="text-white mr-2"
                              >
                                {selectedBadge.icon}
                              </Badge>
                              {selectedBadge.name}
                            </div>
                          ) : (
                            "Select badge"
                          )}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Search badges..." />
                        <CommandEmpty>No badge found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {badges.map((badge) => (
                              <CommandItem
                                key={badge.id}
                                value={badge.name}
                                onSelect={() => {
                                  form.setValue("badgeId", badge.id);
                                  setOpenBadgeCombobox(false);
                                }}
                              >
                                <Badge
                                  style={{ backgroundColor: badge.color }}
                                  className="text-white mr-2"
                                >
                                  {badge.icon}
                                </Badge>
                                {badge.name}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedBadgeId === badge.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    {selectedBadge && selectedBadge.description}
                  </FormDescription>
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
                      placeholder="Explain why you're awarding this badge..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be displayed along with the badge award.
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
                disabled={awardBadgeMutation.isPending}
              >
                {awardBadgeMutation.isPending ? "Awarding..." : "Award Badge"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}