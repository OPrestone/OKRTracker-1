import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  chart?: React.ReactNode;
  progressBar?: boolean;
  progressValue?: number;
}

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  chart,
  progressBar,
  progressValue = 0,
}: StatsCardProps) {
  const showTrend = trend !== undefined;
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          {showTrend && (
            <div 
              className={cn(
                "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                isPositive ? "text-emerald-700 bg-emerald-50" : 
                isNegative ? "text-rose-700 bg-rose-50" : 
                "text-slate-700 bg-slate-100"
              )}
            >
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : isNegative ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {value}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500">
                {subtitle}
              </div>
            )}
          </div>
          {icon && (
            <div className="mt-1">
              {icon}
            </div>
          )}
        </div>
        
        {progressBar && (
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              />
            </div>
            {trendLabel && (
              <div className="text-xs text-slate-500 mt-1">
                {trendLabel}
              </div>
            )}
          </div>
        )}
        
        {chart && (
          <div className="mt-3">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MiniStatsCard({
  title,
  value,
  trend,
  icon
}: Omit<StatsCardProps, 'chart' | 'progressBar' | 'progressValue' | 'subtitle' | 'trendLabel'>) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 mb-1">{title}</p>
            <h3 className="text-lg font-semibold text-slate-900">{value}</h3>
          </div>
          {icon && (
            <div className="h-8 w-8 flex items-center justify-center rounded-md bg-slate-100">
              {icon}
            </div>
          )}
        </div>
        
        {trend !== undefined && (
          <div className="mt-2">
            <div 
              className={cn(
                "text-xs inline-flex items-center",
                isPositive ? "text-emerald-600" : 
                isNegative ? "text-rose-600" : 
                "text-slate-600"
              )}
            >
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : isNegative ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}