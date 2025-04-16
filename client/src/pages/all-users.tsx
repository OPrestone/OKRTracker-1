import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ShieldCheck,
  Mail,
  Phone,
  Building
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Sample user data
const sampleUsers = [
  {
    id: 1,
    username: "johndoe",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "admin",
    department: "Executive",
    status: "active",
    lastActive: "Today at 10:30 AM",
    phone: "+1 (555) 123-4567",
    location: "New York, NY"
  },
  {
    id: 2,
    username: "janedoe",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    role: "manager",
    department: "Marketing",
    status: "active",
    lastActive: "Today at 9:45 AM",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA"
  },
  {
    id: 3,
    username: "bobsmith",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob.smith@example.com",
    role: "user",
    department: "Engineering",
    status: "active",
    lastActive: "Yesterday at 4:20 PM",
    phone: "+1 (555) 345-6789",
    location: "Austin, TX"
  },
  {
    id: 4,
    username: "alicejones",
    firstName: "Alice",
    lastName: "Jones",
    email: "alice.jones@example.com",
    role: "user",
    department: "Sales",
    status: "active",
    lastActive: "Today at 8:15 AM",
    phone: "+1 (555) 456-7890",
    location: "Chicago, IL"
  },
  {
    id: 5,
    username: "charliebrown",
    firstName: "Charlie",
    lastName: "Brown",
    email: "charlie.brown@example.com",
    role: "user",
    department: "Customer Success",
    status: "inactive",
    lastActive: "2 weeks ago",
    phone: "+1 (555) 567-8901",
    location: "Boston, MA"
  },
  {
    id: 6,
    username: "emilydavis",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@example.com",
    role: "manager",
    department: "Product",
    status: "active",
    lastActive: "Today at 11:05 AM",
    phone: "+1 (555) 678-9012",
    location: "Seattle, WA"
  },
  {
    id: 7,
    username: "michaelwilson",
    firstName: "Michael",
    lastName: "Wilson",
    email: "michael.wilson@example.com",
    role: "user",
    department: "Finance",
    status: "active",
    lastActive: "Yesterday at 2:30 PM",
    phone: "+1 (555) 789-0123",
    location: "Miami, FL"
  }
];

export default function AllUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // For the real app, use this query
  // const { data: users, isLoading } = useQuery<User[]>({
  //   queryKey: ["/api/users"],
  // });

  // Using sample data for now
  const isLoading = false;
  const users = sampleUsers;
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? 
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge> : 
      <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
  };

  return (
    <DashboardLayout title="All Users">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600">View and manage all users in the system</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {`${user.firstName[0]}${user.lastName[0]}`}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center text-gray-700">
                            <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-gray-600 mt-1">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {user.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-1.5 text-gray-400" />
                          <span>{user.department}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{user.location}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{user.lastActive}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `No users match "${searchTerm}"` : "Add users to get started"}
              </p>
              <Button 
                className="mt-4"
                variant="outline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
