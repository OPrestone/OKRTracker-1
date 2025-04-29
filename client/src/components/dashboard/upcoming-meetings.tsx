import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MoreHorizontal, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRelativeMeetingDate, formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MeetingItemProps {
  userName: string;
  userRole: string;
  userAvatar?: string;
  date: string;
  time: string;
}

function MeetingItem({ userName, userRole, userAvatar, date, time }: MeetingItemProps) {
  return (
    <div className="flex items-start">
      <Avatar className="h-10 w-10">
        <AvatarImage src={userAvatar} alt={userName} />
        <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="ml-3 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-neutral-900">{userName}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{userRole}</p>
          </div>
          <Badge 
            variant={date === "Today" ? "default" : "outline"}
            className={date === "Today" 
              ? "bg-primary-100 text-primary-800 hover:bg-primary-100" 
              : "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
            }
          >
            {date}
          </Badge>
        </div>
        <div className="mt-2 flex items-center text-xs text-neutral-600">
          <Clock className="h-4 w-4 text-neutral-400 mr-1" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

export function UpcomingMeetings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/meetings/upcoming'],
  });

  // Fetch user data for each meeting participant
  const { data: userData } = useQuery({
    queryKey: ['/api/users'],
  });

  // Find user by ID
  const getUserById = (userId: number) => {
    if (!userData) return { fullName: "Loading...", role: "" };
    return userData.find((user: any) => user.id === userId) || { fullName: "Unknown", role: "" };
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-neutral-900">Upcoming 1:1 Meetings</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-2 flex items-center">
                    <Skeleton className="h-4 w-4 mr-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="text-red-500">Error loading meetings</div>
        ) : (
          <>
            {data && data.slice(0, 3).map((meeting: any) => {
              const participant = getUserById(meeting.userId2);
              const meetingDate = new Date(meeting.startTime);
              
              return (
                <MeetingItem
                  key={meeting.id}
                  userName={participant.fullName}
                  userRole={participant.role}
                  userAvatar={participant.avatarUrl}
                  date={getRelativeMeetingDate(meeting.startTime)}
                  time={`${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`}
                />
              );
            })}
          </>
        )}
      </CardContent>
      <CardFooter className="px-5 py-3 border-t border-neutral-200 flex justify-between items-center">
        <a href="/one-on-one" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          View all meetings
        </a>
        <Button size="sm" className="px-3 py-1.5 h-auto text-xs">
          Schedule meeting
        </Button>
      </CardFooter>
    </Card>
  );
}
