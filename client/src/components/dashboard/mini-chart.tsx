import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface MiniChartProps {
  data: any[];
  dataKey: string;
  type?: 'area' | 'line' | 'bar';
  color?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  showTooltip?: boolean;
}

export function MiniChart({
  data,
  dataKey,
  type = 'area',
  color = '#6366f1',
  height = 50,
  showGrid = false,
  showAxis = false,
  showTooltip = true,
}: MiniChartProps) {
  const chartProps = {
    data,
    margin: { top: 0, right: 0, left: 0, bottom: 0 },
    height,
  };

  // Tooltip style configuration
  const tooltipStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  const renderChart = (): React.ReactElement => {
    switch (type) {
      case 'area':
        return (
          <AreaChart {...chartProps}>
            {showAxis && (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showTooltip && <Tooltip contentStyle={tooltipStyle} />}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={`${color}20`} 
              strokeWidth={2}
            />
          </AreaChart>
        );
      case 'line':
        return (
          <LineChart {...chartProps}>
            {showAxis && (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showTooltip && <Tooltip contentStyle={tooltipStyle} />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...chartProps}>
            {showAxis && (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showTooltip && <Tooltip contentStyle={tooltipStyle} />}
            <Bar 
              dataKey={dataKey} 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      default:
        // Default to area chart if type is not recognized
        return (
          <AreaChart {...chartProps}>
            {showAxis && (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showTooltip && <Tooltip contentStyle={tooltipStyle} />}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={`${color}20`} 
              strokeWidth={2}
            />
          </AreaChart>
        );
    }
  };

  const chart = renderChart();
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      {chart}
    </ResponsiveContainer>
  );
}

export function MiniSparkline({ 
  data, 
  dataKey, 
  color = '#6366f1', 
  negativeColor = '#ef4444', 
  height = 40 
}: {
  data: any[];
  dataKey: string;
  color?: string;
  negativeColor?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={negativeColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={negativeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill="url(#colorPositive)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GaugeChart({ value, max = 100, color = '#6366f1' }: { value: number; max?: number; color?: string }) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          {/* Background track */}
          <path
            className="stroke-current text-slate-200"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Foreground progress */}
          <path
            className="stroke-current"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${percentage}, 100`}
            style={{ stroke: color }}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Text label */}
          <text 
            x="18" 
            y="20.35" 
            fontSize="8px"
            fontWeight="bold" 
            textAnchor="middle" 
            fill="#1e293b"
          >
            {`${Math.round(percentage)}%`}
          </text>
        </svg>
      </div>
    </div>
  );
}