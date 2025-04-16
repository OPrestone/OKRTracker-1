import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Target, FileText, Users, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface SearchItem {
  id: number;
  title: string;
}

interface SearchResults {
  objectives: any[];
  keyResults: any[];
  teams: any[];
  users: any[];
}

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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  
  // Use existing search API with React Query
  const { data: results, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < minChars) {
        return {
          objectives: [],
          keyResults: [],
          teams: [],
          users: []
        };
      }
      
      const query = encodeURIComponent(debouncedSearchTerm);
      const response = await fetch(`/api/search?q=${query}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }
      
      return response.json();
    },
    enabled: debouncedSearchTerm.length >= minChars,
    // Only refetch when the debounced search term changes
    staleTime: 30000, // 30 seconds
    // Clear results when input changes
    placeholderData: {
      objectives: [],
      keyResults: [],
      teams: [],
      users: []
    }
  });

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
    if (!results) return 0;
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
              No results found for "{searchTerm}"
            </div>
          )}
          
          {!isLoading && getResultsCount() > 0 && (
            <div className="max-h-[300px] overflow-auto space-y-3">
              {/* Objectives */}
              {results && results.objectives.length > 0 && (
                <SearchResultSection 
                  title="Objectives" 
                  items={results.objectives.map(obj => ({
                    id: obj.id,
                    title: obj.title
                  }))}
                  onSelect={(id) => handleSelect("objective", id)}
                  icon="target"
                />
              )}
              
              {/* Key Results */}
              {results && results.keyResults.length > 0 && (
                <SearchResultSection 
                  title="Key Results" 
                  items={results.keyResults.map(kr => ({
                    id: kr.id,
                    title: kr.title
                  }))}
                  onSelect={(id) => handleSelect("keyResult", id)}
                  icon="fileText"
                />
              )}
              
              {/* Teams */}
              {results && results.teams.length > 0 && (
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
              {results && results.users.length > 0 && (
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
    target: <Target className="h-3 w-3 mr-1" />,
    fileText: <FileText className="h-3 w-3 mr-1" />,
    users: <Users className="h-3 w-3 mr-1" />,
    user: <UserRound className="h-3 w-3 mr-1" />
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