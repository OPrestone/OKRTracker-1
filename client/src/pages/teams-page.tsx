import { useQuery } from "@tanstack/react-query";
import { Team } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  UserPlus, 
  Users 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamsPage() {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  if (error) {
    toast({
      title: "Error loading teams",
      description: error.message,
      variant: "destructive",
    });
  }

  // Define table columns
  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "icon",
      header: "",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Building size={18} />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Team Name",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <div className="font-medium">{team.name}</div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div className="max-w-[300px] truncate">
            {description || "No description provided"}
          </div>
        );
      },
    },
    {
      accessorKey: "ownerId",
      header: "Owner",
      cell: ({ row }) => {
        const ownerId = row.getValue("ownerId") as number;
        return (
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback className="bg-primary/10 text-primary">
                {ownerId ? `U${ownerId}` : "?"}
              </AvatarFallback>
            </Avatar>
            <span>{ownerId || "Unassigned"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "members",
      header: "Members",
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Users size={14} />
            <span>0 members</span>
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const team = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  // Navigate to team details page
                  console.log("View team:", team.id);
                }}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  // Open edit dialog
                  console.log("Edit team:", team.id);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit team
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  // Open add members dialog
                  console.log("Add members to team:", team.id);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive"
                onClick={() => {
                  setSelectedTeam(team);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              Manage your organization's teams and their members
            </p>
          </div>
          <Button onClick={() => console.log("Create team")}>
            Create Team
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={teams || []}
            searchColumn="name"
            searchPlaceholder="Search teams..."
            tableTitle="All Teams"
          />
        )}
      </div>
    </DashboardLayout>
  );
}