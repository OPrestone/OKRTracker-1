import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FeedbackCard } from "./feedback-card";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackModal } from "./feedback-modal";

export function RecognitionWall() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  // Fetch all public feedback for the recognition wall
  const { data: publicFeedback, isLoading, refetch } = useQuery({
    queryKey: ["/api/feedback/public"],
    select: (data) => {
      // First apply type filter if not "all"
      let filtered = filter === "all" 
        ? [...data] 
        : data.filter((item) => item.type === filter);
      
      // Then apply search if present
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((item) => 
          item.title.toLowerCase().includes(searchLower) || 
          item.message.toLowerCase().includes(searchLower) ||
          `${item.sender.firstName} ${item.sender.lastName}`.toLowerCase().includes(searchLower) ||
          `${item.receiver.firstName} ${item.receiver.lastName}`.toLowerCase().includes(searchLower)
        );
      }
      
      return filtered;
    }
  });
  
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center">
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Feedback Types</SelectLabel>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="criticism">Criticism</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              className="ml-2"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <FeedbackModal />
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-lg border">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-5 w-full mt-4" />
              <Skeleton className="h-20 w-full mt-2" />
            </div>
          ))}
        </div>
      ) : publicFeedback && publicFeedback.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicFeedback.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          title="No Public Feedback Yet"
          description="Be the first to share feedback with your colleagues"
          action={<FeedbackModal trigger={<Button>Give Feedback</Button>} />}
        />
      )}
    </div>
  );
}