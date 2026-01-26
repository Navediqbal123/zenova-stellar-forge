import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample data for demonstration
const generateChartData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  return months.map((month, index) => ({
    name: month,
    downloads: Math.floor(50000 + Math.random() * 100000 + index * 15000),
    developers: Math.floor(20 + Math.random() * 30 + index * 5),
    apps: Math.floor(50 + Math.random() * 40 + index * 8),
  }));
};

const chartData = generateChartData();

interface TrendIndicatorProps {
  value: string;
  isPositive?: boolean;
  size?: 'sm' | 'md';
}

export function TrendIndicator({ value, isPositive = true, size = 'sm' }: TrendIndicatorProps) {
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold",
        size === 'sm' && "text-xs",
        size === 'md' && "text-sm",
        isPositive 
          ? "bg-success/20 text-success" 
          : "bg-destructive/20 text-destructive"
      )}
    >
      <Icon className={cn(size === 'sm' ? "w-3 h-3" : "w-4 h-4")} />
      <span>{value}</span>
    </motion.div>
  );
}

interface StatsChartProps {
  type?: 'downloads' | 'developers' | 'apps';
  height?: number;
}

export function StatsChart({ type = 'downloads', height = 200 }: StatsChartProps) {
  const dataKey = type;
  const colorVar = type === 'downloads' ? 'hsl(var(--primary))' : 
                   type === 'developers' ? 'hsl(var(--secondary))' : 
                   'hsl(var(--success))';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorVar} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colorVar} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => 
              value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colorVar}
            strokeWidth={2}
            fill={`url(#gradient-${type})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

interface MiniChartProps {
  data?: number[];
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

export function MiniChart({ data = [30, 40, 35, 50, 49, 60, 70, 91, 125], color = 'primary' }: MiniChartProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  const colorVar = `hsl(var(--${color}))`;

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={colorVar}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
