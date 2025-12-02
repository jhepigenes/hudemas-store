'use client';

import { useState, useEffect } from 'react';
import AnalyticsChart from '../../components/AnalyticsChart';
import { createClient } from '@/lib/supabase';
import { generateRevenueData, getMockStats } from '@/lib/mock-data';
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';

export default function FinancialsPage() {
    const supabase = createClient();
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'aov'>('revenue');

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

    const generateAccountantExport = async () => {
        try {
            let query = supabase
                .from('orders')
                .select('*, order_items(*), customer_details:customer_details')
                .order('created_at', { ascending: false });

            if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
            if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

            const { data: orders } = await query;

            if (!orders || orders.length === 0) {
                alert('No orders to export for the selected period.');
                return;
            }

            const csvRows = [
                ['Data', 'Numar Factura', 'Client', 'CUI/CNP', 'Valoare Neta', 'TVA', 'Total'],
                ...orders.map((o: any) => { // Use any to avoid strict type checking against Order interface locally defined elsewhere
                    const shippingCost = o.shipping_method === 'easybox' ? 12 : 19;
                    const totalWithShipping = o.total + shippingCost;
                    const net = (totalWithShipping / 1.19).toFixed(2);
                    const vat = (totalWithShipping - (totalWithShipping / 1.19)).toFixed(2);

                    const details = o.customer_details || {};
                    const customerName = `${details.firstName || ''} ${details.lastName || ''}`.trim() || 'Guest';
                    const clientName = details.customerType === 'company' ? details.companyName : customerName;
                    const cui = details.customerType === 'company' ? details.vatId : '-';

                    return [
                        new Date(o.created_at).toLocaleDateString(),
                        'HUD-' + o.id.slice(0, 8),
                        '"' + (clientName || 'Unknown') + '"',
                        cui || '-',
                        net,
                        vat,
                        totalWithShipping.toFixed(2)
                    ];
                })
            ];

            const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Export_Contabilitate_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Export failed", e);
            alert("Failed to generate export.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Financials</h2>
                    <p className="text-stone-500">Revenue analytics and performance metrics.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-md border-stone-300 text-sm dark:bg-stone-800 dark:border-stone-700"
                        />
                        <span className="text-stone-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="rounded-md border-stone-300 text-sm dark:bg-stone-800 dark:border-stone-700"
                        />
                    </div>
                    <button
                        onClick={generateAccountantExport}
                        className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 transition-colors"
                    >
                        <Download className="h-4 w-4" /> Export Accounting CSV
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div
                    onClick={() => setSelectedMetric('revenue')}
                    className={`cursor-pointer rounded-xl border bg-white p-6 shadow-sm transition-all dark:bg-stone-900 ${selectedMetric === 'revenue' ? 'border-stone-900 ring-1 ring-stone-900 dark:border-white dark:ring-white' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'}`}
                >
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

                <div
                    onClick={() => setSelectedMetric('aov')}
                    className={`cursor-pointer rounded-xl border bg-white p-6 shadow-sm transition-all dark:bg-stone-900 ${selectedMetric === 'aov' ? 'border-stone-900 ring-1 ring-stone-900 dark:border-white dark:ring-white' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'}`}
                >
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

                <div
                    onClick={() => setSelectedMetric('orders')}
                    className={`cursor-pointer rounded-xl border bg-white p-6 shadow-sm transition-all dark:bg-stone-900 ${selectedMetric === 'orders' ? 'border-stone-900 ring-1 ring-stone-900 dark:border-white dark:ring-white' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-stone-500">Total Orders</p>
                            <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">
                                142
                            </p>
                        </div>
                        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        +18% vs last year
                    </div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <AnalyticsChart
                    data={revenueData}
                    dataKey={selectedMetric}
                    title={selectedMetric === 'revenue' ? 'Weekly Revenue' : selectedMetric === 'orders' ? 'Weekly Orders' : 'Average Order Value'}
                    unit={selectedMetric === 'orders' ? '' : 'RON'}
                />
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
