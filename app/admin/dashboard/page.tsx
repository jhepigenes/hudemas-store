'use client';

import { DollarSign, ShoppingBag, Users, ArrowUpRight, Printer } from 'lucide-react';
import AnalyticsChart from '../components/AnalyticsChart';
import ShippingManager from '../components/ShippingManager';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { generateMockOrders, generateRevenueData, getMockStats, MockOrder } from '@/lib/mock-data';

interface Order {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    user_email: string;
    items: number;
}

export default function DashboardOverview() {
    const supabase = createClient();
    const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
    const [activeOrders, setActiveOrders] = useState<number | null>(null);
    const [marketplaceSellers, setMarketplaceSellers] = useState<number | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Try fetching real data
                const { data: revenueResult, error: revenueError } = await supabase.from('orders').select('total_amount');
                const { count: activeOrdersCount, error: ordersError } = await supabase.from('orders').select('*', { count: 'exact' }).in('status', ['pending', 'processing']);
                const { count: approvedSellersCount, error: sellersError } = await supabase.from('artists').select('*', { count: 'exact' }).eq('status', 'approved');
                const { data: ordersData, error: recentOrdersError } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);

                const hasRealData = !revenueError && !ordersError && !sellersError && !recentOrdersError && ordersData && ordersData.length > 0;

                if (hasRealData) {
                    const sum = revenueResult ? revenueResult.reduce((acc: number, order: { total_amount: number }) => acc + order.total_amount, 0) : 0;
                    setTotalRevenue(sum);
                    setActiveOrders(activeOrdersCount);
                    setMarketplaceSellers(approvedSellersCount);
                    // Map real orders to display format
                    setRecentOrders(ordersData.map((o: any) => ({ ...o, items: 1, user_email: o.user_email || 'real_user@example.com' })));

                    // Use mock chart data for now as we don't have historical aggregation on the client easily
                    setRevenueData(generateRevenueData());
                } else {
                    throw new Error("No real data found, using mocks");
                }

            } catch (error) {
                console.log('Using Mock Data for Dashboard:', error);
                const mockStats = getMockStats();
                setTotalRevenue(mockStats.totalRevenue);
                setActiveOrders(mockStats.activeOrders);
                setMarketplaceSellers(mockStats.totalCustomers); // Using customers as proxy for sellers/users

                const mocks = generateMockOrders(5);
                setRecentOrders(mocks.map(m => ({
                    id: m.id,
                    total_amount: m.total,
                    status: m.status,
                    created_at: m.date,
                    user_email: m.customer_name, // displaying name instead of email for mock
                    items: m.items
                })));

                setRevenueData(generateRevenueData());
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const stats = [
        { name: 'Weekly Orders', value: activeOrders !== null ? `${activeOrders}` : 'Loading...', change: '+12% vs last week', icon: ShoppingBag },
        { name: 'Pending Shipments', value: activeOrders !== null ? `${activeOrders}` : 'Loading...', change: 'Needs attention', icon: Printer },
        { name: 'Marketplace Sellers', value: marketplaceSellers !== null ? `${marketplaceSellers}` : 'Loading...', change: '+2 this week', icon: Users },
    ];

    const handlePrintLabel = (orderId: string) => {
        alert(`Generating AWB for ${orderId} via FanCourier API... (Mock)\n\nIn production, this would download the PDF label.`);
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
            <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Overview</h2>
                <p className="text-stone-500">Welcome back. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-stone-500">{stat.name}</p>
                                    <p className="mt-2 text-3xl font-semibold text-stone-900 dark:text-white">{stat.value}</p>
                                </div>
                                <div className="rounded-full bg-stone-100 p-3 dark:bg-stone-800">
                                    <Icon className="h-6 w-6 text-stone-900 dark:text-white" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-green-600">
                                <ArrowUpRight className="mr-1 h-4 w-4" />
                                {stat.change}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Analytics & Shipping Section */}
            <div className="grid grid-cols-1 gap-6">
                <ShippingManager />
            </div>

            {/* Recent Orders Table */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <div className="border-b border-stone-200 px-6 py-4 dark:border-stone-800">
                    <h3 className="font-medium text-stone-900 dark:text-white">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Order ID</th>
                                <th className="px-6 py-3 font-medium">Customer</th>
                                <th className="px-6 py-3 font-medium">Items</th>
                                <th className="px-6 py-3 font-medium">Total</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                        <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">{order.id}</td>
                                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{order.user_email || 'N/A'}</td>
                                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{order.items}</td>
                                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{order.total_amount.toFixed(2)} RON</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${order.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400' :
                                                    order.status === 'pending' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500' :
                                                        'bg-stone-100 text-stone-600 ring-stone-500/10 dark:bg-stone-800 dark:text-stone-400'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-stone-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handlePrintLabel(order.id)}
                                                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900"
                                            >
                                                <Printer className="h-3 w-3" /> AWB
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-stone-500">No recent orders.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}