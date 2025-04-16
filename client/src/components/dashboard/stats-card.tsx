import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconClass?: string;
  change?: {
    value: string | number;
    type: "increase" | "decrease";
    label: string;
  };
}

const StatsCard = ({ title, value, icon, iconClass, change }: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("rounded-full p-3 mr-4", iconClass || "bg-blue-100")}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center text-sm">
            <span className={cn(
              "flex items-center",
              change.type === "increase" ? "text-green-500" : "text-red-500"
            )}>
              {change.type === "increase" ? (
                <ArrowUp className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDown className="mr-1 h-4 w-4" />
              )}
              {change.value}
            </span>
            <span className="text-gray-500 ml-2">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
