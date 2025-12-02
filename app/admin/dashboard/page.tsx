'use client';

import Link from 'next/link';
import { DollarSign, ShoppingBag, Users, ArrowUpRight, Printer } from 'lucide-react';
import AnalyticsChart from '../components/AnalyticsChart';
import ShippingManager from '../components/ShippingManager';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { generateMockOrders, generateRevenueData, getMockStats, MockOrder } from '@/lib/mock-data';
import OrderDetailsModal, { Order, generateAWB } from './components/OrderDetailsModal';


export default function DashboardOverview() {
    const supabase = createClient();
    const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
    const [activeOrders, setActiveOrders] = useState<number | null>(null);
    const [marketplaceSellers, setMarketplaceSellers] = useState<number | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Try fetching real data
                const { data: revenueResult, error: revenueError } = await supabase.from('orders').select('total');
                const { count: activeOrdersCount, error: ordersError } = await supabase.from('orders').select('*', { count: 'exact' }).in('status', ['pending', 'processing']);
                const { count: approvedSellersCount, error: sellersError } = await supabase.from('artists').select('*', { count: 'exact' }).eq('status', 'approved');
                const { data: ordersData, error: recentOrdersError } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*)')
                    .order('created_at', { ascending: false })
                    .limit(5);

                const hasRealData = !revenueError && !ordersError && !sellersError && !recentOrdersError && ordersData && ordersData.length > 0;

                if (hasRealData) {
                    const sum = revenueResult ? revenueResult.reduce((acc: number, order: { total: number }) => acc + order.total, 0) : 0;
                    setTotalRevenue(sum);
                    setActiveOrders(activeOrdersCount);
                    setMarketplaceSellers(approvedSellersCount);
                    // Map real orders to display format
                    setRecentOrders(ordersData.map((o: any) => {
                        const customerName = o.customer_details ? `${o.customer_details.firstName} ${o.customer_details.lastName}` : 'Unknown';
                        const customerEmail = o.customer_details?.email || o.user_email || 'Guest';
                        return {
                            ...o,
                            // items already present from join
                            user_email: customerName !== 'Unknown' ? `${customerName} (${customerEmail})` : customerEmail,
                            total: o.total // Ensure total matches interface
                        };
                    }));

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
                // @ts-ignore - Mock data mapping simplification for demo
                setRecentOrders(mocks.map(m => ({
                    id: m.id,
                    total: m.total,
                    status: m.status as any,
                    created_at: m.date,
                    user_email: m.customer_name,
                    items: [], // Empty items for mock to avoid crash
                    customer_details: { firstName: m.customer_name.split(' ')[0], lastName: m.customer_name.split(' ')[1] || '', email: 'test@test.com', phone: '', address: '', city: '', county: '', customerType: 'private' },
                    shipping_method: 'fan',
                    payment_method: 'card',
                    currency: 'RON'
                })));

                setRevenueData(generateRevenueData());
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const stats = [
        { name: 'Total Revenue', value: totalRevenue !== null ? `${totalRevenue.toFixed(2)} RON` : 'Loading...', change: 'Total Lifetime', icon: DollarSign, link: '/admin/dashboard/financials' },
        { name: 'Weekly Orders', value: activeOrders !== null ? `${activeOrders}` : 'Loading...', change: '+12% vs last week', icon: ShoppingBag, link: '/admin/dashboard/operations?filter=active' },
        { name: 'Pending Shipments', value: activeOrders !== null ? `${activeOrders}` : 'Loading...', change: 'Needs attention', icon: Printer, link: '/admin/dashboard/operations?status=pending' },
        { name: 'Marketplace Sellers', value: marketplaceSellers !== null ? `${marketplaceSellers}` : 'Loading...', change: '+2 this week', icon: Users, link: '/admin/dashboard/marketplace' },
    ];

    const handlePrintLabel = (orderId: string) => {
        alert(`Generating AWB for ${orderId} via FanCourier API... (Mock)\n\nIn production, this would download the PDF label.`);
    };

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));

            // Also update selected order if open
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
            }

            // Refresh stats slightly delayed or just decrement pending count locally? 
            // For simplicity, just local update is fine for now.
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((item) => (
                    <Link href={item.link} key={item.name} className="block group">
                        <div className="bg-white/60 dark:bg-stone-900/60 backdrop-blur-md p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 group-hover:shadow-lg group-hover:border-stone-300 dark:group-hover:border-stone-700 transition-all duration-300 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg group-hover:bg-stone-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-stone-900 transition-colors duration-300">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                                    {item.change}
                                </span>
                            </div>
                            <h3 className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">{item.name}</h3>
                            <p className="text-3xl font-serif font-medium text-stone-900 dark:text-white mt-2">{item.value}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <AnalyticsChart data={revenueData} />
                    <ShippingManager />
                </div>
                <div className="space-y-8">
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-lg text-stone-900 dark:text-white">Recent Orders</h3>
                            <Link href="/admin/dashboard/operations" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1">
                                View All <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-stone-100 dark:hover:border-stone-800"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate max-w-[150px]">{order.user_email}</p>
                                        <p className="text-xs text-stone-500">ID: {order.id.slice(0, 8)}...</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-stone-900 dark:text-white">{order.total} {order.currency}</p>
                                        <p className={`text-xs capitalize ${order.status === 'completed' ? 'text-green-600' :
                                                order.status === 'pending' ? 'text-amber-600' : 'text-stone-500'
                                            }`}>{order.status}</p>
                                    </div>
                                </div>
                            ))}
                            {recentOrders.length === 0 && <p className="text-center text-stone-500 text-sm py-4">No recent orders.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateStatus={handleUpdateStatus}
                />
            )}
        </div>
    );
}