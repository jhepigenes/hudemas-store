'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, FileText, PackageCheck, Truck, Building2, User, Filter, Calendar, Download } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/lib/supabase';
import OrderDetailsModal, { Order, generateAWB, generateInvoice } from '../components/OrderDetailsModal';

function OperationsContent() {
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const { t } = useLanguage();
    const supabase = createClient();

    useEffect(() => {
        fetchOrders();
    }, [selectedDate]);

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
                .select(`
                    *,
                    items:order_items(*)
                `)
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

    // ... (keep existing handlers: toggleOrder, toggleAll, etc.)

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

            const data = await res.json();

            // Optimistic update
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    ids.includes(order.id)
                        ? { ...order, status: 'completed' }
                        : order
                )
            );
            // Also update filtered list
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
        <div className="space-y-8 pb-20">
            {/* Header and Date Picker... (same as before) */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white">{t.admin.operations.title}</h2>
                    <p className="text-stone-500">{t.admin.operations.subtitle}</p>
                    {/* Active Filter Badge */}
                    {(searchParams.get('status') || searchParams.get('filter')) && (
                        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Filter: {searchParams.get('status') || searchParams.get('filter')}
                        </span>
                    )}
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm">
                    <Calendar className="h-4 w-4 text-stone-500" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-stone-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Bulk Actions Toolbar ... (same as before) */}
             <div className="sticky top-28 z-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                            onChange={toggleAll}
                            className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                        />
                        <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                            {selectedOrders.length} Selected
                        </span>
                    </div>
                    <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkAction('label')}
                            disabled={selectedOrders.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-100 hover:bg-stone-200 text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Truck className="h-3.5 w-3.5" /> {t.admin.operations.labels}
                        </button>
                        <button
                            onClick={() => handleBulkAction('invoice')}
                            disabled={selectedOrders.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-100 hover:bg-stone-200 text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5" /> {t.admin.operations.invoices}
                        </button>
                        <button
                            onClick={() => handleBulkAction('export')}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" /> {t.admin.operations.export}
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => handleBulkAction('shipped')}
                    disabled={selectedOrders.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <PackageCheck className="h-4 w-4" /> {t.admin.operations.markShipped}
                </button>
            </div>

            {/* Orders List (Using filteredOrders now) */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12 text-stone-500 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                            No orders found matching criteria.
                        </div>
                    )}
                    {filteredOrders.map((order) => {
                        const customerName = `${order.customer_details.firstName} ${order.customer_details.lastName}`;
                        const shippingCost = order.shipping_method === 'easybox' ? 12 : 19;

                        return (
                            <div
                                key={order.id}
                                className={`group relative rounded-xl border bg-white dark:bg-stone-900 p-6 transition-all duration-200 hover:shadow-md ${selectedOrders.includes(order.id) ? 'border-stone-900 dark:border-stone-50 ring-1 ring-stone-900 dark:ring-stone-50' : 'border-stone-200 dark:border-stone-800'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => toggleOrder(order.id)}
                                            className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 h-5 w-5 cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        {/* Customer Info */}
                                        <div className="lg:col-span-4 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-stone-900 dark:text-white text-lg">
                                                    {order.customer_details.customerType === 'company' ? order.customer_details.companyName : customerName}
                                                </h3>
                                                {order.customer_details.customerType === 'company' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wide border border-purple-200">
                                                        <Building2 className="h-3 w-3" /> Company
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                                                        <User className="h-3 w-3" /> Private
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-stone-500">{order.id.slice(0, 8)}... • {order.items?.length || 0} Items</p>
                                            {order.customer_details.customerType === 'company' && (
                                                <p className="text-xs font-mono text-stone-400">VAT: {order.customer_details.vatId}</p>
                                            )}
                                        </div>

                                        {/* Shipping Info */}
                                        <div className="lg:col-span-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-medium uppercase text-stone-400 tracking-wider">Shipping Method</span>
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4 text-stone-600" />
                                                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{order.shipping_method === 'easybox' ? 'Sameday Easybox' : 'FanCourier'}</span>
                                                </div>
                                                <span className="text-xs text-stone-500">Cost: {shippingCost} RON</span>
                                            </div>
                                        </div>

                                        {/* Status & Total */}
                                        <div className="lg:col-span-4 flex flex-col lg:items-end justify-between gap-2">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-2xl font-serif text-stone-900 dark:text-white">
                                                    {(order.total + shippingCost).toFixed(2)} <span className="text-sm text-stone-500">RON</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions for Individual Order */}
                                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                                    <button
                                        onClick={() => setViewOrder(order)}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-4 decoration-blue-300 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        {t.admin.operations.viewOrder}
                                    </button>
                                    <span className="text-stone-300">|</span>
                                    <button
                                        onClick={() => generateInvoice(order)}
                                        className="text-xs font-medium text-stone-500 hover:text-stone-900 hover:underline underline-offset-4 decoration-stone-300 dark:text-stone-400 dark:hover:text-white"
                                    >
                                        Invoice PDF
                                    </button>
                                    <span className="text-xs text-stone-300">|</span>
                                    <button
                                        onClick={() => generateAWB(order)}
                                        className="text-xs font-medium text-stone-500 hover:text-stone-900 hover:underline underline-offset-4 decoration-stone-300 dark:text-stone-400 dark:hover:text-white"
                                    >
                                        AWB Label
                                    </button>
                                </div>
                            </div>
                        );
                    })}
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