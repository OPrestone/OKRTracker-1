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
    <div className="bg-white rounded-lg shadow p-5 border border-neutral-100">
      <div className="flex items-center">
        {icon && (
          <div className={cn("p-3 rounded-full", bgColor, iconColor)}>
            {icon}
          </div>
        )}
        <div className={icon ? "ml-4" : ""}>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <div className="flex items-baseline">
            <h2 className="text-xl font-semibold text-neutral-900">{value}</h2>
            {subtitle && (
              <span className="ml-1 text-sm text-neutral-500">{subtitle}</span>
            )}
          </div>
          {showTrend && (
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-slate-600"
                )}
              >
                {isPositive ? (
                  <ArrowUp className="mr-1 h-3 w-3" />
                ) : isNegative ? (
                  <ArrowDown className="mr-1 h-3 w-3" />
                ) : null}
                {isPositive ? "+" : ""}
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="ml-1.5 text-xs text-neutral-500">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {(progressBar || chart) && (
        <div className="mt-3">
          {progressBar && (
            <>
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                ></div>
              </div>
              <p className="text-xs text-neutral-500 mt-1.5">
                {trendLabel || `${progressValue}% complete`}
              </p>
            </>
          )}
          
          {chart && <div className="mt-2">{chart}</div>}
        </div>
      )}
    </div>
  );
}

export function MiniStatsCard({
  title,
  value,
  trend,
  icon,
  iconColor = "text-primary-600",
  bgColor = "bg-primary-100"
}: Omit<StatsCardProps, 'chart' | 'progressBar' | 'progressValue' | 'subtitle' | 'trendLabel'>) {
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
        </div>
      )}
    </div>
  );
}