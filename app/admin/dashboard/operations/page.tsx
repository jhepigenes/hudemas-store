'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, FileText, PackageCheck, Truck, Building2, User, Calendar, Download, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/lib/supabase';
import OrderDetailsModal, { Order, generateAWB, generateInvoice } from '../components/OrderDetailsModal';
import LegacyGLSExport from './LegacyGLSExport';
import CustomerLookup from './CustomerLookup';
import { Badge } from '@/components/ui/badge';

type Tab = 'legacy' | 'customers' | 'new';

function OperationsContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>('legacy');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const { t } = useLanguage();
    const supabase = createClient();

    useEffect(() => {
        if (activeTab === 'new') {
            fetchOrders();
        }
    }, [selectedDate, activeTab]);

    useEffect(() => {
        if (orders.length > 0) {
            applyFilters();
        }
    }, [orders, searchParams]);

    const applyFilters = () => {
        const status = searchParams.get('status');
        const filter = searchParams.get('filter');

        let result = [...orders];

        if (status) {
            result = result.filter(o => o.status === status);
        } else if (filter === 'active') {
            result = result.filter(o => ['pending', 'processing', 'pending_payment'].includes(o.status));
        }

        setFilteredOrders(result);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, items:order_items(*)`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
            setFilteredOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleOrder = (id: string) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const generateAccountantExport = () => {
        const ordersToExport = selectedOrders.length > 0
            ? filteredOrders.filter(o => selectedOrders.includes(o.id))
            : filteredOrders;

        const csvRows = [
            ['Data', 'Numar Factura', 'Client', 'CUI/CNP', 'Valoare Neta', 'TVA', 'Total'],
            ...ordersToExport.map(o => {
                const shippingCost = o.shipping_method === 'easybox' ? 12 : 19;
                const totalWithShipping = o.total + shippingCost;
                const net = (totalWithShipping / 1.19).toFixed(2);
                const vat = (totalWithShipping - (totalWithShipping / 1.19)).toFixed(2);

                const customerName = `${o.customer_details.firstName} ${o.customer_details.lastName}`;
                const clientName = o.customer_details.customerType === 'company' ? o.customer_details.companyName : customerName;
                const cui = o.customer_details.customerType === 'company' ? o.customer_details.vatId : '-';

                return [
                    new Date(o.created_at).toLocaleDateString(),
                    'HUD-' + o.id.slice(0, 8),
                    '"' + clientName + '"',
                    cui,
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
        link.setAttribute("download", `Export_Contabilitate_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const markAsShipped = async (ids: string[]) => {
        try {
            const res = await fetch('/api/admin/orders/ship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds: ids })
            });

            if (!res.ok) throw new Error('API call failed');

            setOrders(prev => prev.map(order =>
                ids.includes(order.id) ? { ...order, status: 'completed' } : order
            ));
            setFilteredOrders(prev => prev.map(order =>
                ids.includes(order.id) ? { ...order, status: 'completed' } : order
            ));
            setSelectedOrders([]);
            alert(`${t.admin.operations.markShipped} (${ids.length}) - Emails Sent!`);
        } catch (error) {
            console.error('Error updating orders:', error);
            alert('Failed to update orders.');
        }
    };

    const handleBulkAction = (action: 'invoice' | 'label' | 'export' | 'shipped') => {
        if (action === 'export') {
            generateAccountantExport();
            return;
        }
        if (selectedOrders.length === 0) return;
        const ordersToProcess = filteredOrders.filter(o => selectedOrders.includes(o.id));

        if (action === 'invoice') {
            ordersToProcess.forEach(o => generateInvoice(o));
            alert(`Generated ${ordersToProcess.length} Invoices`);
        } else if (action === 'label') {
            ordersToProcess.forEach(o => generateAWB(o));
            alert(`Generated ${ordersToProcess.length} AWB Labels`);
        } else if (action === 'shipped') {
            markAsShipped(selectedOrders);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
            case 'processing': return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-50 text-green-800 border-green-200';
            default: return 'bg-stone-100 text-stone-800 border-stone-200';
        }
    };

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            const res = await fetch('/api/admin/orders/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status })
            });

            if (!res.ok) throw new Error('Update failed');

            const updateFn = (list: Order[]) => list.map(o => o.id === orderId ? { ...o, status: status as any } : o);
            setOrders(prev => updateFn(prev));
            setFilteredOrders(prev => updateFn(prev));

            if (viewOrder && viewOrder.id === orderId) {
                setViewOrder({ ...viewOrder, status: status as any });
            }
            alert(`Order status updated to ${status}`);
        } catch (e) {
            console.error('Error updating status:', e);
            alert('Failed to update order status.');
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Tab Selector */}
            <div className="flex gap-4 border-b border-stone-200 dark:border-stone-800">
                <button
                    onClick={() => setActiveTab('legacy')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'legacy'
                        ? 'border-stone-900 text-stone-900 dark:border-white dark:text-white'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                        }`}
                >
                    GLS Export
                </button>
                <button
                    onClick={() => setActiveTab('customers')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'customers'
                        ? 'border-stone-900 text-stone-900 dark:border-white dark:text-white'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                        }`}
                >
                    Customer Database
                </button>
                <button
                    onClick={() => setActiveTab('new')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'new'
                        ? 'border-stone-900 text-stone-900 dark:border-white dark:text-white'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                        }`}
                >
                    New Store Orders
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                </button>
            </div>

            {/* Legacy Tab */}
            {activeTab === 'legacy' && (
                <LegacyGLSExport />
            )}

            {/* Customer Database Tab */}
            {activeTab === 'customers' && (
                <CustomerLookup />
            )}

            {/* New Store Tab - Coming Soon */}
            {activeTab === 'new' && (
                <div className="space-y-8">
                    {/* Coming Soon Banner */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-amber-800 dark:text-amber-400">New Store Integration - Coming Soon</h3>
                            <p className="text-amber-700 dark:text-amber-500 text-sm mt-1">
                                This section will manage orders from the new Next.js store after migration.
                                For now, use the <strong>Legacy GLS Export</strong> tab for hudemas.ro orders.
                            </p>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-50 pointer-events-none">
                        <div>
                            <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white">{t.admin.operations.title}</h2>
                            <p className="text-stone-500">{t.admin.operations.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm">
                            <Calendar className="h-4 w-4 text-stone-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-stone-900 dark:text-white"
                                disabled
                            />
                        </div>
                    </div>

                    {/* Disabled Order List Preview */}
                    <div className="opacity-50 pointer-events-none">
                        <div className="sticky top-28 z-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-stone-600 dark:text-stone-300">0 Selected</span>
                                <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />
                                <div className="flex gap-2">
                                    <button disabled className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-100 text-stone-900 cursor-not-allowed">
                                        <Truck className="h-3.5 w-3.5" /> Labels
                                    </button>
                                    <button disabled className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-100 text-stone-900 cursor-not-allowed">
                                        <FileText className="h-3.5 w-3.5" /> Invoices
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="text-center py-12 text-stone-500 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800 mt-4">
                            No orders in new store yet. Orders will appear here after migration.
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {viewOrder && (
                <OrderDetailsModal
                    order={viewOrder}
                    onClose={() => setViewOrder(null)}
                    onUpdateStatus={handleUpdateStatus}
                    onRefund={async (orderId) => {
                        if (!confirm('Refund this order? Action is irreversible.')) return;
                        try {
                            const res = await fetch('/api/admin/orders/refund', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId })
                            });
                            const data = await res.json();
                            if (res.ok) {
                                alert('Refund successful!');
                                setViewOrder({ ...viewOrder, status: 'refunded' } as any);
                                fetchOrders();
                            } else {
                                alert(`Refund failed: ${data.error}`);
                            }
                        } catch (e) {
                            console.error(e);
                            alert('Refund failed.');
                        }
                    }}
                />
            )}
        </div>
    );
}

export default function DailyOperationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-96">Loading operations...</div>}>
            <OperationsContent />
        </Suspense>
    );
}