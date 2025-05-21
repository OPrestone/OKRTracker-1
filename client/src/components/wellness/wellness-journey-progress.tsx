import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Star, Medal, Crown, Zap, Target, TrendingUp, Heart } from "lucide-react";

// Define wellness journey levels and achievements
const journeyLevels = [
  { 
    level: 1, 
    title: "Wellness Starter", 
    minEntries: 1, 
    description: "Begin your wellness journey",
    icon: <Heart className="w-5 h-5 text-pink-500" />,
    color: "bg-gradient-to-r from-pink-500 to-rose-400"
  },
  { 
    level: 2, 
    title: "Wellness Explorer", 
    minEntries: 5, 
    description: "Consistently track your wellness",
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    color: "bg-gradient-to-r from-amber-500 to-yellow-400" 
  },
  { 
    level: 3, 
    title: "Wellness Pro", 
    minEntries: 10, 
    description: "Making wellness a habit",
    icon: <Star className="w-5 h-5 text-blue-500" />,
    color: "bg-gradient-to-r from-blue-500 to-cyan-400"
  },
  { 
    level: 4, 
    title: "Wellness Champion", 
    minEntries: 20, 
    description: "Leading in wellness practices",
    icon: <Medal className="w-5 h-5 text-emerald-500" />,
    color: "bg-gradient-to-r from-emerald-500 to-green-400"
  },
  { 
    level: 5, 
    title: "Wellness Master", 
    minEntries: 30, 
    description: "Mastering your wellness journey",
    icon: <Crown className="w-5 h-5 text-violet-500" />,
    color: "bg-gradient-to-r from-violet-500 to-purple-400"
  }
];

// Achievements that can be unlocked
const achievements = [
  { 
    id: "first-entry", 
    title: "First Check-in",
    description: "Completed your first wellness check-in",
    icon: <Heart className="w-4 h-4" />,
    requirement: (entries: any[]) => entries.length >= 1
  },
  { 
    id: "consistent-week", 
    title: "Wellness Week",
    description: "Completed check-ins for 7 consecutive days",
    icon: <TrendingUp className="w-4 h-4" />,
    requirement: (entries: any[]) => {
      // Logic to check for 7 consecutive days would go here
      // This is a simplified check for demo purposes
      return entries.length >= 7;
    }
  },
  { 
    id: "positive-streak", 
    title: "Positivity Streak", 
    description: "Maintained positive mood (4+) for 5 check-ins",
    icon: <Target className="w-4 h-4" />,
    requirement: (entries: any[]) => {
      // Count entries with mood score of 4 or higher
      const positiveEntries = entries.filter(entry => entry.moodScore >= 4);
      return positiveEntries.length >= 5;
    }
  }
];

interface WellnessJourneyProgressProps {
  className?: string;
}

const WellnessJourneyProgress: React.FC<WellnessJourneyProgressProps> = ({ className }) => {
  const { user } = useAuth();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [nextLevel, setNextLevel] = useState(journeyLevels[0]);
  const [progress, setProgress] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  
  // Fetch user's mood entries
  const { data: moodEntries = [], isLoading } = useQuery({
    queryKey: ["/api/mood-entries/user", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/mood-entries/user/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch mood entries");
      return res.json();
    },
    enabled: !!user?.id
  });
  
  // Calculate user level and progress based on entries
  useEffect(() => {
    if (!moodEntries.length) return;
    
    // Find current level based on number of entries
    const entriesCount = moodEntries.length;
    let currentLevelIndex = 0;
    
    for (let i = journeyLevels.length - 1; i >= 0; i--) {
      if (entriesCount >= journeyLevels[i].minEntries) {
        currentLevelIndex = i;
        break;
      }
    }
    
    // Set current level
    setCurrentLevel(currentLevelIndex);
    
    // Calculate next level and progress
    const nextLevelIndex = Math.min(currentLevelIndex + 1, journeyLevels.length - 1);
    setNextLevel(journeyLevels[nextLevelIndex]);
    
    // Calculate progress percentage to next level
    if (currentLevelIndex === journeyLevels.length - 1) {
      // Max level achieved
      setProgress(100);
    } else {
      const currentMin = journeyLevels[currentLevelIndex].minEntries;
      const nextMin = journeyLevels[nextLevelIndex].minEntries;
      const progressPercentage = Math.min(
        ((entriesCount - currentMin) / (nextMin - currentMin)) * 100,
        100
      );
      setProgress(progressPercentage);
    }
    
    // Check for unlocked achievements
    const newAchievements = achievements
      .filter(achievement => achievement.requirement(moodEntries))
      .map(achievement => achievement.id);
    
    setUnlockedAchievements(newAchievements);
  }, [moodEntries]);
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle>Wellness Journey</CardTitle>
          <CardDescription>Loading your wellness stats...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const currentLevelData = journeyLevels[currentLevel];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-1">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Wellness Journey
              {currentLevelData && (
                <Badge className={currentLevelData.color + " ml-2 text-white"}>
                  Level {currentLevelData.level}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Your personalized wellness progression</CardDescription>
          </div>
          
          {currentLevelData && (
            <div className="flex items-center">
              {currentLevelData.icon}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Level and Title */}
        {currentLevelData && (
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-base">{currentLevelData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentLevelData.description}</p>
            </div>
            <div>
              <span className="text-xl font-bold">{moodEntries.length}</span>
              <span className="text-muted-foreground text-sm ml-1">check-ins</span>
            </div>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span>Progress to next level</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Next level info */}
          {currentLevel < journeyLevels.length - 1 && (
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Current: {currentLevelData?.title}</span>
              <span>Next: {nextLevel.title} ({nextLevel.minEntries - moodEntries.length} more to go)</span>
            </div>
          )}
        </div>
        
        {/* Achievements */}
        <div className="pt-2">
          <h4 className="text-sm font-semibold mb-2">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              {achievements.map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);
                
                return (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isUnlocked 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground opacity-50'
                        }`}
                      >
                        {achievement.icon}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="text-xs">
                        <p className="font-semibold">{achievement.title}</p>
                        <p>{achievement.description}</p>
                        {!isUnlocked && <p className="italic mt-1">Not yet unlocked</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellnessJourneyProgress;