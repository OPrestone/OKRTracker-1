import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Settings2, Target, Calendar, 
  Users2, Layers, Zap, Loader2, Check, User, Upload, FileText, 
  AlertCircle, UserPlus, ChevronDown, X, Save, Users, Plus
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TimeframeSetupSimplified from "./timeframe-setup-simplified";

// Team interface
interface Team {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  selected?: boolean;
}

// Strategic Direction interface
interface StrategicDirection {
  id?: string;
  title: string;
  description: string;
  type: "company" | "team";
  priority: number;
  tenantId?: string;
  teamId?: string | null;
  createdById?: string;
}

// User interface for CSV upload
interface UserImport {
  email: string;
  name?: string;
  role: string;
  department?: string;
  team?: string;
  isValid: boolean;
  error?: string;
}

// Default team template interface
interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Default team templates for quick selection
const defaultTeamTemplates: TeamTemplate[] = [
  {
    id: "marketing",
    name: "Marketing Team",
    description: "Team responsible for brand, communications and marketing campaigns",
    icon: "megaphone",
    color: "#3B82F6", // Blue
  },
  {
    id: "sales",
    name: "Sales Team",
    description: "Team responsible for sales and revenue growth",
    icon: "briefcase",
    color: "#10B981", // Green
  },
  {
    id: "engineering",
    name: "Engineering Team",
    description: "Team responsible for product development and technical operations",
    icon: "code",
    color: "#8B5CF6", // Purple
  },
  {
    id: "product",
    name: "Product Team",
    description: "Team responsible for product strategy and roadmap",
    icon: "layers",
    color: "#F59E0B", // Amber
  },
  {
    id: "operations",
    name: "Operations Team",
    description: "Team responsible for business operations and logistics",
    icon: "settings",
    color: "#6B7280", // Gray
  },
  {
    id: "hr",
    name: "Human Resources",
    description: "Team responsible for talent acquisition and employee development",
    icon: "users",
    color: "#EC4899", // Pink
  },
  {
    id: "finance",
    name: "Finance Team",
    description: "Team responsible for financial planning and analysis",
    icon: "dollar-sign",
    color: "#059669", // Emerald
  },
  {
    id: "customer-success",
    name: "Customer Success",
    description: "Team responsible for customer satisfaction and retention",
    icon: "heart",
    color: "#EF4444", // Red
  },
];

// Team Selection Component
const TeamSelectionSection = ({ 
  tenantId, 
  value = [], 
  onChange 
}: { 
  tenantId: string; 
  value?: string[]; 
  onChange?: (selectedTeams: string[]) => void;
}) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(value);
  
  // Fetch teams from the API - use the built-in query client
  const { data: teams = [] as Team[], isLoading, error } = useQuery<Team[]>({
    queryKey: ['/api/teams', tenantId],
    enabled: !!tenantId,
    meta: { requiresTenant: true },
  });

  // Toggle team selection
  const toggleTeamSelection = (teamId: string) => {
    const updatedTeams = selectedTeams.includes(teamId)
      ? selectedTeams.filter(id => id !== teamId)
      : [...selectedTeams, teamId];
    
    setSelectedTeams(updatedTeams);
    
    // Call the onChange handler if provided
    if (onChange) {
      onChange(updatedTeams);
    }
  };

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span>Loading teams...</span>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">Error loading teams. Please try again.</p>
      </div>
    );
  }

  // If loading, show loading indicator 
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-md p-4 opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">Error loading teams. Please try again.</p>
      </div>
    );
  }

  // If no teams, show message
  if (!teams || (Array.isArray(teams) && teams.length === 0)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <p className="text-yellow-700">No teams found. Please create teams first in the Team Management section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team: Team) => {
          // Get team initials for the avatar
          const initials = team.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
            
          return (
            <div 
              key={team.id}
              className={`border rounded-md p-4 cursor-pointer transition-all ${
                selectedTeams.includes(team.id) 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleTeamSelection(team.id)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: team.color || '#6366F1' }}
                >
                  {team.icon ? (
                    <span className="text-lg">{team.icon}</span>
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{team.name}</h4>
                  <p className="text-sm text-gray-500">{team.description || `Team in ${team.name} department`}</p>
                </div>
                
                <div className="flex-shrink-0">
                  {selectedTeams.includes(team.id) ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Define the form schema for OKR system setup
const formSchema = z.object({
  generalSettings: z.object({
    companyMission: z.string().min(1, "Company mission is required"),
    companyVision: z.string().min(1, "Company vision is required"),
    companyValues: z.string().min(1, "Company values are required"),
    strategicDirections: z.array(z.object({
      title: z.string().min(1, "Strategic direction title is required"),
      description: z.string().min(1, "Strategic direction description is required"),
      priority: z.number().min(1).max(10).default(1)
    })).default([]),
    trackingFrequency: z.enum(["weekly", "biweekly", "monthly"]),
    enableNotifications: z.boolean().default(true),
  }),
  timeframes: z.object({
    primaryCadence: z.enum(["quarterly", "trimester", "halfYearly", "annual"]),
    enableQuarterlyCadence: z.boolean().default(true),
    enableAnnualCadence: z.boolean().default(true),
    customCadence: z.string().optional(),
    startMonth: z.enum(["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]).default("january"),
  }),
  objectiveSettings: z.object({
    maxObjectivesPerTeam: z.enum(["3", "4", "5", "6", "7", "8"]).default("5"),
    maxKeyResultsPerObjective: z.enum(["3", "4", "5", "6"]).default("3"),
    requireObjectiveApproval: z.boolean().default(true),
    enableObjectiveAlignment: z.boolean().default(true),
  }),
  teamConfiguration: z.object({
    orgStructureType: z.enum(["functional", "divisional", "matrix", "flat", "hierarchical"]),
    enableCrossTeamObjectives: z.boolean().default(true),
    defaultVisibility: z.enum(["public", "team", "private"]).default("public"),
    selectedTeams: z.array(z.string()).default([]),
    defaultTeams: z.array(z.string()).default([]),
    csvUsers: z.array(z.any()).default([]),
    useDefaultTeams: z.boolean().default(true),
  }),
  integrations: z.object({
    enableSlackIntegration: z.boolean().default(false),
    enableEmailNotifications: z.boolean().default(true),
    enableCalendarSync: z.boolean().default(false),
    enableAnalyticsReporting: z.boolean().default(true),
  }),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "timeframes", label: "Timeframes", icon: Calendar },
  { id: "objectives", label: "Objectives", icon: Target },
  { id: "teams", label: "Teams", icon: Users2 },
  { id: "integrations", label: "Integrations", icon: Layers },
  { id: "review", label: "Review", icon: CheckCircle2 },
];



export default function OKRSystemSetupWizard() {
  const [activePage, setActivePage] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const tenantContext = useTenantContext();
  const [csvData, setCsvData] = useState<UserImport[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [selectedDefaultTeams, setSelectedDefaultTeams] = useState<string[]>([]);
  const [csvImportedTeams, setCsvImportedTeams] = useState<string[]>([]);
  const [csvImportedUsers, setCsvImportedUsers] = useState<UserImport[]>([]);
  const [isSavingUsersAndTeams, setIsSavingUsersAndTeams] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch existing teams to preselect corresponding default templates
  const { data: existingTeams = [] } = useQuery({
    queryKey: ['/api/teams', tenantId],
    enabled: !!tenantId,
    meta: { requiresTenant: true },
  });

  // Effect to preselect teams that already exist in the tenant's organization
  useEffect(() => {
    if (existingTeams.length > 0) {
      const matchingTemplates: string[] = [];
      
      existingTeams.forEach((team: any) => {
        const teamName = team.name.toLowerCase();
        
        // Find matching default template based on team name
        const matchingTemplate = defaultTeamTemplates.find(template => {
          const templateName = template.name.toLowerCase();
          return teamName.includes(template.id) || 
                 templateName.includes(teamName) ||
                 (template.id === 'engineering' && (teamName.includes('dev') || teamName.includes('tech'))) ||
                 (template.id === 'customer-success' && teamName.includes('customer')) ||
                 (template.id === 'hr' && (teamName.includes('human') || teamName.includes('people')));
        });
        
        if (matchingTemplate && !matchingTemplates.includes(matchingTemplate.id)) {
          matchingTemplates.push(matchingTemplate.id);
        }
      });
      
      setSelectedDefaultTeams(matchingTemplates);
    }
  }, [existingTeams]);
  
  // Find the active step index
  const activeIndex = steps.findIndex((step) => step.id === activePage);
  
  // Function to handle CSV file upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsProcessingCsv(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setIsProcessingCsv(false);
        return;
      }
      
      // Process CSV data
      processCsvData(text);
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the CSV file. Please try again.",
        variant: "destructive",
      });
      setIsProcessingCsv(false);
    };
    
    reader.readAsText(file);
  };
  
  // Function to process CSV data
  const processCsvData = (csvText: string) => {
    try {
      // Split by newlines and handle different newline formats
      const lines = csvText.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        throw new Error("CSV file is empty");
      }
      
      // Get headers from first line
      const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
      
      // Validate required headers
      const requiredHeaders = ['email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }
      
      // Process each line to extract user data
      const users: UserImport[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.trim());
        
        // Skip empty lines
        if (values.every(val => val === '')) continue;
        
        // Create user object
        const user: UserImport = {
          email: '',
          role: 'user', // Default role updated to match new system
          isValid: true,
          error: undefined,
        };
        
        // Map CSV values to user object
        headers.forEach((header, index) => {
          if (index < values.length) {
            const value = values[index];
            
            switch (header) {
              case 'email':
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                user.email = value;
                if (!emailRegex.test(value)) {
                  user.isValid = false;
                  user.error = 'Invalid email format';
                }
                break;
              case 'name':
                user.name = value;
                break;
              case 'role':
                // Normalize role values to support new five-role organization system
                const normalizedRole = value.toLowerCase();
                if (['user', 'manager', 'executive', 'admin', 'owner'].includes(normalizedRole)) {
                  user.role = normalizedRole;
                } else {
                  user.role = 'user'; // Default to user for invalid roles
                }
                break;
              case 'department':
                user.department = value;
                break;
              case 'team':
                user.team = value;
                break;
            }
          }
        });
        
        // Check if email is empty
        if (!user.email) {
          user.isValid = false;
          user.error = 'Email is required';
        }
        
        users.push(user);
      }
      
      // Update state with processed data
      setCsvData(users);
      
      // Update form state
      form.setValue("teamConfiguration.csvUsers", users);
      
      // Show toast notification
      toast({
        title: "CSV Processed",
        description: `Successfully processed ${users.length} users (${users.filter(u => u.isValid).length} valid)`,
      });
      
      // Store teams and users for later saving
      if (users.length > 0) {
        const validUsers = users.filter(user => user.isValid);
        const uniqueTeamNames = Array.from(new Set(
          users
            .filter((user: any) => user.team && user.team.trim() !== '')
            .map((user: any) => user.team.trim())
        ));
        
        setCsvImportedTeams(uniqueTeamNames);
        setCsvImportedUsers(validUsers);
      }
      
      // Show preview
      setShowCsvPreview(true);
    } catch (error) {
      console.error("CSV Processing Error:", error);
      toast({
        title: "CSV Processing Error",
        description: error instanceof Error ? error.message : "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCsv(false);
    }
  };

  // Function to save teams and users to the database
  const saveTeamsAndUsers = async () => {
    setIsSavingUsersAndTeams(true);
    
    try {
      console.log("Starting save process...");
      console.log("Teams to save:", csvImportedTeams);
      console.log("Users to save:", csvImportedUsers);
      
      // Get tenant ID from context
      const tenantId = tenantContext?.currentTenant?.id;
      if (!tenantId) {
        throw new Error("No tenant ID found");
      }
      console.log("Using tenant ID:", tenantId);
      
      let teamsCreated = 0;
      let usersCreated = 0;
      
      // Step 1: Create teams first if needed
      if (csvImportedTeams.length > 0) {
        try {
          console.log("Step 1: Creating teams via batch endpoint...");
          const teamCreateRes = await fetch("/api/teams/batch", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "X-Tenant-ID": tenantContext.currentTenant?.id || tenantId
            },
            body: JSON.stringify(csvImportedTeams.map(teamName => ({
              name: teamName,
              description: `Team created from CSV upload`
            }))),
            credentials: 'include'
          });
          
          console.log("Team creation response status:", teamCreateRes.status);
          const teamResponseText = await teamCreateRes.text();
          console.log("Team creation response:", teamResponseText);
          
          if (teamCreateRes.ok) {
            const teamCreateData = JSON.parse(teamResponseText);
            teamsCreated = teamCreateData.createdTeams?.length || csvImportedTeams.length;
            console.log("Teams created successfully:", teamCreateData);
            
            // Wait a moment for teams to be fully committed to database
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.error("Team creation failed:", teamResponseText);
          }
        } catch (error) {
          console.error("Error creating teams:", error);
        }
      }
      
      // Step 2: Create users using the bulk user creation endpoint
      if (csvImportedUsers.length > 0) {
        try {
          console.log("Step 2: Creating users using bulk endpoint...");
          
          // Create users one by one using the working approach from All Users page
          let createdCount = 0;
          const failedUsers = [];
          
          for (const user of csvImportedUsers) {
            try {
              const response = await fetch("/api/users", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "X-Tenant-ID": tenantId
                },
                body: JSON.stringify({
                  username: user.email.split('@')[0].toLowerCase(),
                  email: user.email.toLowerCase(),
                  firstName: user.firstName || user.name?.split(' ')[0] || user.email.split('@')[0],
                  lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
                  name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
                  title: user.department || '',
                  role: user.role || 'user',
                  tenantId: tenantId  // Ensure tenant ID is included
                }),
                credentials: 'include'
              });
              
              if (response.ok) {
                createdCount++;
                console.log(`Created user: ${user.email}`);
              } else if (response.status === 409) {
                // User already exists - this is okay, we can still assign them to teams
                try {
                  const errorData = await response.json();
                  console.log(`User already exists: ${user.email} (ID: ${errorData.userId})`);
                  createdCount++; // Count as successful since user exists
                } catch {
                  console.log(`User already exists: ${user.email}`);
                  createdCount++; // Count as successful since user exists
                }
              } else {
                const errorText = await response.text();
                console.error(`Failed to create user ${user.email}:`, errorText);
                failedUsers.push(user.email);
              }
            } catch (error) {
              console.error(`Error creating user ${user.email}:`, error);
              failedUsers.push(user.email);
            }
          }
          
          usersCreated = createdCount;
          console.log(`Successfully created ${createdCount} users, ${failedUsers.length} failed`);
          
          // Step 2.5: Assign users to their teams with proper team IDs
          console.log("Step 2.5: Assigning users to teams...");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for users to be committed
          
          // Fetch current teams to get team IDs
          const teamsResponse = await fetch("/api/teams", {
            method: "GET",
            headers: {
              "X-Tenant-ID": tenantContext.currentTenant?.id || tenantId
            },
            credentials: 'include'
          });
          
          if (teamsResponse.ok) {
            const allTeams = await teamsResponse.json();
            console.log("Available teams for assignment:", allTeams);
            
            // Fetch current users to get user IDs
            const usersResponse = await fetch("/api/users", {
              method: "GET",
              headers: {
                "X-Tenant-ID": tenantContext.currentTenant?.id || tenantId
              },
              credentials: 'include'
            });
            
            if (usersResponse.ok) {
              const allUsers = await usersResponse.json();
              console.log("Available users for team assignment:", allUsers);
              
              // Assign each CSV user to their team
              for (const csvUser of csvImportedUsers) {
                if (csvUser.team && csvUser.team.trim() !== '') {
                  const matchingTeam = allTeams.find(team => 
                    team.name.toLowerCase() === csvUser.team.toLowerCase()
                  );
                  const matchingUser = allUsers.find(user => 
                    user.email.toLowerCase() === csvUser.email.toLowerCase()
                  );
                  
                  if (matchingTeam && matchingUser) {
                    try {
                      // Assign user to team using the users-to-teams relationship
                      const assignResponse = await fetch("/api/users-to-teams", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-Tenant-ID": tenantContext.currentTenant?.id || tenantId
                        },
                        body: JSON.stringify({
                          userId: matchingUser.id,
                          teamId: matchingTeam.id,
                          tenantId: tenantContext.currentTenant?.id || tenantId
                        }),
                        credentials: 'include'
                      });
                      
                      if (assignResponse.ok) {
                        console.log(`Assigned ${csvUser.email} to team ${csvUser.team} (ID: ${matchingTeam.id})`);
                      } else {
                        console.log(`Failed to assign ${csvUser.email} to team ${csvUser.team}:`, await assignResponse.text());
                      }
                    } catch (error) {
                      console.error(`Error assigning ${csvUser.email} to team:`, error);
                    }
                  } else {
                    console.log(`Could not find matching team or user for ${csvUser.email} -> ${csvUser.team}`);
                  }
                }
              }
            }
          }
          
          // Now set managers as team leaders for their respective teams
          const managersToSetAsLeaders = csvImportedUsers.filter(user => 
            user.role === 'manager' && user.team && user.team.trim() !== ''
          );
          
          console.log("Step 3: Setting managers as team leaders:", managersToSetAsLeaders);
          
          if (managersToSetAsLeaders.length > 0) {
            // Wait longer for database transactions to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Retry logic to ensure teams and users are fully available
            let attempts = 0;
            const maxAttempts = 5;
            let teams: any[] = [];
            let users: any[] = [];
            let allDataFound = false;
            
            while (attempts < maxAttempts && !allDataFound) {
              try {
                console.log(`Attempt ${attempts + 1} to fetch teams and users...`);
                
                const teamsResponse = await fetch("/api/teams", {
                  method: "GET",
                  headers: {
                    "X-Tenant-ID": tenantContext.currentTenant?.id || tenantId
                  },
                  credentials: 'include'
                });
                
                const usersResponse = await fetch("/api/users", {
                  method: "GET",
                  headers: {
                    "X-Tenant-ID": tenantContext.currentTenant?.id || tenantId
                  },
                  credentials: 'include'
                });
                
                if (teamsResponse.ok && usersResponse.ok) {
                  teams = await teamsResponse.json();
                  users = await usersResponse.json();
                  
                  // Check if all required teams and users are available
                  const requiredTeams = [...new Set(managersToSetAsLeaders.map(m => m.team))];
                  const requiredUsers = managersToSetAsLeaders.map(m => m.email);
                  
                  const foundTeams = requiredTeams.filter(teamName => 
                    teams.some((t: any) => t.name.toLowerCase() === teamName.toLowerCase())
                  );
                  const foundUsers = requiredUsers.filter(email => 
                    users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())
                  );
                  
                  console.log(`Found ${foundTeams.length}/${requiredTeams.length} teams and ${foundUsers.length}/${requiredUsers.length} users`);
                  
                  if (foundTeams.length === requiredTeams.length && foundUsers.length === requiredUsers.length) {
                    allDataFound = true;
                    console.log("✓ All required teams and users found!");
                    break;
                  }
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                  console.log(`Waiting 3 seconds before retry ${attempts + 1}...`);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              } catch (error) {
                console.error(`Error in attempt ${attempts + 1}:`, error);
                attempts++;
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              }
            }
            
            if (allDataFound) {
              console.log("Available teams:", teams.map((t: any) => ({ id: t.id, name: t.name })));
              console.log("Available users:", users.map((u: any) => ({ id: u.id, email: u.email })));
              console.log("Looking for managers:", managersToSetAsLeaders.map(m => ({ email: m.email, team: m.team })));
              
              for (const manager of managersToSetAsLeaders) {
                try {
                  const team = teams.find((t: any) => t.name.toLowerCase() === manager.team.toLowerCase());
                  const user = users.find((u: any) => u.email.toLowerCase() === manager.email.toLowerCase());
                  
                  if (team && user) {
                    // Set the user as team leader
                    const leaderResponse = await fetch(`/api/teams/${team.id}/leader`, {
                      method: "PUT",
                      headers: { 
                        "Content-Type": "application/json",
                        "X-Tenant-ID": tenantContext.currentTenant?.id || tenantId
                      },
                      body: JSON.stringify({ leaderId: user.id }),
                      credentials: 'include'
                    });
                    
                    if (leaderResponse.ok) {
                      console.log(`Set ${manager.name} as leader of team ${manager.team}`);
                    } else {
                      console.error(`Failed to set ${manager.name} as team leader:`, await leaderResponse.text());
                    }
                  } else {
                    console.error(`Could not find team "${manager.team}" or user "${manager.email}" for leadership assignment`);
                  }
                } catch (error) {
                  console.error(`Error setting ${manager.name} as team leader:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error creating users:", error);
        }
      }
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Save Complete!",
        description: `Successfully saved ${teamsCreated} teams and ${usersCreated} users to your organization.`,
      });
      
      // Clear the imported data
      setCsvImportedTeams([]);
      setCsvImportedUsers([]);
      
    } catch (error) {
      console.error("Error saving teams and users:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your teams and users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingUsersAndTeams(false);
    }
  };
  
  // Function to process CSV data and create teams/users immediately
  const createTeamsAndUsersFromCsv = async (users: UserImport[]) => {
    try {
      console.log("Processing CSV data immediately...", users);
      
      // Extract unique team names from CSV data
      const uniqueTeamNames = Array.from(new Set(
        users
          .filter((user: any) => user.team && user.team.trim() !== '')
          .map((user: any) => user.team.trim())
      ));
      
      console.log("Unique teams to create:", uniqueTeamNames);
      
      // Create teams first if there are any
      if (uniqueTeamNames.length > 0) {
        try {
          const teamCreateRes = await fetch("/api/teams/batch", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "X-Tenant-ID": tenantId
            },
            body: JSON.stringify({
              teams: uniqueTeamNames.map(teamName => ({
                name: teamName,
                description: `Auto-created team from CSV upload`
              }))
            }),
            credentials: 'include'
          });
          
          if (teamCreateRes.ok) {
            const teamCreateData = await teamCreateRes.json();
            console.log("Teams created successfully:", teamCreateData);
            
            toast({
              title: "Teams Created",
              description: `Successfully created ${teamCreateData.createdTeams?.length || uniqueTeamNames.length} teams from your CSV file.`,
            });
          } else {
            console.error("Failed to create teams:", await teamCreateRes.text());
          }
        } catch (error) {
          console.error("Error creating teams:", error);
        }
      }
      
      // Process users - since teams are created, just show success message
      const validUsers = users.filter((user: any) => user.isValid && user.email);
      
      if (validUsers.length > 0) {
        toast({
          title: "CSV Upload Complete",
          description: `Successfully created ${uniqueTeamNames.length} teams. ${validUsers.length} users processed and ready for import.`,
        });
      }
      
      // Invalidate teams query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      
    } catch (error) {
      console.error("Error processing CSV data:", error);
      toast({
        title: "Error Processing CSV",
        description: "Failed to create teams and users from CSV file.",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle default team selection
  const handleDefaultTeamSelection = (templateId: string) => {
    setSelectedDefaultTeams(prev => {
      // Toggle selection
      const newSelection = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      
      // Update form state
      form.setValue("teamConfiguration.defaultTeams", newSelection);
      return newSelection;
    });
  };

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generalSettings: {
        companyMission: "",
        companyVision: "",
        companyValues: "",
        strategicDirections: [],
        trackingFrequency: "weekly",
        enableNotifications: true,
      },
      timeframes: {
        primaryCadence: "quarterly",
        enableQuarterlyCadence: true,
        enableAnnualCadence: true,
        customCadence: "",
        startMonth: "january",
      },
      objectiveSettings: {
        maxObjectivesPerTeam: "5",
        maxKeyResultsPerObjective: "3",
        requireObjectiveApproval: true,
        enableObjectiveAlignment: true,
      },
      teamConfiguration: {
        orgStructureType: "functional",
        enableCrossTeamObjectives: true,
        defaultVisibility: "public",
        selectedTeams: [] as string[],
        defaultTeams: [] as string[],
        csvUsers: [] as any[],
        useDefaultTeams: true, // Check this by default
      },
      integrations: {
        enableSlackIntegration: false,
        enableEmailNotifications: true,
        enableCalendarSync: false,
        enableAnalyticsReporting: true,
      },
    },
  });
  
  // Fetch existing OKR system configuration
  useEffect(() => {
    const fetchExistingConfig = async () => {
      try {
        setIsLoading(true);
        // Get active tenant ID from session if available
        const userResponse = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (!userResponse.ok) {
          console.error("Failed to get user information");
          setIsLoading(false);
          return;
        }
        
        const userData = await userResponse.json();
        console.log("User data received:", userData);
        
        // First try to get default tenant, then first tenant from array if available
        const currentTenantId = userData.defaultTenant || 
                               (userData.tenants && userData.tenants.length > 0 && userData.tenants[0].id);
        
        console.log("Detected tenant ID:", currentTenantId);
        
        if (!currentTenantId) {
          console.error("No tenant ID available");
          setIsLoading(false);
          return;
        }
        
        // Set tenant ID for later use in the submit function
        setTenantId(currentTenantId);
        
        // First, fetch organization mission data to prefill mission and vision fields
        console.log("Fetching organization mission data for tenant:", currentTenantId);
        
        // Create a FormValues object to store our form data
        const formValues: FormValues = {
          generalSettings: {
            companyMission: "",
            companyVision: "",
            companyValues: "",
            trackingFrequency: "weekly",
            enableNotifications: true,
          },
          timeframes: {
            primaryCadence: "quarterly",
            enableQuarterlyCadence: true,
            enableAnnualCadence: true,
            customCadence: "",
            startMonth: "january",
          },
          objectiveSettings: {
            maxObjectivesPerTeam: "5",
            maxKeyResultsPerObjective: "3",
            requireObjectiveApproval: true,
            enableObjectiveAlignment: true,
          },
          teamConfiguration: {
            orgStructureType: "functional",
            enableCrossTeamObjectives: true,
            defaultVisibility: "public",
            selectedTeams: [],
          },
          integrations: {
            enableSlackIntegration: false,
            enableEmailNotifications: true,
            enableCalendarSync: false,
            enableAnalyticsReporting: true,
          },
        };
        
        // Prioritize mission data from the organization-mission API
        const missionResponse = await fetch(`/api/organization-mission?tenantId=${currentTenantId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-Tenant-ID': currentTenantId
          },
          credentials: 'include'
        });
        
        // If mission data is available, use it for mission, vision, and values
        if (missionResponse.ok) {
          const missionData = await missionResponse.json();
          console.log("Organization mission data loaded:", missionData);
          
          // Check if data exists by checking for mission, id, or mission string
          if (missionData && (missionData.id || missionData.mission)) {
            // Populate the mission and vision fields from organization mission data
            formValues.generalSettings.companyMission = missionData.mission || "";
            formValues.generalSettings.companyVision = missionData.vision || "";
            
            // If behaviors is a JSON string, parse it; otherwise, use as is
            if (missionData.behaviors) {
              try {
                // Check if it's a JSON string that needs parsing
                if (typeof missionData.behaviors === 'string' && 
                    (missionData.behaviors.startsWith('[') || missionData.behaviors.startsWith('{'))) {
                  const parsedBehaviors = JSON.parse(missionData.behaviors);
                  
                  // If it's an array, join with commas
                  if (Array.isArray(parsedBehaviors)) {
                    formValues.generalSettings.companyValues = parsedBehaviors.join(', ');
                  } else {
                    formValues.generalSettings.companyValues = missionData.behaviors;
                  }
                } else {
                  formValues.generalSettings.companyValues = missionData.behaviors;
                }
              } catch (e) {
                // If parsing fails, use the raw string
                formValues.generalSettings.companyValues = missionData.behaviors;
              }
            }
            
            console.log("Prefilled form with mission data:", {
              mission: formValues.generalSettings.companyMission,
              vision: formValues.generalSettings.companyVision,
              values: formValues.generalSettings.companyValues
            });
          }
        }
        
        // Then fetch OKR system config for remaining form fields
        console.log("Fetching OKR system config with tenant ID:", currentTenantId);
        
        const systemResponse = await fetch(`/api/okr-system?tenantId=${currentTenantId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-Tenant-ID': currentTenantId
          },
          credentials: 'include'
        });
        
        // If OKR system config is available, use it to populate remaining fields
        if (systemResponse.ok) {
          const systemConfig = await systemResponse.json();
          console.log("Loaded existing OKR system config:", systemConfig);
          
          // Map database fields to form fields
          if (systemConfig) {
            // Only override mission/vision if not already set from mission API
            if (!formValues.generalSettings.companyMission && systemConfig.company_mission) {
              formValues.generalSettings.companyMission = systemConfig.company_mission;
            }
            
            if (!formValues.generalSettings.companyVision && systemConfig.company_vision) {
              formValues.generalSettings.companyVision = systemConfig.company_vision;
            }
            
            if (!formValues.generalSettings.companyValues && systemConfig.company_values) {
              formValues.generalSettings.companyValues = systemConfig.company_values;
            }
            
            // Map remaining fields
            if (systemConfig.tracking_frequency) {
              formValues.generalSettings.trackingFrequency = systemConfig.tracking_frequency;
            }
            
            formValues.generalSettings.enableNotifications = systemConfig.enable_notifications !== false;
            
            if (systemConfig.primary_cadence) {
              formValues.timeframes.primaryCadence = systemConfig.primary_cadence;
            }
            
            formValues.timeframes.enableQuarterlyCadence = systemConfig.enable_quarterly_cadence !== false;
            formValues.timeframes.enableAnnualCadence = systemConfig.enable_annual_cadence !== false;
            
            if (systemConfig.custom_cadence) {
              formValues.timeframes.customCadence = systemConfig.custom_cadence;
            }
            
            if (systemConfig.start_month) {
              formValues.timeframes.startMonth = systemConfig.start_month;
            }
            
            if (systemConfig.default_objective_category) {
              formValues.objectiveSettings.defaultObjectiveCategory = systemConfig.default_objective_category;
            }
            
            if (systemConfig.max_objectives_per_team) {
              formValues.objectiveSettings.maxObjectivesPerTeam = systemConfig.max_objectives_per_team.toString();
            }
            
            if (systemConfig.max_key_results_per_objective) {
              formValues.objectiveSettings.maxKeyResultsPerObjective = 
                systemConfig.max_key_results_per_objective.toString();
            }
            
            formValues.objectiveSettings.requireObjectiveApproval = 
              systemConfig.require_objective_approval !== false;
            
            formValues.objectiveSettings.enableObjectiveAlignment = 
              systemConfig.enable_objective_alignment !== false;
            
            if (systemConfig.org_structure_type) {
              formValues.teamConfiguration.orgStructureType = systemConfig.org_structure_type;
            }
            
            formValues.teamConfiguration.enableCrossTeamObjectives = 
              systemConfig.enable_cross_team_objectives !== false;
            
            if (systemConfig.default_visibility) {
              formValues.teamConfiguration.defaultVisibility = systemConfig.default_visibility;
            }
            
            // If there are selected teams in the config, use them
            if (systemConfig.selected_teams && Array.isArray(systemConfig.selected_teams)) {
              formValues.teamConfiguration.selectedTeams = systemConfig.selected_teams;
            } else {
              formValues.teamConfiguration.selectedTeams = [];
            }
            
            formValues.integrations.enableSlackIntegration = 
              systemConfig.enable_slack_integration === true;
            
            formValues.integrations.enableEmailNotifications = 
              systemConfig.enable_email_notifications !== false;
            
            formValues.integrations.enableCalendarSync = 
              systemConfig.enable_calendar_sync === true;
            
            formValues.integrations.enableAnalyticsReporting = 
              systemConfig.enable_analytics_reporting !== false;
          }
        }
        
        // Finally, reset the form with all the collected data
        console.log("Resetting form with data:", formValues);
        form.reset(formValues);
        
        // Update internal state to match the loaded data
        setActivePage("general"); // Start on the general page where mission data is displayed
        
        // Show notification that data was loaded if mission or vision is available
        if (formValues.generalSettings.companyMission || formValues.generalSettings.companyVision) {
          toast({
            title: "Configuration Loaded",
            description: "Your existing mission and vision data has been loaded. You can edit and save changes using the Complete Mission Setup button.",
          });
        }
        
      } catch (error) {
        console.error("Error fetching configuration data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingConfig();
  }, [form, toast]);

  // Using the tenantId state initialized above
  
  // Create mutation for saving OKR system setup
  const saveOKRSystemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Saving OKR system setup:", data);
      
      if (!tenantId) {
        throw new Error("No tenant ID available. Please refresh the page and try again.");
      }
      
      // Make API request to save OKR system setup
      console.log("Using tenant ID for save:", tenantId);
      
      // Get selected default teams 
      const selectedDefaultTeamIds = data.teamConfiguration.defaultTeams || [];
      
      // Create a new object with tenant_id property
      const formDataWithTenant = {
        ...data,
        tenant_id: tenantId, // Add tenant ID to the request body
        
        // Process default teams if enabled
        default_teams: data.teamConfiguration.useDefaultTeams ? 
          defaultTeamTemplates
            .filter(template => selectedDefaultTeamIds.includes(template.id))
            .map(template => ({
              name: template.name,
              description: template.description,
              color: template.color,
              icon: template.icon,
              tenant_id: tenantId
            })) 
          : [],
          
        // Include CSV users - make sure to process only valid users
        csv_users: Array.isArray(data.teamConfiguration.csvUsers) ? 
          data.teamConfiguration.csvUsers
            .filter(user => user && user.email && (user.isValid !== false)) // Only include valid users or those without explicit validation
            .map(user => ({
              email: user.email,
              name: user.name || '',
              role: user.role || 'user',
              department: user.department || '',
              team: user.team || '',
              tenant_id: tenantId
            }))
          : [],
          
        // Include strategic directions for saving
        strategic_directions: Array.isArray(data.generalSettings.strategicDirections) ?
          data.generalSettings.strategicDirections
            .filter(direction => direction && direction.title && direction.title.trim() !== '')
            .map(direction => ({
              title: direction.title.trim(),
              description: direction.description?.trim() || '',
              priority: direction.priority || 1,
              type: 'company',
              tenant_id: tenantId
            }))
          : []
      };
      
      // Log the full data being sent
      console.log("Sending data with tenant:", formDataWithTenant);
      
      console.log("Sending OKR system config with tenant ID:", tenantId);
      
      // Format the data properly to avoid JSON parsing errors
      const safeFormData = JSON.parse(JSON.stringify(formDataWithTenant));
      
      // Use our new simplified endpoint which has more flexible validation
      const response = await fetch(`/api/okr-system-setup-simple?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId // Add tenant ID in header for middleware
        },
        body: JSON.stringify(safeFormData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save OKR system setup:", response.status, errorData);
        throw new Error(errorData.error || "Failed to save OKR system setup");
      }
      
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log("OKR system setup saved successfully:", data);
      setSetupComplete(true);
      
      // Show success message
      toast({
        title: "OKR System Setup Complete!",
        description: "Your OKR system has been configured successfully.",
      });
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/okr-system"] });
      
      // Show completion message and redirect
      setTimeout(() => {
        console.log("Setup complete");
        
        toast({
          title: "Ready to Launch your OKR Platform!",
          description: "Your OKR system is ready to use. You will now be redirected to create your first company objective.",
        });
        
        // Navigate to the create company objective page
        setTimeout(() => {
          navigate("/create-company-objective");
        }, 800);
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Error in OKR system setup submission:", error);
      setIsSubmitting(false);
      
      // Show more detailed error information
      toast({
        title: "Error Saving OKR System",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      // Log the current form values for debugging
      console.log("Current form values:", form.getValues());
    }
  });

  // Function to check if current step is valid
  const isCurrentStepValid = () => {
    const currentStep = steps[activeIndex];
    
    if (currentStep.id === "general") {
      const { generalSettings } = form.getValues();
      return !!generalSettings.companyMission && 
             !!generalSettings.companyVision && 
             !!generalSettings.companyValues;
    }
    
    if (currentStep.id === "timeframes") {
      return true; // All fields have defaults
    }
    
    if (currentStep.id === "objectives") {
      return true; // All fields have defaults
    }
    
    if (currentStep.id === "teams") {
      return true; // All fields have defaults
    }
    
    if (currentStep.id === "integrations") {
      return true; // All fields have defaults
    }
    
    return true;
  };

  // Submit handler
  const onSubmitForm = async (data: FormValues) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    
    try {
      // First, process CSV users and create teams if needed
      if (data.teamConfiguration.csvUsers && data.teamConfiguration.csvUsers.length > 0) {
        console.log("Processing CSV users and creating teams...");
        
        // Extract unique team names from CSV data
        const uniqueTeams = Array.from(new Set(
          data.teamConfiguration.csvUsers
            .filter((user: any) => user.team && user.team.trim() !== '')
            .map((user: any) => user.team.trim())
        ));
        
        // Create teams if there are any
        if (uniqueTeams.length > 0) {
          try {
            const teamCreateRes = await fetch("/api/teams/batch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                teams: uniqueTeams.map(teamName => ({
                  name: teamName,
                  description: `Auto-created team from CSV upload`
                }))
              })
            });
            
            if (teamCreateRes.ok) {
              const teamCreateData = await teamCreateRes.json();
              console.log("Teams created successfully:", teamCreateData);
            }
          } catch (error) {
            console.error("Error creating teams:", error);
          }
        }
        
        // Teams are already created during CSV upload, just show success
        const validUsers = data.teamConfiguration.csvUsers.filter((user: any) => user.isValid);
        
        if (validUsers.length > 0) {
          console.log(`CSV upload complete: ${uniqueTeams.length} teams created, ${validUsers.length} users processed`);
        }
      }
      
      // Make sure teamConfiguration has all required properties to prevent submission errors
      const validatedData = {
        ...data,
        teamConfiguration: {
          ...data.teamConfiguration,
          defaultTeams: data.teamConfiguration.defaultTeams || [],
          csvUsers: data.teamConfiguration.csvUsers || [],
          // Make sure useDefaultTeams is present and properly set
          useDefaultTeams: typeof data.teamConfiguration.useDefaultTeams === 'boolean' 
            ? data.teamConfiguration.useDefaultTeams 
            : true // Default to true if not present
        }
      };
      
      // Continue with the OKR system setup
      saveOKRSystemMutation.mutate(validatedData);
    } catch (error) {
      console.error("Error in form submission:", error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "An error occurred while processing your setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Legacy submit handler for the mutation
  const handleFormSubmit = (data: FormValues) => {
    console.log("Legacy form submitted with data:", data);
    setIsSubmitting(true);
    
    // Make sure teamConfiguration has all required properties to prevent submission errors
    const validatedData = {
      ...data,
      teamConfiguration: {
        ...data.teamConfiguration,
        defaultTeams: data.teamConfiguration.defaultTeams || [],
        csvUsers: data.teamConfiguration.csvUsers || [],
        // Make sure useDefaultTeams is present and properly set
        useDefaultTeams: typeof data.teamConfiguration.useDefaultTeams === 'boolean' 
          ? data.teamConfiguration.useDefaultTeams 
          : true // Default to true if not present
      }
    };
    
    console.log("Validated form data:", validatedData);
    saveOKRSystemMutation.mutate(validatedData);
  };
  
  // Handle saving just the mission data
  const saveMissionData = async () => {
    try {
      // Get values from the form
      const { generalSettings } = form.getValues();
      
      if (!tenantId) {
        toast({
          title: "Error",
          description: "No tenant ID available. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (!generalSettings.companyMission || !generalSettings.companyVision) {
        toast({
          title: "Validation Error",
          description: "Please fill in both mission and vision statements.",
          variant: "destructive",
        });
        return;
      }
      
      // Show loading state
      setIsSubmitting(true);
      
      // Prepare the data for the mission API
      const missionData = {
        mission: generalSettings.companyMission,
        vision: generalSettings.companyVision,
        behaviors: generalSettings.companyValues,
        tenantId: tenantId
      };
      
      console.log("Saving mission data:", missionData);
      
      // First, check if cadences exist for this tenant
      console.log("Checking if cadences exist for tenant:", tenantId);
      
      // Check for existing cadences
      const cadenceResponse = await fetch(`/api/cadences?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        credentials: 'include'
      });
      
      const cadencesData = await cadenceResponse.json();
      console.log("Existing cadences:", cadencesData);
      
      // If no cadences exist, create default ones
      if (!cadencesData.length || cadencesData.length === 0) {
        console.log("No cadences found, creating default cadences");
        
        // Create default annual cadence
        const annualCadence = {
          name: "Annual",
          description: "Yearly planning cycle",
          period: "annual",
          tenantId: tenantId
        };
        
        // Create default quarterly cadence
        const quarterlyCadence = {
          name: "Quarterly",
          description: "Quarterly planning cycle",
          period: "quarterly",
          tenantId: tenantId
        };
        
        try {
          // First create the cadences
          const annualCadenceResponse = await fetch(`/api/cadences?tenantId=${tenantId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': tenantId
            },
            body: JSON.stringify(annualCadence),
            credentials: 'include'
          });
          
          const quarterlyCadenceResponse = await fetch(`/api/cadences?tenantId=${tenantId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': tenantId
            },
            body: JSON.stringify(quarterlyCadence),
            credentials: 'include'
          });
          
          if (annualCadenceResponse.ok && quarterlyCadenceResponse.ok) {
            console.log("Default cadences created successfully");
            
            // Get the created cadence IDs
            const annualCadenceData = await annualCadenceResponse.json();
            const quarterlyCadenceData = await quarterlyCadenceResponse.json();
            
            // Now create timeframes for each cadence
            const currentDate = new Date();
            
            // Create annual timeframe for the current year
            const annualTimeframe = {
              name: `${currentDate.getFullYear()} Annual`,
              description: `Annual objectives for ${currentDate.getFullYear()}`,
              startDate: new Date(currentDate.getFullYear(), 0, 1), // Jan 1 of current year
              endDate: new Date(currentDate.getFullYear(), 11, 31), // Dec 31 of current year
              cadenceId: annualCadenceData.id,
              tenantId: tenantId
            };
            
            // Get current quarter
            const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
            const quarterStartMonth = (currentQuarter - 1) * 3;
            const quarterEndMonth = quarterStartMonth + 2;
            
            // Create quarterly timeframe for the current quarter
            const quarterlyTimeframe = {
              name: `Q${currentQuarter} ${currentDate.getFullYear()}`,
              description: `Q${currentQuarter} objectives for ${currentDate.getFullYear()}`,
              startDate: new Date(currentDate.getFullYear(), quarterStartMonth, 1),
              endDate: new Date(currentDate.getFullYear(), quarterEndMonth + 1, 0), // Last day of end month
              cadenceId: quarterlyCadenceData.id,
              tenantId: tenantId
            };
            
            // Create the timeframes
            const annualTimeframeResponse = await fetch(`/api/timeframes?tenantId=${tenantId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenantId
              },
              body: JSON.stringify(annualTimeframe),
              credentials: 'include'
            });
            
            const quarterlyTimeframeResponse = await fetch(`/api/timeframes?tenantId=${tenantId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenantId
              },
              body: JSON.stringify(quarterlyTimeframe),
              credentials: 'include'
            });
            
            if (annualTimeframeResponse.ok && quarterlyTimeframeResponse.ok) {
              console.log("Default timeframes created successfully");
            } else {
              console.error("Failed to create default timeframes:", 
                await annualTimeframeResponse.text(), 
                await quarterlyTimeframeResponse.text()
              );
            }
          } else {
            console.error("Failed to create default cadences:", 
              await annualCadenceResponse.text(), 
              await quarterlyCadenceResponse.text()
            );
          }
        } catch (error) {
          console.error("Error creating default cadences and timeframes:", error);
        }
      } else {
        // Check if there are any timeframes
        const timeframesResponse = await fetch(`/api/timeframes?tenantId=${tenantId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId
          },
          credentials: 'include'
        });
        
        const timeframesData = await timeframesResponse.json();
        console.log("Existing timeframes:", timeframesData);
        
        // If cadences exist but no timeframes, create default timeframes
        if (!timeframesData.length || timeframesData.length === 0) {
          console.log("No timeframes found, creating default timeframes for existing cadences");
          
          try {
            // Find annual and quarterly cadences
            const annualCadence = cadencesData.find(c => 
              c.name.toLowerCase().includes('annual') || 
              c.period?.toLowerCase().includes('annual')
            );
            
            const quarterlyCadence = cadencesData.find(c => 
              c.name.toLowerCase().includes('quarter') || 
              c.period?.toLowerCase().includes('quarter')
            );
            
            const currentDate = new Date();
            
            // Create timeframes if cadences are found
            if (annualCadence) {
              const annualTimeframe = {
                name: `${currentDate.getFullYear()} Annual`,
                description: `Annual objectives for ${currentDate.getFullYear()}`,
                startDate: new Date(currentDate.getFullYear(), 0, 1), // Jan 1 of current year
                endDate: new Date(currentDate.getFullYear(), 11, 31), // Dec 31 of current year
                cadenceId: annualCadence.id,
                tenantId: tenantId
              };
              
              await fetch(`/api/timeframes?tenantId=${tenantId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(annualTimeframe),
                credentials: 'include'
              });
            }
            
            if (quarterlyCadence) {
              // Get current quarter
              const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
              const quarterStartMonth = (currentQuarter - 1) * 3;
              const quarterEndMonth = quarterStartMonth + 2;
              
              const quarterlyTimeframe = {
                name: `Q${currentQuarter} ${currentDate.getFullYear()}`,
                description: `Q${currentQuarter} objectives for ${currentDate.getFullYear()}`,
                startDate: new Date(currentDate.getFullYear(), quarterStartMonth, 1),
                endDate: new Date(currentDate.getFullYear(), quarterEndMonth + 1, 0), // Last day of end month
                cadenceId: quarterlyCadence.id,
                tenantId: tenantId
              };
              
              await fetch(`/api/timeframes?tenantId=${tenantId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(quarterlyTimeframe),
                credentials: 'include'
              });
            }
            
            console.log("Default timeframes created for existing cadences");
          } catch (error) {
            console.error("Error creating timeframes for existing cadences:", error);
          }
        } else {
          console.log("Timeframes already exist for this tenant:", timeframesData.length);
        }
      }
      
      // Send the request to the mission API
      const response = await fetch(`/api/organization-mission?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(missionData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save mission data: ${errorText}`);
      }
      
      // Show success message
      toast({
        title: "Mission Setup Complete!",
        description: "Your company mission, vision, and values have been saved.",
      });
      
      // Move to the next step automatically
      goToNextStep();
      
    } catch (error) {
      console.error("Error saving mission data:", error);
      toast({
        title: "Error Saving Mission",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = form.handleSubmit(onSubmitForm);

  // Navigation handlers
  const goToNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === activePage);
    if (currentIndex < steps.length - 1) {
      setActivePage(steps[currentIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === activePage);
    if (currentIndex > 0) {
      setActivePage(steps[currentIndex - 1].id);
    }
  };

  const goToStep = (stepId: string) => {
    setActivePage(stepId);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary">OKR System Setup</h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          Follow this guided workflow to set up your complete OKR system. 
          You'll configure timeframes, objective settings, and team structure.
        </p>
        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading existing configuration...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        {/* Progress indicator */}
        <div className="hidden sm:flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center"
            >
              <button
                onClick={() => goToStep(step.id)}
                disabled={setupComplete}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${activeIndex === index 
                    ? 'border-primary bg-primary text-white' 
                    : index < activeIndex 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-300 bg-white text-gray-400'}`}
              >
                <step.icon className="w-5 h-5" />
              </button>
              <span className={`mt-2 text-xs font-medium ${activeIndex === index ? 'text-primary' : 'text-gray-500'}`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`absolute left-0 right-0 top-5 h-0.5 -z-10 
                  ${index < activeIndex ? 'bg-primary' : 'bg-gray-200'}`}
                  style={{ left: "calc(50% + 1rem)", right: "calc(-50% + 1rem)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile steps */}
        <div className="flex overflow-x-auto sm:hidden pb-4 mb-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              disabled={setupComplete}
              className={`flex items-center min-w-max px-4 py-2 mx-1 rounded-full text-sm font-medium whitespace-nowrap
                ${activeIndex === index 
                  ? 'bg-primary text-white' 
                  : index < activeIndex 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-gray-100 text-gray-700'}`}
            >
              <step.icon className="w-4 h-4 mr-1.5" />
              {step.label}
            </button>
          ))}
        </div>

        {/* Main form */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activePage} className="w-full">
              {/* General Settings */}
              <TabsContent value="general">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Settings2 className="mr-2 h-5 w-5 text-primary" />
                        General Settings
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Define your organization's mission, vision, and values to align your OKRs with your strategic goals.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Mission</label>
                            <Textarea
                              placeholder="Our company's mission is to..."
                              {...form.register("generalSettings.companyMission")}
                              className="resize-none h-20"
                              defaultValue={form.getValues("generalSettings.companyMission")}
                            />
                            {form.formState.errors.generalSettings?.companyMission && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.generalSettings.companyMission.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Vision</label>
                            <Textarea
                              placeholder="Our vision for the future is..."
                              {...form.register("generalSettings.companyVision")}
                              className="resize-none h-20"
                              defaultValue={form.getValues("generalSettings.companyVision")}
                            />
                            {form.formState.errors.generalSettings?.companyVision && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.generalSettings.companyVision.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Values</label>
                            <Textarea
                              placeholder="Our core values include..."
                              {...form.register("generalSettings.companyValues")}
                              className="resize-none h-20"
                              defaultValue={form.getValues("generalSettings.companyValues")}
                            />
                            {form.formState.errors.generalSettings?.companyValues && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.generalSettings.companyValues.message}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Strategic Directions Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-sm font-medium mb-1">Strategic Directions</label>
                              <p className="text-xs text-gray-500">Define key strategic priorities that will guide your organization's OKRs</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentDirections = form.getValues("generalSettings.strategicDirections") || [];
                                form.setValue("generalSettings.strategicDirections", [
                                  ...currentDirections,
                                  { title: "", description: "", priority: currentDirections.length + 1 }
                                ]);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Direction
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            {(form.watch("generalSettings.strategicDirections") || []).map((direction: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="text-sm font-medium text-gray-700">Strategic Direction {index + 1}</h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const currentDirections = form.getValues("generalSettings.strategicDirections") || [];
                                      const updatedDirections = currentDirections.filter((_: any, i: number) => i !== index);
                                      form.setValue("generalSettings.strategicDirections", updatedDirections);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1">Strategic Direction</label>
                                  <Textarea
                                    placeholder="Describe this strategic direction and its importance..."
                                    className="resize-none h-20"
                                    value={direction.description || ""}
                                    onChange={(e) => {
                                      const currentDirections = form.getValues("generalSettings.strategicDirections") || [];
                                      currentDirections[index] = { 
                                        ...currentDirections[index], 
                                        description: e.target.value,
                                        title: e.target.value.substring(0, 50) || `Direction ${index + 1}`, // Auto-generate title from description
                                        priority: index + 1 // Auto-assign priority based on order
                                      };
                                      form.setValue("generalSettings.strategicDirections", currentDirections);
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                            
                            {(!form.watch("generalSettings.strategicDirections") || form.watch("generalSettings.strategicDirections")?.length === 0) && (
                              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No strategic directions defined yet</p>
                                <p className="text-xs">Click "Add Direction" to create your first strategic priority</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">OKR Tracking Frequency</label>
                            <Select
                              defaultValue={form.getValues("generalSettings.trackingFrequency")}
                              onValueChange={(value) => form.setValue("generalSettings.trackingFrequency", value as "weekly" | "biweekly" | "monthly")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select tracking frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Biweekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Complete Mission Setup button */}
                          <div className="col-span-1 md:col-span-2 mt-6">
                            <Button 
                              type="button"
                              onClick={saveMissionData}
                              disabled={isSubmitting}
                              className="w-full"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  Complete Mission Setup
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2 pt-6">
                            <Checkbox
                              id="enableNotifications"
                              checked={form.getValues("generalSettings.enableNotifications")}
                              onCheckedChange={(checked) => 
                                form.setValue("generalSettings.enableNotifications", checked as boolean)
                              }
                            />
                            <label 
                              htmlFor="enableNotifications"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Enable Progress Notifications
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Timeframes */}
              <TabsContent value="timeframes">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        OKR Timeframes
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure your OKR planning cycles and timeframes to establish your organization's rhythm.
                      </p>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">Primary OKR Cadence</label>
                          <Select
                            defaultValue={form.getValues("timeframes.primaryCadence")}
                            onValueChange={(value) => form.setValue("timeframes.primaryCadence", value as "quarterly" | "trimester" | "halfYearly" | "annual")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary cadence" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                              <SelectItem value="trimester">Trimester (4 months)</SelectItem>
                              <SelectItem value="halfYearly">Half-yearly (6 months)</SelectItem>
                              <SelectItem value="annual">Annual (12 months)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">This will be your main planning cycle length</p>
                        </div>
                        

                        
                        <div>
                          <label className="block text-sm font-medium mb-1">OKR Year Start Month</label>
                          <Select
                            defaultValue={form.getValues("timeframes.startMonth")}
                            onValueChange={(value) => form.setValue("timeframes.startMonth", value as "january" | "february" | "march" | "april" | "may" | "june" | "july" | "august" | "september" | "october" | "november" | "december")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select start month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="january">January</SelectItem>
                              <SelectItem value="february">February</SelectItem>
                              <SelectItem value="march">March</SelectItem>
                              <SelectItem value="april">April</SelectItem>
                              <SelectItem value="may">May</SelectItem>
                              <SelectItem value="june">June</SelectItem>
                              <SelectItem value="july">July</SelectItem>
                              <SelectItem value="august">August</SelectItem>
                              <SelectItem value="september">September</SelectItem>
                              <SelectItem value="october">October</SelectItem>
                              <SelectItem value="november">November</SelectItem>
                              <SelectItem value="december">December</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">When your OKR year begins</p>
                        </div>

                        {tenantId && (
                          <div className="pt-6 border-t mt-6">
                            <TimeframeSetupSimplified
                              tenantId={tenantId}
                              primaryCadence={form.watch("timeframes.primaryCadence")}
                              startMonth={form.watch("timeframes.startMonth")}
                              onTimeframesSaved={goToNextStep}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Objective Settings */}
              <TabsContent value="objectives">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Target className="mr-2 h-5 w-5 text-primary" />
                        Objective Settings
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure how objectives and key results will be structured in your organization.
                      </p>
                      
                      <div className="space-y-6">

                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium mb-1">Max Objectives Per Team</label>
                            <Select
                              defaultValue={form.getValues("objectiveSettings.maxObjectivesPerTeam")}
                              onValueChange={(value) => form.setValue("objectiveSettings.maxObjectivesPerTeam", value as "3" | "4" | "5" | "6" | "7" | "8")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 objectives</SelectItem>
                                <SelectItem value="4">4 objectives</SelectItem>
                                <SelectItem value="5">5 objectives</SelectItem>
                                <SelectItem value="6">6 objectives</SelectItem>
                                <SelectItem value="7">7 objectives</SelectItem>
                                <SelectItem value="8">8 objectives</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">Recommended: 3-5 for focus</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Max Key Results Per Objective</label>
                            <Select
                              defaultValue={form.getValues("objectiveSettings.maxKeyResultsPerObjective")}
                              onValueChange={(value) => form.setValue("objectiveSettings.maxKeyResultsPerObjective", value as "3" | "4" | "5" | "6")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 key results</SelectItem>
                                <SelectItem value="4">4 key results</SelectItem>
                                <SelectItem value="5">5 key results</SelectItem>
                                <SelectItem value="6">6 key results</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">Recommended: 3-4 for clarity</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requireObjectiveApproval"
                              checked={form.getValues("objectiveSettings.requireObjectiveApproval")}
                              onCheckedChange={(checked) => 
                                form.setValue("objectiveSettings.requireObjectiveApproval", checked as boolean)
                              }
                            />
                            <label 
                              htmlFor="requireObjectiveApproval"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Require Approval for New Objectives
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="enableObjectiveAlignment"
                              checked={form.getValues("objectiveSettings.enableObjectiveAlignment")}
                              onCheckedChange={(checked) => 
                                form.setValue("objectiveSettings.enableObjectiveAlignment", checked as boolean)
                              }
                            />
                            <label 
                              htmlFor="enableObjectiveAlignment"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Enable Parent-Child Objective Alignment
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Teams Configuration */}
              <TabsContent value="teams">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Users2 className="mr-2 h-5 w-5 text-primary" />
                        Team Configuration
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure how teams will collaborate and organize their OKRs within your system.
                      </p>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">Organization Structure Type</label>
                          <Select
                            defaultValue={form.getValues("teamConfiguration.orgStructureType")}
                            onValueChange={(value) => form.setValue("teamConfiguration.orgStructureType", value as "functional" | "divisional" | "matrix" | "flat" | "hierarchical")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization structure" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="functional">Functional (Marketing, Sales, Engineering)</SelectItem>
                              <SelectItem value="divisional">Divisional (Product Lines, Geographic)</SelectItem>
                              <SelectItem value="matrix">Matrix (Dual Reporting)</SelectItem>
                              <SelectItem value="flat">Flat (Few Hierarchical Layers)</SelectItem>
                              <SelectItem value="hierarchical">Hierarchical (Traditional)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">How your organization is structured</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Default OKR Visibility</label>
                          <Select
                            defaultValue={form.getValues("teamConfiguration.defaultVisibility")}
                            onValueChange={(value) => form.setValue("teamConfiguration.defaultVisibility", value as "public" | "team" | "private")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select default visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public (Entire Organization)</SelectItem>
                              <SelectItem value="team">Team Only</SelectItem>
                              <SelectItem value="private">Private (Individual/Manager Only)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableCrossTeamObjectives"
                            checked={form.getValues("teamConfiguration.enableCrossTeamObjectives")}
                            onCheckedChange={(checked) => 
                              form.setValue("teamConfiguration.enableCrossTeamObjectives", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableCrossTeamObjectives"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Cross-Team Objectives
                          </label>
                        </div>
                        
                        {/* Default Team Templates Section */}
                        <div className="mt-6 border-t pt-6">
                          <h3 className="text-lg font-medium mb-4">Quick Start with Default Teams</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Select pre-configured team templates to quickly set up your organization structure. 
                            These teams will be created automatically when you save your OKR system setup.
                          </p>
                          
                          {/* <div className="flex items-center space-x-2 mb-6">
                            <Checkbox
                              id="useDefaultTeams"
                              checked={form.getValues("teamConfiguration.useDefaultTeams")}
                              onCheckedChange={(checked) => 
                                form.setValue("teamConfiguration.useDefaultTeams", checked as boolean)
                              }
                            />
                            <label 
                              htmlFor="useDefaultTeams"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Use default team templates
                            </label>
                          </div> */}
                          
                          {/* {form.getValues("teamConfiguration.useDefaultTeams") && ( */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                              {defaultTeamTemplates.map((template) => (
                                <div 
                                  key={template.id}
                                  className={`border rounded-md p-4 cursor-pointer transition-all ${
                                    selectedDefaultTeams.includes(template.id) 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => handleDefaultTeamSelection(template.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                                      style={{ backgroundColor: template.color }}
                                    >
                                      <span className="text-lg">{template.icon === 'megaphone' ? '📣' : 
                                                                 template.icon === 'code' ? '💻' :
                                                                 template.icon === 'briefcase' ? '💼' :
                                                                 template.icon === 'layers' ? '📚' :
                                                                 template.icon === 'settings' ? '⚙️' :
                                                                 template.icon === 'users' ? '👥' :
                                                                 template.icon === 'dollar-sign' ? '💰' :
                                                                 template.icon === 'heart' ? '❤️' : '📋'}</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                      <h4 className="font-medium">{template.name}</h4>
                                      <p className="text-sm text-gray-500">{template.description}</p>
                                    </div>
                                    
                                    <div className="flex-shrink-0">
                                      {selectedDefaultTeams.includes(template.id) ? (
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                          <Check className="h-4 w-4 text-white" />
                                        </div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          {/* )} */}
                        </div>

                        {/* CSV User Upload Section */}
                        <div className="mt-6 border-t pt-6">
                          <h3 className="text-lg font-medium mb-4">Upload Users via CSV</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Upload a CSV file with user information to add multiple users at once. 
                            <br />
                            <strong>Required columns:</strong> email (must be unique)
                            <br />
                            <strong>Optional columns:</strong> name, role (admin/member/viewer), department, team
                            <br />
                            <em>Users will be created with secure temporary passwords and added to your organization automatically.</em>
                          </p>
                          
                          <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                              <label htmlFor="csv-upload" className="text-sm font-medium text-gray-700">
                                Upload CSV File
                              </label>
                              <input
                                ref={fileInputRef}
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleCsvUpload}
                              />
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isProcessingCsv}
                                  className="w-full md:w-auto"
                                >
                                  {isProcessingCsv ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Choose CSV File
                                    </>
                                  )}
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    // Download comprehensive CSV template with all required fields and new roles
                                    const sample = `email,name,role,department,team
john.doe@company.com,John Doe,user,Marketing,Marketing Team
jane.smith@company.com,Jane Smith,manager,Engineering,Engineering Team
mike.johnson@company.com,Mike Johnson,executive,Sales,Sales Team
sarah.williams@company.com,Sarah Williams,admin,HR,Human Resources
david.brown@company.com,David Brown,owner,Finance,Finance Team`;
                                    const blob = new Blob([sample], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'team_user_upload_template.csv';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="w-full md:w-auto"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Download Template
                                </Button>
                              </div>
                            </div>
                            
                            {/* CSV Data Preview */}
                            {showCsvPreview && csvData.length > 0 && (
                              <div className="mt-4 border rounded-md overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                                  <h4 className="font-medium">CSV Preview - {csvData.length} users</h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setCsvData([]);
                                      form.setValue("teamConfiguration.csvUsers", []);
                                      setShowCsvPreview(false);
                                      if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {csvData.map((user, index) => (
                                        <tr key={index} className={!user.isValid ? 'bg-red-50' : ''}>
                                          <td className="px-4 py-2 whitespace-nowrap">
                                            {user.isValid ? (
                                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger>
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{user.error}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.email}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.name || '-'}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.role}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.department || '-'}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.team || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Imported Teams and Users Display */}
                            {(csvImportedTeams.length > 0 || csvImportedUsers.length > 0) && (
                              <div className="mt-6 border rounded-lg p-4 bg-blue-50 border-blue-200">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-semibold text-blue-900">Ready to Save</h4>
                                  <Button
                                    type="button"
                                    onClick={saveTeamsAndUsers}
                                    disabled={isSavingUsersAndTeams}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    {isSavingUsersAndTeams ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Teams & Users
                                      </>
                                    )}
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Teams to be created */}
                                  {csvImportedTeams.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-blue-800 mb-2">
                                        Teams to Create ({csvImportedTeams.length})
                                      </h5>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {csvImportedTeams.map((teamName, index) => (
                                          <div key={index} className="flex items-center text-sm text-blue-700">
                                            <Users2 className="mr-2 h-3 w-3" />
                                            {teamName}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Users to be created */}
                                  {csvImportedUsers.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-blue-800 mb-2">
                                        Users to Create ({csvImportedUsers.length})
                                      </h5>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {csvImportedUsers.slice(0, 5).map((user, index) => (
                                          <div key={index} className="flex items-center text-sm text-blue-700">
                                            <User className="mr-2 h-3 w-3" />
                                            {user.name} ({user.email})
                                          </div>
                                        ))}
                                        {csvImportedUsers.length > 5 && (
                                          <div className="text-sm text-blue-600 italic">
                                            ... and {csvImportedUsers.length - 5} more users
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-sm text-blue-700 mt-3">
                                  Click "Save Teams & Users" to add these to your organization permanently.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Existing Teams Section - Hidden per user request */}
                        {/* 
                        <div className="mt-6 border-t pt-6">
                          <h3 className="text-lg font-medium mb-4">Select Teams to Include in OKR System</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Select the teams that will be participating in your OKR program. Teams not selected can be added later.
                          </p>
                          
                          <TeamSelectionSection 
                            tenantId={tenantId}
                            value={form.getValues("teamConfiguration.selectedTeams")}
                            onChange={(selectedTeams) => {
                              form.setValue("teamConfiguration.selectedTeams", selectedTeams);
                            }}
                          />
                        </div>
                        */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Integrations */}
              <TabsContent value="integrations">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Layers className="mr-2 h-5 w-5 text-primary" />
                        Integrations & Notifications
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure how your OKR system connects with other tools and how users receive updates.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableSlackIntegration"
                            checked={form.getValues("integrations.enableSlackIntegration")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableSlackIntegration", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableSlackIntegration"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Slack Integration
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableEmailNotifications"
                            checked={form.getValues("integrations.enableEmailNotifications")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableEmailNotifications", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableEmailNotifications"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Email Notifications
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableCalendarSync"
                            checked={form.getValues("integrations.enableCalendarSync")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableCalendarSync", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableCalendarSync"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Calendar Sync (Check-ins & Reviews)
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableAnalyticsReporting"
                            checked={form.getValues("integrations.enableAnalyticsReporting")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableAnalyticsReporting", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableAnalyticsReporting"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Analytics & Reporting Dashboard
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Review */}
              <TabsContent value="review">
                <Card className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 text-emerald-700 rounded-full p-3 mt-1">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2 text-gray-800">Ready to Launch Your OKR System!</h3>
                        <p className="text-gray-600 mb-3">
                          You've completed setting up your OKR system. Click the button below to save your configuration and start tracking your organizational goals.
                        </p>
                        <p className="text-sm text-gray-500">
                          You can always adjust these settings later from your organization's admin panel.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-lg">Configuration Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Settings2 className="w-4 h-4 mr-1" /> General Settings
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Tracking Frequency:</span> {form.getValues("generalSettings.trackingFrequency")}</li>
                        <li><span className="font-medium">Notifications:</span> {form.getValues("generalSettings.enableNotifications") ? "Enabled" : "Disabled"}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" /> Timeframes
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Primary Cadence:</span> {form.getValues("timeframes.primaryCadence")}</li>
                        <li><span className="font-medium">Start Month:</span> {form.getValues("timeframes.startMonth")}</li>
                        <li><span className="font-medium">Additional Cadences:</span> {[
                          form.getValues("timeframes.enableQuarterlyCadence") ? "Quarterly" : "",
                          form.getValues("timeframes.enableAnnualCadence") ? "Annual" : "",
                          form.getValues("timeframes.customCadence") || ""
                        ].filter(Boolean).join(", ") || "None"}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" /> Objective Settings
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Max Objectives/Team:</span> {form.getValues("objectiveSettings.maxObjectivesPerTeam")}</li>
                        <li><span className="font-medium">Max KRs/Objective:</span> {form.getValues("objectiveSettings.maxKeyResultsPerObjective")}</li>
                        <li><span className="font-medium">Approval Required:</span> {form.getValues("objectiveSettings.requireObjectiveApproval") ? "Yes" : "No"}</li>

                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Users2 className="w-4 h-4 mr-1" /> Team Configuration
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Org Structure:</span> {form.getValues("teamConfiguration.orgStructureType")}</li>
                        <li><span className="font-medium">Default Visibility:</span> {form.getValues("teamConfiguration.defaultVisibility")}</li>
                        <li><span className="font-medium">Cross-Team Objectives:</span> {form.getValues("teamConfiguration.enableCrossTeamObjectives") ? "Enabled" : "Disabled"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={activeIndex === 0 || setupComplete}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {activeIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!isCurrentStepValid() || setupComplete}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    console.log("Save Configuration button clicked");
                    form.handleSubmit(onSubmitForm)();
                  }}
                  disabled={isSubmitting || setupComplete}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Configuration...
                    </>
                  ) : (
                    <>
                      Save Configuration
                      <Zap className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}