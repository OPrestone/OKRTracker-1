import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchResults, SearchItem } from "@/types/search";
import { useDebounce } from "@/hooks/use-debounce";
import { apiRequest } from "@/lib/queryClient";

interface LiveSearchProps {
  onSelect: (type: string, id: number) => void;
  placeholder?: string;
  minChars?: number;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

export function LiveSearch({
  onSelect,
  placeholder = "Search...",
  minChars = 2,
  debounceMs = 300,
  className = "",
  autoFocus = false,
  initialValue = ""
}: LiveSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    objectives: [],
    keyResults: [],
    teams: [],
    users: []
  });
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  
  const fetchResults = useCallback(async (term: string) => {
    if (term.length < minChars) {
      setResults({
        objectives: [],
        keyResults: [],
        teams: [],
        users: []
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error searching:", error);
      setResults({
        objectives: [],
        keyResults: [],
        teams: [],
        users: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [minChars]);

  // Effect to perform search when debounced term changes
  useEffect(() => {
    fetchResults(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchResults]);

  // Effect to handle click outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper to calculate total results count
  const getResultsCount = () => {
    return (
      results.objectives.length +
      results.keyResults.length +
      results.teams.length +
      results.users.length
    );
  };

  const handleSelect = (type: string, id: number) => {
    onSelect(type, id);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard navigation for accessibility
    if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {isFocused && searchTerm.length >= minChars && (
        <div 
          ref={resultsRef} 
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md"
        >
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          
          {!isLoading && getResultsCount() === 0 && (
            <div className="text-center py-3 text-muted-foreground text-sm">
              No results found
            </div>
          )}
          
          {!isLoading && getResultsCount() > 0 && (
            <div className="max-h-[300px] overflow-auto space-y-3">
              {/* Objectives */}
              {results.objectives.length > 0 && (
                <SearchResultSection 
                  title="Objectives" 
                  items={results.objectives}
                  onSelect={(id) => handleSelect("objective", id)}
                  icon="target"
                />
              )}
              
              {/* Key Results */}
              {results.keyResults.length > 0 && (
                <SearchResultSection 
                  title="Key Results" 
                  items={results.keyResults}
                  onSelect={(id) => handleSelect("keyResult", id)}
                  icon="fileText"
                />
              )}
              
              {/* Teams */}
              {results.teams.length > 0 && (
                <SearchResultSection 
                  title="Teams" 
                  items={results.teams.map(team => ({
                    id: team.id,
                    title: team.name
                  }))}
                  onSelect={(id) => handleSelect("team", id)}
                  icon="users"
                />
              )}
              
              {/* Users */}
              {results.users.length > 0 && (
                <SearchResultSection 
                  title="Users" 
                  items={results.users.map(user => ({
                    id: user.id,
                    title: `${user.firstName} ${user.lastName} (${user.username})`
                  }))}
                  onSelect={(id) => handleSelect("user", id)}
                  icon="user"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SearchResultSectionProps {
  title: string;
  items: SearchItem[];
  onSelect: (id: number) => void;
  icon: "target" | "fileText" | "users" | "user";
}

function SearchResultSection({ title, items, onSelect, icon }: SearchResultSectionProps) {
  const iconMap = {
    target: <Search className="h-3 w-3 mr-1" />,
    fileText: <Search className="h-3 w-3 mr-1" />,
    users: <Search className="h-3 w-3 mr-1" />,
    user: <Search className="h-3 w-3 mr-1" />
  };

  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
        {iconMap[icon]} {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            className="w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            onClick={() => onSelect(item.id)}
          >
            <span className="truncate block">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}