import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown, AlertTriangle, ThumbsUp } from "lucide-react";

const MoodEntryForm = ({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const moodOptions = [
    { value: 1, icon: <Frown className="w-8 h-8" />, label: "Very Unhappy", color: "text-red-500" },
    { value: 2, icon: <AlertTriangle className="w-8 h-8" />, label: "Unhappy", color: "text-orange-500" },
    { value: 3, icon: <Meh className="w-8 h-8" />, label: "Neutral", color: "text-yellow-500" },
    { value: 4, icon: <Smile className="w-8 h-8" />, label: "Happy", color: "text-green-500" },
    { value: 5, icon: <ThumbsUp className="w-8 h-8" />, label: "Very Happy", color: "text-blue-500" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMood === null) {
      toast({
        title: "Error",
        description: "Please select a mood",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await apiRequest("POST", "/api/mood-entries", {
        moodScore: selectedMood,
        notes: notes.trim() || null,
        date: new Date().toISOString(),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your mood has been recorded",
          variant: "default",
        });
        
        // Reset form
        setSelectedMood(null);
        setNotes("");
        
        // Call success callback if provided
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit mood entry");
      }
    } catch (error) {
      console.error("Error submitting mood entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit mood entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Wellness Pulse Check-In</CardTitle>
        <CardDescription>How are you feeling today? Share your mood with your team.</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center mb-6 bg-muted/50 p-4 rounded-md">
            {moodOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setSelectedMood(option.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedMood === option.value 
                    ? "bg-primary text-primary-foreground scale-105" 
                    : "hover:bg-muted"
                }`}
              >
                <div className={selectedMood === option.value ? "text-primary-foreground" : option.color}>
                  {option.icon}
                </div>
                <span className="text-xs font-medium">{option.label}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Additional Comments (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Share more about how you're feeling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={loading || selectedMood === null} className="w-full">
            {loading ? "Submitting..." : "Submit Wellness Check-In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default MoodEntryForm;