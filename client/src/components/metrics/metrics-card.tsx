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
  bgColor?: string;
}

export function MetricsCard({
  title,
  value,
  icon,
  trend,
  chart,
  iconColor = 'text-primary-600',
  bgColor = 'bg-white',
}: MetricsCardProps) {
  const showTrend = trend !== undefined;
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-100">
      <div className="flex justify-between mb-1">
        <div className="text-sm font-medium text-neutral-500">{title}</div>
        {icon && (
          <div className={cn("w-6 h-6", iconColor)}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex flex-col mb-2">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {showTrend && (
          <div className={cn(
            "text-xs font-medium flex items-center mt-1",
            isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-slate-600"
          )}>
            {isPositive ? (
              <>
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                +{Math.abs(trend).toFixed(1)}%
              </>
            ) : isNegative ? (
              <>
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {Math.abs(trend).toFixed(1)}%
              </>
            ) : null}
          </div>
        )}
      </div>
      
      {chart && (
        <div className="mt-1">
          {chart}
        </div>
      )}
    </div>
  );
}