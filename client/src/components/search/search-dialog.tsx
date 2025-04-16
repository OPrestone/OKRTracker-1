import { useState, useEffect } from "react";
import { useSearch } from "@/hooks/use-search";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, FileText, Target, Users, UserRound, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";
import { HelpTooltip } from "@/components/help/tooltip";
import { searchHelp } from "@/components/help/help-content";
import { useHelp } from "@/hooks/use-help-context";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const { searchTerm, setSearchTerm, results, isLoading } = useSearch();
  const [, setLocation] = useLocation();
  const { markSearchUsed } = useHelp();
  
  // Mark search as used whenever the user performs a search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      markSearchUsed();
    }
  }, [searchTerm, markSearchUsed]);
  
  const handleItemClick = (type: string, id: number) => {
    setOpen(false);
    
    switch(type) {
      case "objective":
        setLocation(`/objectives/${id}`);
        break;
      case "keyResult":
        setLocation(`/key-results/${id}`);
        break;
      case "team":
        setLocation(`/teams/${id}`);
        break;
      case "user":
        setLocation(`/users/${id}`);
        break;
    }
  };
  
  const getResultsCount = () => {
    return results.objectives.length + 
           results.keyResults.length + 
           results.teams.length + 
           results.users.length;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <HelpTooltip
          id={searchHelp.id}
          title={searchHelp.title}
          description={searchHelp.description}
          showFor={3}
        >
          <Button variant="outline" className="w-full justify-start text-muted-foreground sm:w-64 lg:w-80">
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <span className="ml-auto hidden lg:block">⌘K</span>
          </Button>
        </HelpTooltip>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Search</DialogTitle>
            <HelpTooltip
              id={searchHelp.id}
              title={searchHelp.title}
              description={searchHelp.description}
            >
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </HelpTooltip>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for objectives, key results, teams, or users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {!isLoading && searchTerm.length >= 2 && getResultsCount() === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No results found for "{searchTerm}"
            </div>
          )}
          
          {!isLoading && getResultsCount() > 0 && (
            <div className="space-y-4">
              {results.objectives.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-1" /> Objectives
                  </h3>
                  <div className="space-y-1">
                    {results.objectives.map((objective) => (
                      <Button 
                        key={objective.id} 
                        variant="ghost" 
                        className="w-full justify-start text-left" 
                        onClick={() => handleItemClick("objective", objective.id)}
                      >
                        <span className="truncate">{objective.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {results.keyResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1" /> Key Results
                  </h3>
                  <div className="space-y-1">
                    {results.keyResults.map((keyResult) => (
                      <Button 
                        key={keyResult.id} 
                        variant="ghost" 
                        className="w-full justify-start text-left" 
                        onClick={() => handleItemClick("keyResult", keyResult.id)}
                      >
                        <span className="truncate">{keyResult.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {results.teams.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-1" /> Teams
                  </h3>
                  <div className="space-y-1">
                    {results.teams.map((team) => (
                      <Button 
                        key={team.id} 
                        variant="ghost" 
                        className="w-full justify-start text-left" 
                        onClick={() => handleItemClick("team", team.id)}
                      >
                        <span className="truncate">{team.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {results.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <UserRound className="h-4 w-4 mr-1" /> Users
                  </h3>
                  <div className="space-y-1">
                    {results.users.map((user) => (
                      <Button 
                        key={user.id} 
                        variant="ghost" 
                        className="w-full justify-start text-left" 
                        onClick={() => handleItemClick("user", user.id)}
                      >
                        <span className="truncate">{user.firstName} {user.lastName} ({user.username})</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}