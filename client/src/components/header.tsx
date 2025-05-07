// Header.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  HelpCircle,
  Menu,
  ChevronRight,
  Moon,
  Sun,
  Laptop,
  Rocket,
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  MessageSquare,
  Inbox,
  Home,
  Target,
  BarChart,
  Users,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { HelpTooltip } from "@/components/help/tooltip";
import { dashboardHelp } from "@/components/help/help-content";
import { QuickStartGuide } from "@/components/quick-start-guide";

type SearchableItemType =
  | "objective"
  | "keyResult"
  | "user"
  | "team"
  | "meeting"
  | "resource";

interface SearchResultItem {
  id: number;
  title: string;
  description?: string;
  type: SearchableItemType;
  url: string;
  data?: any;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({
  title,
  subtitle,
  sidebarOpen,
  setSidebarOpen,
}: HeaderProps) => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const shouldFetch = searchValue.length >= 3;

  const { data: objectives = [] } = useQuery<any[]>({
    queryKey: ["/api/objectives"],
    enabled: shouldFetch,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: shouldFetch,
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    enabled: shouldFetch,
  });

  const { data: resources = [] } = useQuery<any[]>({
    queryKey: ["/api/resources"],
    enabled: shouldFetch,
  });

  const searchInCollection = <T extends { id: number }>(
    collection: T[],
    term: string,
    options: {
      fields: (keyof T)[];
      type: SearchableItemType;
      getUrl: (item: T) => string;
      getTitle: (item: T) => string;
      getDescription?: (item: T) => string;
    }
  ): SearchResultItem[] => {
    if (!term || !collection?.length) return [];
    const normalizedTerm = term.toLowerCase().trim();
    return collection
      .filter((item) =>
        options.fields.some((field) => {
          const value = item[field];
          return (
            typeof value === "string" &&
            value.toLowerCase().includes(normalizedTerm)
          );
        })
      )
      .map((item) => ({
        id: item.id,
        title: options.getTitle(item),
        description: options.getDescription
          ? options.getDescription(item)
          : undefined,
        type: options.type,
        url: options.getUrl(item),
        data: item,
      }));
  };

  const performSearch = () => {
    if (searchValue.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const results = [
      ...searchInCollection(users, searchValue, {
        fields: ["fullName", "username", "email", "role"],
        type: "user",
        getUrl: (item) => `/users/${item.id}`,
        getTitle: (item) => item.fullName,
        getDescription: (item) => item.role,
      }),
      ...searchInCollection(teams, searchValue, {
        fields: ["name", "description"],
        type: "team",
        getUrl: (item) => `/teams/${item.id}`,
        getTitle: (item) => item.name,
        getDescription: (item) =>
          item.description || "No description available",
      }),
      ...searchInCollection(objectives, searchValue, {
        fields: ["title", "description"],
        type: "objective",
        getUrl: (item) => `/objectives/${item.id}`,
        getTitle: (item) => item.title,
        getDescription: (item) =>
          item.description || "No description available",
      }),
      ...searchInCollection(resources, searchValue, {
        fields: ["title", "description"],
        type: "resource",
        getUrl: (item) => `/resources/${item.id}`,
        getTitle: (item) => item.title,
        getDescription: (item) =>
          item.description || "No description available",
      }),
    ];
    setSearchResults(results);
    setIsSearching(false);
    setShowResults(results.length > 0);
  };

  useEffect(() => {
    if (searchValue.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => performSearch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIconForType = (type: SearchableItemType) => {
    switch (type) {
      case "objective":
        return <Target className="h-4 w-4 text-blue-500" />;
      case "keyResult":
        return <BarChart className="h-4 w-4 text-green-500" />;
      case "user":
        return <User className="h-4 w-4 text-violet-500" />;
      case "team":
        return <Users className="h-4 w-4 text-amber-500" />;
      case "meeting":
        return <Calendar className="h-4 w-4 text-red-500" />;
      case "resource":
        return <FileText className="h-4 w-4 text-neutral-500" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim().length >= 3) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setSearchResults([]);
    setShowResults(false);
  };

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.username?.[0] || "?";

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSubmitSearch}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-40 md:w-64 h-9 pl-9 pr-8 rounded-md text-sm"
                  onFocus={() => {
                    if (searchValue.length >= 3) setShowResults(true);
                  }}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                {isSearching ? (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-neutral-400" />
                ) : searchValue ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1.5"
                    onClick={clearSearch}
                  >
                    ✕
                  </Button>
                ) : null}
              </div>
            </form>

            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-md border border-slate-200">
                {searchResults.map((result, index) => (
                  <Link
                    href={result.url}
                    key={index}
                    className="flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {getIconForType(result.type)}
                    <span className="ml-2 font-medium">{result.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full"
          >
            <Inbox className="h-4.5 w-4.5" />
          </Button>
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 ml-1"
              >
                <Avatar className="h-8 w-8 border border-slate-200">
                  <AvatarImage
                    src="/assets/avatar.png"
                    alt={user?.firstName || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuLabel>
                {user?.fullName || user?.username}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/inbox">
                  <Inbox className="mr-2 h-4 w-4" /> Inbox
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/messages">
                  <MessageSquare className="mr-2 h-4 w-4" /> Messages
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Quick Start Guide */}
          <div className="ml-2">
            <QuickStartGuide />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
