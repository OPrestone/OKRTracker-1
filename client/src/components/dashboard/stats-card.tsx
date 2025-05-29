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
  iconColor?: string;
  bgColor?: string;
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
  iconColor = "text-primary-600",
  bgColor = "bg-primary-100",
}: StatsCardProps) {
  const showTrend = trend !== undefined;
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h2>
              {subtitle && (
                <span className="text-sm font-medium text-slate-500">{subtitle}</span>
              )}
            </div>
            
            {showTrend && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center px-2 py-1 rounded-full text-xs font-semibold",
                    isPositive 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : isNegative 
                      ? "bg-rose-50 text-rose-700 border border-rose-200" 
                      : "bg-slate-50 text-slate-700 border border-slate-200"
                  )}
                >
                  {isPositive ? (
                    <ArrowUp className="mr-1 h-3 w-3" />
                  ) : isNegative ? (
                    <ArrowDown className="mr-1 h-3 w-3" />
                  ) : null}
                  {isPositive ? "+" : ""}
                  {Math.abs(trend).toFixed(1)}%
                </div>
                {trendLabel && (
                  <span className="text-xs text-slate-500 font-medium">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {icon && (
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-105",
              bgColor,
              iconColor
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {progressBar && (
          <div className="mt-4 space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              ></div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {trendLabel || `${progressValue}% complete`}
            </p>
          </div>
        )}
      </div>
      
      {chart && (
        <div className="px-6 pb-4 -mb-2">
          <div className="rounded-lg overflow-hidden">
            {chart}
          </div>
        </div>
      )}
    </div>
  );
}

export function MiniStatsCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  iconColor = "text-primary-600",
  bgColor = "bg-primary-100"
}: Omit<StatsCardProps, 'chart' | 'progressBar' | 'progressValue' | 'subtitle'>) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-neutral-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">{title}</p>
          <h3 className="text-lg font-semibold text-neutral-900 mt-0.5">{value}</h3>
        </div>
        {icon && (
          <div className={cn("p-2 rounded-full", bgColor, iconColor)}>
            {icon}
          </div>
        )}
      </div>
      
      {trend !== undefined && (
        <div className="mt-2">
          {trendLabel ? (
            <div className="text-xs text-neutral-500">{trendLabel}</div>
          ) : (
            <div 
              className={cn(
                "text-xs inline-flex items-center",
                isPositive ? "text-emerald-600" : 
                isNegative ? "text-rose-600" : 
                "text-neutral-600"
              )}
            >
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : isNegative ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}