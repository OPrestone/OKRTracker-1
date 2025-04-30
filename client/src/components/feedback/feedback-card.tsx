import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Feedback, User } from "@shared/schema";
import { ThumbsUp, PenSquare, Lightbulb, Award } from "lucide-react";

interface FeedbackCardProps {
  feedback: Feedback & {
    sender: User;
    receiver: User;
  };
  variant?: "compact" | "expanded";
}

// Get the icon based on feedback type
const getFeedbackTypeIcon = (type: string) => {
  switch (type) {
    case "positive":
      return <ThumbsUp className="h-4 w-4 text-green-500" />;
    case "constructive":
      return <Lightbulb className="h-4 w-4 text-amber-500" />;
    case "recognition":
      return <Award className="h-4 w-4 text-purple-500" />;
    case "general":
    default:
      return <PenSquare className="h-4 w-4 text-blue-500" />;
  }
};

// Get the badge color based on feedback type
const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (type) {
    case "positive":
      return "default";
    case "constructive":
      return "outline";
    case "recognition":
      return "secondary";
    case "general":
    default:
      return "default";
  }
};

export function FeedbackCard({ feedback, variant = "expanded" }: FeedbackCardProps) {
  const { sender, receiver, type, title, message, createdAt } = feedback;
  const isCompact = variant === "compact";
  
  // Format the creation date
  const formattedDate = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Create avatar fallback from user initials
  const getSenderInitials = () => {
    return `${sender.firstName.charAt(0)}${sender.lastName.charAt(0)}`;
  };
  
  const getReceiverInitials = () => {
    return `${receiver.firstName.charAt(0)}${receiver.lastName.charAt(0)}`;
  };
  
  return (
    <Card className={isCompact ? "max-w-md" : "w-full"}>
      <CardHeader className={isCompact ? "p-4" : "p-6"}>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getSenderInitials()}`} />
              <AvatarFallback>{getSenderInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">
                {sender.firstName} {sender.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formattedDate}
              </p>
            </div>
          </div>
          <Badge variant={getTypeBadgeVariant(type)} className="flex items-center space-x-1">
            {getFeedbackTypeIcon(type)}
            <span className="ml-1 capitalize">{type}</span>
          </Badge>
        </div>
        <CardTitle className={isCompact ? "text-base mt-2" : "text-xl mt-2"}>
          {title}
        </CardTitle>
        {!isCompact && (
          <CardDescription className="flex items-center mt-1">
            <span>To: </span>
            <Avatar className="h-6 w-6 ml-1 mr-1">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getReceiverInitials()}`} />
              <AvatarFallback>{getReceiverInitials()}</AvatarFallback>
            </Avatar>
            <span>{receiver.firstName} {receiver.lastName}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={isCompact ? "p-4 pt-0" : "p-6 pt-0"}>
        <p className={isCompact ? "text-sm line-clamp-3" : "text-base"}>
          {message}
        </p>
      </CardContent>
      {!isCompact && feedback.objectiveId && (
        <CardFooter className="p-6 pt-0 text-sm text-muted-foreground">
          Related to: Objective #{feedback.objectiveId}
          {feedback.keyResultId && ` / Key Result #${feedback.keyResultId}`}
        </CardFooter>
      )}
    </Card>
  );
}