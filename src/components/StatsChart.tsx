// Stats chart component with recharts integration
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Chart color palette - using CSS variables for theme consistency
const CHART_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2, 173 58% 39%))',
    'hsl(var(--chart-3, 197 37% 24%))',
    'hsl(var(--chart-4, 43 74% 66%))',
    'hsl(var(--chart-5, 27 87% 67%))',
];

// Fallback colors for pie chart
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ChartDataPoint {
    name: string;
    [key: string]: string | number;
}

interface StatsChartProps {
    /** Chart title */
    title: string;
    /** Chart description */
    description?: string;
    /** Data points for the chart */
    data: ChartDataPoint[];
    /** Type of chart to render */
    type?: 'line' | 'area' | 'bar' | 'pie';
    /** Data keys to display (for multi-series charts) */
    dataKeys?: string[];
    /** X-axis data key */
    xAxisKey?: string;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Chart height */
    height?: number;
    /** Show legend */
    showLegend?: boolean;
    /** Show grid lines */
    showGrid?: boolean;
    /** Custom colors for data series */
    colors?: string[];
    /** Additional class name */
    className?: string;
    /** Empty state message */
    emptyMessage?: string;
}

/**
 * StatsChart - Reusable chart component for data visualization
 *
 * Features:
 * - Multiple chart types (line, area, bar, pie)
 * - Responsive design
 * - Loading states with skeleton
 * - Theme-aware colors
 * - Tooltips and legends
 * - Empty state handling
 */
export function StatsChart({
    title,
    description,
    data,
    type = 'line',
    dataKeys = ['value'],
    xAxisKey = 'name',
    isLoading = false,
    height = 300,
    showLegend = true,
    showGrid = true,
    colors = CHART_COLORS,
    className,
    emptyMessage = 'No data available',
}: StatsChartProps) {
    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-foreground mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p
                            key={`item-${index}`}
                            className="text-sm"
                            style={{ color: entry.color }}
                        >
                            {entry.name}: {typeof entry.value === 'number'
                                ? entry.value.toLocaleString()
                                : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Render loading skeleton
    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    {description && <Skeleton className="h-4 w-60 mt-1" />}
                </CardHeader>
                <CardContent>
                    <Skeleton className="w-full" style={{ height }} />
                </CardContent>
            </Card>
        );
    }

    // Render empty state
    if (!data || data.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div
                        className="flex items-center justify-center text-muted-foreground"
                        style={{ height }}
                    >
                        {emptyMessage}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Render chart based on type
    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
        };

        switch (type) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        {showGrid && (
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted"
                            />
                        )}
                        <XAxis
                            dataKey={xAxisKey}
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                        {dataKeys.map((key, index) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                );

            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {showGrid && (
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted"
                            />
                        )}
                        <XAxis
                            dataKey={xAxisKey}
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                        {dataKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={colors[index % colors.length]}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                );

            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={dataKeys[0]}
                            nameKey={xAxisKey}
                            label={(props) =>
                                `${props.name || ''} ${(((props.percent as number) || 0) * 100).toFixed(0)}%`
                            }
                        >
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                    </PieChart>
                );

            case 'line':
            default:
                return (
                    <LineChart {...commonProps}>
                        {showGrid && (
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted"
                            />
                        )}
                        <XAxis
                            dataKey={xAxisKey}
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            className="text-muted-foreground"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                        {dataKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={{ fill: colors[index % colors.length], r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                );
        }
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    {renderChart()}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

/**
 * MiniChart - Smaller inline chart for dashboard stats
 */
interface MiniChartProps {
    data: ChartDataPoint[];
    dataKey?: string;
    color?: string;
    height?: number;
    className?: string;
}

export function MiniChart({
    data,
    dataKey = 'value',
    color = 'hsl(var(--primary))',
    height = 40,
    className,
}: MiniChartProps) {
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className={cn('w-full', className)}>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        fill={color}
                        fillOpacity={0.2}
                        strokeWidth={1.5}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
