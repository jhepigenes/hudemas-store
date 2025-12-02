'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import AnalyticsChart from '../../components/AnalyticsChart';
import { Eye, ShoppingBag, TrendingUp, Users } from 'lucide-react';

interface AnalyticsEvent {
    id: string;
    event_name: string;
    user_id: string | null;
    created_at: string;
    data: Record<string, unknown>;
    user_agent: string | null;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        totalViews: 0,
        totalPurchases: 0,
        conversionRate: 0,
        activeUsers: 0
    });
    const [selectedMetric, setSelectedMetric] = useState<'views' | 'purchases'>('views');
    const [chartData, setChartData] = useState<{ name: string; views: number; purchases: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch events from the last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const { data, error } = await supabase
                    .from('analytics_events')
                    .select('*')
                    .gte('created_at', sevenDaysAgo.toISOString());

                if (error) throw error;

                const events = data as AnalyticsEvent[];

                if (events) {
                    // Calculate totals
                    const views = events.filter(e => e.event_name === 'view_item').length;
                    const purchases = events.filter(e => e.event_name === 'purchase').length;
                    const uniqueUsers = new Set(events.map(e => e.user_id || e.user_agent)).size;

                    setStats({
                        totalViews: views,
                        totalPurchases: purchases,
                        conversionRate: views > 0 ? (purchases / views) * 100 : 0,
                        activeUsers: uniqueUsers
                    });

                    // Process chart data (daily)
                    const dailyData = events.reduce((acc: Record<string, { name: string; views: number; purchases: number }>, event: AnalyticsEvent) => {
                        const date = new Date(event.created_at).toLocaleDateString('en-US', { weekday: 'short' });
                        if (!acc[date]) {
                            acc[date] = { name: date, views: 0, purchases: 0 };
                        }
                        if (event.event_name === 'view_item') acc[date].views++;
                        if (event.event_name === 'purchase') acc[date].purchases++;
                        return acc;
                    }, {});

                    // Sort by day of week is tricky without full date, but for now let's just use the order they appear or simple sort
                    // Better: Create array of last 7 days and fill
                    const days = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        days.push(dayName);
                    }

                    const finalChartData = days.map(day => ({
                        name: day,
                        views: dailyData[day]?.views || 0,
                        purchases: dailyData[day]?.purchases || 0
                    }));

                    setChartData(finalChartData);
                }
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Customer Analytics</h2>
                <p className="text-stone-500">Insights into customer behavior and store performance.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                <div
                    onClick={() => setSelectedMetric('views')}
                    className={`rounded-xl border p-6 shadow-sm transition-all cursor-pointer ${selectedMetric === 'views' ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-stone-200 bg-white hover:border-blue-300 dark:border-stone-800 dark:bg-stone-900'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Product Views</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                {stats.totalViews}
                            </p>
                        </div>
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                            <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setSelectedMetric('purchases')}
                    className={`rounded-xl border p-6 shadow-sm transition-all cursor-pointer ${selectedMetric === 'purchases' ? 'border-green-500 ring-1 ring-green-500 bg-green-50 dark:bg-green-900/10' : 'border-stone-200 bg-white hover:border-green-300 dark:border-stone-800 dark:bg-stone-900'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Purchases</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                {stats.totalPurchases}
                            </p>
                        </div>
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                            <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Conversion Rate</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                {stats.conversionRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Active Users (7d)</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                {stats.activeUsers}
                            </p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/20">
                            <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6">
                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    <AnalyticsChart
                        data={chartData}
                        dataKey={selectedMetric}
                        title={`${selectedMetric === 'views' ? 'Product Views' : 'Purchases'} (Last 7 Days)`}
                        unit=""
                    />
                </div>
            </div>
        </div>
    );
}
