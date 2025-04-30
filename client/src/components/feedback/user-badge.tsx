import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge, User, UserBadge } from "@shared/schema";

interface UserBadgeProps {
  userBadge: UserBadge & {
    badge: Badge;
    user: User;
    awardedBy: User;
  };
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function UserBadgeDisplay({
  userBadge,
  size = "md",
  showDetails = true,
}: UserBadgeProps) {
  // Add null checks for all properties
  if (!userBadge) {
    return null; // Return early if userBadge is undefined or null
  }
  
  const { badge, user, awardedBy, message, createdAt } = userBadge;
  
  // Verify required objects exist
  if (!badge || !user || !awardedBy) {
    return null; // Return early if any required property is missing
  }
  
  // Size classes
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };
  
  // Format the award date
  const formattedDate = createdAt 
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) 
    : "recently";
  
  // Create avatar fallback from user initials with null checks
  const getUserInitials = () => {
    if (!user.firstName || !user.lastName) return 'U'; // Default fallback
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };
  
  const getAwarderInitials = () => {
    if (!awardedBy.firstName || !awardedBy.lastName) return 'A'; // Default fallback
    return `${awardedBy.firstName.charAt(0)}${awardedBy.lastName.charAt(0)}`;
  };
  
  if (!showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full`}
            style={{ backgroundColor: badge.color }}
          >
            <span className="text-white text-lg font-bold">{badge.icon}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{badge.name}</p>
          <p className="text-xs">{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{badge.name}</CardTitle>
          <BadgeComponent 
            style={{ backgroundColor: badge.color }}
            className="text-white px-3"
          >
            {badge.icon}
          </BadgeComponent>
        </div>
        <CardDescription>{badge.description}</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserInitials()}`} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground">Earned {formattedDate}</p>
          </div>
        </div>
        {message && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
            "{message}"
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <span>Awarded by:</span>
          <Avatar className="h-5 w-5">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getAwarderInitials()}`} />
            <AvatarFallback className="text-[10px]">{getAwarderInitials()}</AvatarFallback>
          </Avatar>
          <span>{awardedBy.firstName} {awardedBy.lastName}</span>
        </div>
      </CardFooter>
    </Card>
  );
}