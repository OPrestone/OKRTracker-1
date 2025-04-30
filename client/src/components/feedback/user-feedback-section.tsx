import { useQuery } from "@tanstack/react-query";
import { Feedback, User, UserBadge, Badge } from "@shared/schema";
import { FeedbackCard } from "./feedback-card";
import { UserBadgeDisplay } from "./user-badge";
import { FeedbackModal } from "./feedback-modal";
import { BadgeAwardModal } from "./badge-award-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, MessageSquare, ThumbsUp, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

interface UserFeedbackSectionProps {
  userId: number;
  user: User;
}

type ExtendedFeedback = Feedback & {
  sender: User;
  receiver: User;
};

type ExtendedUserBadge = UserBadge & {
  badge: Badge;
  user: User;
  awardedBy: User;
};

export function UserFeedbackSection({ userId, user }: UserFeedbackSectionProps) {
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === userId;
  
  // Fetch feedback given to the user
  const { data: receivedFeedback, isLoading: loadingFeedback } = useQuery<ExtendedFeedback[]>({
    queryKey: ["/api/users", userId, "feedback", "received"],
  });
  
  // Fetch feedback given by the user
  const { data: givenFeedback, isLoading: loadingGivenFeedback } = useQuery<ExtendedFeedback[]>({
    queryKey: ["/api/users", userId, "feedback", "given"],
    enabled: isCurrentUser, // Only load if viewing own profile
  });
  
  // Fetch badges earned by the user
  const { data: userBadges, isLoading: loadingBadges } = useQuery<ExtendedUserBadge[]>({
    queryKey: ["/api/users", userId, "badges"],
  });
  
  // Group received feedback by type
  const positiveFeedback = receivedFeedback?.filter(
    (f) => f.type === "positive" || f.type === "recognition"
  );
  const constructiveFeedback = receivedFeedback?.filter(
    (f) => f.type === "constructive"
  );
  
  // Check if user has permissions to give feedback or award badges
  const canGiveFeedback = currentUser && currentUser.id !== userId;
  const canAwardBadges = currentUser && 
    (currentUser.role === "admin" || currentUser.role === "manager");
  
  const renderFeedbackSkeleton = () => (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-5 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  const renderBadgeSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex flex-col items-center space-y-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
  
  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Feedback & Recognition</CardTitle>
          <div className="flex space-x-2">
            {canGiveFeedback && (
              <FeedbackModal recipient={user} />
            )}
            {canAwardBadges && (
              <BadgeAwardModal recipient={user} />
            )}
          </div>
        </div>
        <CardDescription>Feedback received and badges earned</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="feedback">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="h-4 w-4 mr-2" />
              Badges
            </TabsTrigger>
            {isCurrentUser && (
              <TabsTrigger value="given">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Feedback Given
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="feedback" className="space-y-4">
            {loadingFeedback ? (
              renderFeedbackSkeleton()
            ) : receivedFeedback && receivedFeedback.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center text-lg font-medium mb-3">
                    <ThumbsUp className="h-5 w-5 mr-2 text-green-500" />
                    Positive & Recognition
                  </h3>
                  {positiveFeedback && positiveFeedback.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {positiveFeedback.map((feedback) => (
                        <FeedbackCard 
                          key={feedback.id} 
                          feedback={feedback} 
                          variant="compact"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm italic">
                      No positive feedback yet
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="flex items-center text-lg font-medium mb-3">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                    Constructive Feedback
                  </h3>
                  {constructiveFeedback && constructiveFeedback.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {constructiveFeedback.map((feedback) => (
                        <FeedbackCard 
                          key={feedback.id} 
                          feedback={feedback} 
                          variant="compact"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm italic">
                      No constructive feedback yet
                    </div>
                  )}
                </div>
                
                {receivedFeedback.length === 0 && (
                  <div className="py-12 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Feedback Yet</h3>
                    <p className="text-muted-foreground mt-1">
                      {isCurrentUser
                        ? "You haven't received any feedback yet"
                        : `${user.firstName} hasn't received any feedback yet`}
                    </p>
                    {canGiveFeedback && (
                      <Button className="mt-4" onClick={() => {}}>
                        Be the first to give feedback
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Feedback Yet</h3>
                <p className="text-muted-foreground mt-1">
                  {isCurrentUser
                    ? "You haven't received any feedback yet"
                    : `${user.firstName} hasn't received any feedback yet`}
                </p>
                {canGiveFeedback && (
                  <Button className="mt-4" onClick={() => {}}>
                    Be the first to give feedback
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="badges">
            {loadingBadges ? (
              renderBadgeSkeleton()
            ) : userBadges && userBadges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {userBadges.map((userBadge) => (
                  <UserBadgeDisplay 
                    key={userBadge.id} 
                    userBadge={userBadge}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Badges Yet</h3>
                <p className="text-muted-foreground mt-1">
                  {isCurrentUser
                    ? "You haven't earned any badges yet"
                    : `${user.firstName} hasn't earned any badges yet`}
                </p>
                {canAwardBadges && (
                  <Button className="mt-4" onClick={() => {}}>
                    Award first badge
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          {isCurrentUser && (
            <TabsContent value="given">
              {loadingGivenFeedback ? (
                renderFeedbackSkeleton()
              ) : givenFeedback && givenFeedback.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {givenFeedback.map((feedback) => (
                    <FeedbackCard 
                      key={feedback.id} 
                      feedback={feedback} 
                      variant="compact"
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Feedback Given Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    You haven't given any feedback to your colleagues yet
                  </p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}