import { useQuery } from "@tanstack/react-query";
import { Feedback, User } from "@shared/schema";
import { FeedbackCard } from "./feedback-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, ThumbsUp, Lightbulb, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ExtendedFeedback = Feedback & {
  sender: User;
  receiver: User;
};

export function RecognitionWall() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "positive",
    "recognition",
    "constructive",
    "general",
  ]);

  // Fetch public feedback
  const { data: publicFeedback, isLoading } = useQuery<ExtendedFeedback[]>({
    queryKey: ["/api/feedback/public"],
  });

  // Filter feedback based on search term and selected types
  const filteredFeedback = publicFeedback?.filter((feedback) => {
    const matchesSearch =
      searchTerm === "" ||
      feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${feedback.sender.firstName} ${feedback.sender.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${feedback.receiver.firstName} ${feedback.receiver.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = selectedTypes.includes(feedback.type);

    return matchesSearch && matchesType;
  });

  // Group feedback by type
  const positiveRecognition = publicFeedback?.filter(
    (f) => f.type === "positive" || f.type === "recognition"
  );
  const constructiveFeedback = publicFeedback?.filter(
    (f) => f.type === "constructive"
  );
  const generalFeedback = publicFeedback?.filter(
    (f) => f.type === "general"
  );

  // Toggle a type in the filter
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="w-full">
          <CardHeader className="p-6">
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
            <Skeleton className="h-6 w-3/4 mt-2" />
            <div className="flex items-center mt-1">
              <Skeleton className="h-4 w-10 mr-1" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24 ml-1" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2 text-purple-500" />
          Recognition Wall
        </CardTitle>
        <CardDescription>Public feedback and recognition shared across the organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recognition..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Filter:</span>
              <Badge
                variant={selectedTypes.includes("positive") ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleType("positive")}
              >
                <ThumbsUp className="h-3 w-3 mr-1" /> Positive
              </Badge>
              <Badge
                variant={selectedTypes.includes("recognition") ? "secondary" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleType("recognition")}
              >
                <Award className="h-3 w-3 mr-1" /> Recognition
              </Badge>
              <Badge
                variant={selectedTypes.includes("constructive") ? "outline" : "outline"}
                className={
                  selectedTypes.includes("constructive")
                    ? "cursor-pointer bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "cursor-pointer"
                }
                onClick={() => toggleType("constructive")}
              >
                <Lightbulb className="h-3 w-3 mr-1" /> Constructive
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    More Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Feedback Types</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("general")}
                    onCheckedChange={() => toggleType("general")}
                  >
                    General
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("positive")}
                    onCheckedChange={() => toggleType("positive")}
                  >
                    Positive
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("constructive")}
                    onCheckedChange={() => toggleType("constructive")}
                  >
                    Constructive
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("recognition")}
                    onCheckedChange={() => toggleType("recognition")}
                  >
                    Recognition
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Feedback</TabsTrigger>
              <TabsTrigger value="positive">
                <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                Positive & Recognition
              </TabsTrigger>
              <TabsTrigger value="constructive">
                <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                Constructive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                renderSkeleton()
              ) : filteredFeedback && filteredFeedback.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeedback.map((feedback) => (
                    <FeedbackCard key={feedback.id} feedback={feedback} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No public feedback found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="positive" className="mt-0">
              {isLoading ? (
                renderSkeleton()
              ) : positiveRecognition && positiveRecognition.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {positiveRecognition
                    .filter((f) => selectedTypes.includes(f.type))
                    .map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No positive recognition found
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="constructive" className="mt-0">
              {isLoading ? (
                renderSkeleton()
              ) : constructiveFeedback && constructiveFeedback.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {constructiveFeedback
                    .filter((f) => selectedTypes.includes(f.type))
                    .map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No constructive feedback found
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}