import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { RecognitionWall } from "@/components/feedback/recognition-wall";
import { BadgeAwardModal } from "@/components/feedback/badge-award-modal";
import { UserBadgeDisplay } from "@/components/feedback/user-badge";
import { FeedbackCard } from "@/components/feedback/feedback-card";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { 
  Award, 
  MessageSquare, 
  Users, 
  Search, 
  Check, 
  ChevronsUpDown,
  Trophy,
  Medal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function FeedbackWall() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch recent public badges
  const { data: publicBadges, isLoading: loadingBadges } = useQuery({
    queryKey: ["/api/badges/public"],
    select: (data) => data?.slice(0, 5), // Get only the 5 most recent badges
  });

  // Get the selected user
  const selectedUser = users?.find((u) => u.id === selectedUserId);

  // Initialize user badges if a user is selected
  const { data: userBadges, isLoading: loadingUserBadges } = useQuery({
    queryKey: ["/api/users", selectedUserId, "badges"],
    enabled: !!selectedUserId,
  });

  // Get user's received feedback if a user is selected
  const { data: userFeedback, isLoading: loadingUserFeedback } = useQuery({
    queryKey: ["/api/users", selectedUserId, "feedback", "received"],
    enabled: !!selectedUserId,
  });

  // Handle selecting a user for details view
  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setOpenCombobox(false);
  };

  // Get user initials for avatar
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Check if user is admin or manager (can award badges)
  const canAwardBadges = user && (user.role === "admin" || user.role === "manager");

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Recognition Wall</h1>
            <p className="text-muted-foreground">
              Celebrate achievements and provide feedback to colleagues
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {canAwardBadges && <BadgeAwardModal />}
            
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="min-w-[200px] justify-between"
                >
                  {selectedUser
                    ? `${selectedUser.firstName} ${selectedUser.lastName}`
                    : "Search User"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {users?.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.firstName} ${user.lastName}`}
                          onSelect={() => handleUserSelect(user.id)}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserInitials(user.firstName, user.lastName)}`} 
                            />
                            <AvatarFallback>
                              {getUserInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          {user.firstName} {user.lastName}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedUser?.id === user.id
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
          </div>
        </div>

        <Tabs defaultValue="recognition-wall" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recognition-wall">
              <Trophy className="mr-2 h-4 w-4" />
              Recognition Wall
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Medal className="mr-2 h-4 w-4" />
              Recent Badges
            </TabsTrigger>
            {selectedUser && (
              <TabsTrigger value="user-details">
                <Users className="mr-2 h-4 w-4" />
                User Details
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="recognition-wall" className="space-y-4">
            <RecognitionWall />
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-500" />
                  Recently Awarded Badges
                </CardTitle>
                <CardDescription>
                  Recent recognitions celebrating achievements across the organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBadges ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                    ))}
                  </div>
                ) : publicBadges && publicBadges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicBadges.map((userBadge) => (
                      <UserBadgeDisplay
                        key={userBadge.id}
                        userBadge={userBadge}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Badges Yet</h3>
                    <p className="text-muted-foreground mt-1">
                      No public badges have been awarded yet
                    </p>
                    {canAwardBadges && (
                      <Button 
                        className="mt-4"
                        onClick={() => 
                          document.querySelector('dialog[role="dialog"]')?.setAttribute('open', 'true')
                        }
                      >
                        Award the first badge
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {selectedUser && (
            <TabsContent value="user-details" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserInitials(
                          selectedUser.firstName,
                          selectedUser.lastName
                        )}`}
                      />
                      <AvatarFallback>
                        {getUserInitials(
                          selectedUser.firstName,
                          selectedUser.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </CardTitle>
                      <CardDescription>
                        {selectedUser.role.charAt(0).toUpperCase() +
                          selectedUser.role.slice(1)}
                        {selectedUser.teamId && (
                          <Badge variant="outline" className="ml-2">
                            Team ID: {selectedUser.teamId}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="badges" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="badges">
                        <Award className="h-4 w-4 mr-2" />
                        Badges
                      </TabsTrigger>
                      <TabsTrigger value="feedback">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Feedback
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="badges" className="pt-2">
                      {loadingUserBadges ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2].map((i) => (
                            <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                          ))}
                        </div>
                      ) : userBadges && userBadges.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userBadges.map((userBadge) => (
                            <UserBadgeDisplay
                              key={userBadge.id}
                              userBadge={userBadge}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium">No Badges Yet</h3>
                          <p className="text-muted-foreground mt-1">
                            {selectedUser.firstName} hasn't earned any badges yet
                          </p>
                          {canAwardBadges && (
                            <BadgeAwardModal
                              recipient={selectedUser}
                              trigger={
                                <Button className="mt-4">
                                  Award First Badge
                                </Button>
                              }
                            />
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="feedback" className="pt-2">
                      {loadingUserFeedback ? (
                        <div className="space-y-4">
                          {[1, 2].map((i) => (
                            <Card key={i} className="h-36 animate-pulse bg-muted/50" />
                          ))}
                        </div>
                      ) : userFeedback && userFeedback.length > 0 ? (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium mb-3">Public Feedback</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {userFeedback
                                .filter((f) => f.visibility === "public")
                                .map((feedback) => (
                                  <FeedbackCard
                                    key={feedback.id}
                                    feedback={feedback}
                                    variant="compact"
                                  />
                                ))}
                              {userFeedback.filter((f) => f.visibility === "public").length === 0 && (
                                <p className="text-muted-foreground col-span-2">
                                  No public feedback available
                                </p>
                              )}
                            </div>
                          </div>

                          {user && user.id === selectedUserId && (
                            <>
                              <Separator />
                              <div>
                                <h3 className="text-lg font-medium mb-3">Private Feedback</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {userFeedback
                                    .filter((f) => f.visibility === "private")
                                    .map((feedback) => (
                                      <FeedbackCard
                                        key={feedback.id}
                                        feedback={feedback}
                                        variant="compact"
                                      />
                                    ))}
                                  {userFeedback.filter((f) => f.visibility === "private").length === 0 && (
                                    <p className="text-muted-foreground col-span-2">
                                      No private feedback received
                                    </p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium">No Feedback Yet</h3>
                          <p className="text-muted-foreground mt-1">
                            {selectedUser.firstName} hasn't received any feedback yet
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}