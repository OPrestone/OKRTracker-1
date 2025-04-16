import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface CheckIn {
  id: number;
  user: {
    name: string;
    role: string;
    avatar?: string;
    initials: string;
  };
  team: string;
  objective: string;
  progress: number;
  date: string;
}

interface CheckInTableProps {
  checkIns: CheckIn[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewCheckIn: (id: number) => void;
}

const CheckInTable = ({
  checkIns,
  totalCount,
  currentPage,
  onPageChange,
  onViewCheckIn
}: CheckInTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">User</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Objective</TableHead>
              <TableHead>Current Progress</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkIns.map((checkIn) => (
              <TableRow key={checkIn.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={checkIn.user.avatar} alt={checkIn.user.name} />
                      <AvatarFallback>{checkIn.user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{checkIn.user.name}</div>
                      <div className="text-sm text-gray-500">{checkIn.user.role}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">{checkIn.team}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">{checkIn.objective}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-full max-w-xs">
                      <Progress value={checkIn.progress} className="h-1.5 mr-2" />
                    </div>
                    <span className="text-sm font-medium ml-2">{checkIn.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {checkIn.date}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="link" 
                    className="text-primary"
                    onClick={() => onViewCheckIn(checkIn.id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {checkIns.length} of {totalCount} check-ins
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {/* Add page numbers here if needed */}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default CheckInTable;
