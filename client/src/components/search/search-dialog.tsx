import { useState, useEffect, FormEvent } from "react";
import { useSearch } from "@/hooks/use-search";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Target, FileText, Users, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { HelpTooltip } from "@/components/help/tooltip";
import { searchHelp } from "@/components/help/help-content";
import { useHelp } from "@/hooks/use-help-context";
import { LiveSearch } from "./live-search";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const { searchTerm, setSearchTerm, results, isLoading } = useSearch();
  const [, setLocation] = useLocation();
  const { markSearchUsed } = useHelp();
  const { toast } = useToast();
  
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
  
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim().length < 2) {
      toast({
        title: "Search term too short",
        description: "Please enter at least 2 characters to search",
        variant: "destructive"
      });
      return;
    }
    
    // If there's only one result, go directly to it
    if (getResultsCount() === 1) {
      if (results.objectives.length === 1) {
        handleItemClick("objective", results.objectives[0].id);
      } else if (results.keyResults.length === 1) {
        handleItemClick("keyResult", results.keyResults[0].id);
      } else if (results.teams.length === 1) {
        handleItemClick("team", results.teams[0].id);
      } else if (results.users.length === 1) {
        handleItemClick("user", results.users[0].id);
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <form className="w-full sm:w-64 lg:w-80" onSubmit={(e) => { e.preventDefault(); setOpen(true); }}>
          <HelpTooltip
            id={searchHelp.id}
            title={searchHelp.title}
            description={searchHelp.description}
            showFor={3}
          >
            <Button 
              type="submit" 
              variant="outline" 
              className="w-full justify-start text-muted-foreground"
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search...</span>
              <span className="ml-auto hidden lg:block">⌘K</span>
            </Button>
          </HelpTooltip>
        </form>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Search</DialogTitle>
            <HelpTooltip
              id={searchHelp.id}
              title={searchHelp.title}
              description={searchHelp.description}
              persistent={true}
              feature="search"
            >
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </HelpTooltip>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Search for objectives, key results, teams, and users across the platform.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearchSubmit} className="space-y-4 py-4">
          <LiveSearch
            placeholder="Search for objectives, key results, teams, or users..."
            onSelect={handleItemClick}
            initialValue={searchTerm}
            autoFocus={true}
            minChars={2}
            className="w-full"
          />
          
          {/* If LiveSearch component doesn't work, fallback to original search UI */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-muted-foreground">
                <div className="animate-pulse">Searching...</div>
              </div>
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
                        type="button"
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
                        type="button"
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
                        type="button"
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
                        type="button"
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
        </form>
      </DialogContent>
    </Dialog>
  );
}