import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  chart?: React.ReactNode;
  iconColor?: string;
}

export function MetricsCard({
  title,
  value,
  icon,
  trend,
  chart,
  iconColor = 'text-primary',
}: MetricsCardProps) {
  const showTrend = trend !== undefined;
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
      <div className="flex items-center gap-3 mb-2">
        {icon && <div className={cn("w-8 h-8", iconColor)}>{icon}</div>}
        <div className="text-sm font-medium text-neutral-500">{title}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-2xl font-semibold text-neutral-900">{value}</div>
        {showTrend && (
          <div className={cn(
            "text-xs font-medium",
            isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-neutral-600"
          )}>
            {isPositive ? (
              <div className="flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                +{Math.abs(trend).toFixed(1)}%
              </div>
            ) : isNegative ? (
              <div className="flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {Math.abs(trend).toFixed(1)}%
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {chart && (
        <div className="mt-3">
          {chart}
        </div>
      )}
    </div>
  );
}