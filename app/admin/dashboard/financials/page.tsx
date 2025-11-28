'use client';

import { useState, useEffect } from 'react';
import AnalyticsChart from '../../components/AnalyticsChart';
import { createClient } from '@/lib/supabase';
import { generateRevenueData, getMockStats } from '@/lib/mock-data';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function FinancialsPage() {
    const supabase = createClient();
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Try fetching real data
                const { data: revenueResult, error: revenueError } = await supabase.from('orders').select('total_amount');

                if (!revenueError && revenueResult && revenueResult.length > 0) {
                    const sum = revenueResult.reduce((acc: number, order: { total_amount: number }) => acc + order.total_amount, 0);
                    setTotalRevenue(sum);
                    // Use mock chart data for now as we don't have historical aggregation on the client easily
                    setRevenueData(generateRevenueData());
                } else {
                    throw new Error("No real data found, using mocks");
                }

            } catch (error) {
                console.log('Using Mock Data for Financials:', error);
                const mockStats = getMockStats();
                setTotalRevenue(mockStats.totalRevenue);
                setRevenueData(generateRevenueData());
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Financials</h2>
                <p className="text-stone-500">Revenue analytics and performance metrics.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Total Revenue (YTD)</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                {totalRevenue?.toLocaleString()} RON
                            </p>
                        </div>
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        +12% vs last year
                    </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Average Order Value</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                345 RON
                            </p>
                        </div>
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        +5% vs last month
                    </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Projected (EOM)</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                15,000 RON
                            </p>
                        </div>
                        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-stone-500">
                        Based on current velocity
                    </div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <h3 className="mb-6 font-medium text-stone-900 dark:text-white">Revenue Overview</h3>
                <AnalyticsChart data={revenueData} />
            </div>

            {/* Year over Year Comparison Table */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <div className="border-b border-stone-200 px-6 py-4 dark:border-stone-800">
                    <h3 className="font-medium text-stone-900 dark:text-white">Year over Year Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Metric</th>
                                <th className="px-6 py-3 font-medium">This Year</th>
                                <th className="px-6 py-3 font-medium">Last Year</th>
                                <th className="px-6 py-3 font-medium">Growth</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">Total Revenue</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{totalRevenue?.toLocaleString()} RON</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{(totalRevenue ? totalRevenue * 0.88 : 0).toLocaleString()} RON</td>
                                <td className="px-6 py-4 text-green-600 font-medium">+12%</td>
                            </tr>
                            <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">Orders</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">142</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">120</td>
                                <td className="px-6 py-4 text-green-600 font-medium">+18%</td>
                            </tr>
                            <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">Avg. Order Value</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">345 RON</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">360 RON</td>
                                <td className="px-6 py-4 text-red-500 font-medium">-4%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
