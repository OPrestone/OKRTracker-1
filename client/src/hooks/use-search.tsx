import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type SearchResults = {
  objectives: {
    id: number;
    title: string;
    description: string;
    [key: string]: any;
  }[];
  keyResults: {
    id: number;
    title: string;
    description: string;
    [key: string]: any;
  }[];
  teams: {
    id: number;
    name: string;
    description: string;
    [key: string]: any;
  }[];
  users: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    [key: string]: any;
  }[];
};

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  
  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const { data, isLoading, error } = useQuery<SearchResults>({
    queryKey: ["/api/search", debouncedTerm],
    queryFn: async ({ queryKey }) => {
      if (!debouncedTerm || debouncedTerm.length < 2) {
        return {
          objectives: [],
          keyResults: [],
          teams: [],
          users: []
        };
      }
      
      const query = encodeURIComponent(debouncedTerm);
      const response = await fetch(`/api/search?q=${query}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }
      
      return response.json();
    },
    enabled: debouncedTerm.length >= 2,
  });
  
  return {
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    results: data || {
      objectives: [],
      keyResults: [],
      teams: [],
      users: []
    }
  };
}