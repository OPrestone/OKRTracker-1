import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Award, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedbackItem {
  id: string;
  title: string;
  content: string;
  message: string;
  type: "positive" | "constructive" | "recognition" | "general";
  visibility: "public" | "private";
  createdAt: string;
  userId: string;
  receiverId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const typeConfig = {
  positive: { 
    icon: ThumbsUp, 
    color: "bg-green-100 text-green-800", 
    label: "Positive" 
  },
  constructive: { 
    icon: MessageSquare, 
    color: "bg-blue-100 text-blue-800", 
    label: "Constructive" 
  },
  recognition: { 
    icon: Award, 
    color: "bg-yellow-100 text-yellow-800", 
    label: "Recognition" 
  },
  general: { 
    icon: HelpCircle, 
    color: "bg-gray-100 text-gray-800", 
    label: "General" 
  },
};

function getUserInitials(firstName?: string, lastName?: string): string {
  if (!firstName || !lastName) return "??";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function FeedbackDisplay() {
  const { data: feedbackList = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/feedback/public"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (feedbackList.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
          <p className="text-gray-500">Be the first to share some feedback with your team!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedbackList.map((feedback) => {
        const typeInfo = typeConfig[feedback.type];
        const TypeIcon = typeInfo.icon;
        
        return (
          <Card key={feedback.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getUserInitials(feedback.sender?.firstName, feedback.sender?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{feedback.title}</h3>
                    <p className="text-sm text-gray-500">
                      From {feedback.sender?.firstName} {feedback.sender?.lastName} to{" "}
                      {feedback.receiver?.firstName} {feedback.receiver?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={typeInfo.color}>
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {typeInfo.label}
                  </Badge>
                  {feedback.visibility === "private" && (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-700 mb-3">{feedback.content || feedback.message}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}