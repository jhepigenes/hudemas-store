'use client';

import { useState, useEffect } from 'react';
import { Printer, FileText, PackageCheck, Truck, Building2, User, Filter, Calendar, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/lib/supabase';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
}

interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    total: number;
    currency: string;
    payment_method: string;
    shipping_method: string;
    customer_details: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        county: string;
        customerType: 'private' | 'company';
        companyName?: string;
        vatId?: string;
    };
    items?: OrderItem[];
}

export default function DailyOperationsPage() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const { t } = useLanguage();
    const supabase = createClient();

    useEffect(() => {
        fetchOrders();
    }, [selectedDate]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch orders for the selected date (ignoring time for simplicity in this demo, or fetch all recent)
            // For now, let's fetch all orders to ensure we see the one we just created
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    items:order_items(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
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
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map(o => o.id));
        }
    };

    const generateInvoice = (order: Order) => {
        const doc = new jsPDF();

        // Supplier Info (Left)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('HUDEMAS ART S.R.L.', 14, 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Reg. Com.: J40/123/1991', 14, 25);
        doc.text('CIF: RO12345678', 14, 30);
        doc.text('Capital Social: 200 RON', 14, 35);
        doc.text('Sediul: Str. Principala 1, Bucuresti', 14, 40);
        doc.text('IBAN: RO99 BTRL 0000 0000 0000 0000', 14, 45);
        doc.text('Banca: Banca Transilvania', 14, 50);

        // Invoice Info (Right)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('FACTURA FISCALA', 140, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seria HUD Nr. ${order.id.slice(0, 8)}`, 140, 28);
        doc.text(`Data: ${new Date(order.created_at).toLocaleDateString()}`, 140, 33);

        // Customer Info (Box)
        doc.rect(14, 60, 182, 25);
        doc.setFontSize(9);
        doc.text('Client:', 16, 65);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');

        const customerName = `${order.customer_details.firstName} ${order.customer_details.lastName}`;

        if (order.customer_details.customerType === 'company') {
            doc.text(order.customer_details.companyName || customerName, 16, 72);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`CUI: ${order.customer_details.vatId || '-'}`, 16, 78);
            doc.text(`Adresa: ${order.customer_details.city}, ${order.customer_details.county}`, 16, 82);
        } else {
            doc.text(customerName, 16, 72);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Persoana Fizica', 16, 78);
            doc.text(`Adresa: ${order.customer_details.city}, ${order.customer_details.county}`, 16, 82);
        }

        // Items Table
        const shippingCost = order.shipping_method === 'easybox' ? 12 : 19;
        const net = order.total / 1.19;
        const vat = order.total - net;

        const tableBody = order.items?.map(item => [
            item.name,
            'buc',
            item.quantity.toString(),
            item.price.toFixed(2),
            (item.price * item.quantity).toFixed(2),
            ((item.price * item.quantity) * 0.19).toFixed(2)
        ]) || [];

        tableBody.push(['Taxa Livrare', 'serv', '1', shippingCost.toFixed(2), shippingCost.toFixed(2), (shippingCost * 0.19).toFixed(2)]);

        autoTable(doc, {
            startY: 95,
            head: [['Denumire Produs / Serviciu', 'U.M.', 'Cant.', 'Pret Unitar', 'Valoare', 'TVA (19%)']],
            body: tableBody,
            foot: [['', '', '', 'Total de Plata:', '', `${(order.total + shippingCost).toFixed(2)} RON`]],
            theme: 'grid',
            headStyles: { fillColor: [20, 20, 20] },
        });

        // Signature area
        doc.text('Intocmit de: Administrator', 14, 250);
        doc.text('Semnatura si stampila', 14, 255);

        doc.save(`Factura_${order.id.slice(0, 8)}.pdf`);
    };

    const generateAccountantExport = () => {
        const ordersToExport = selectedOrders.length > 0
            ? orders.filter(o => selectedOrders.includes(o.id))
            : orders;

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

    const generateAWB = (order: Order) => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 150] });
        doc.rect(2, 2, 146, 96);
        doc.setFontSize(16);
        doc.text(order.shipping_method === 'easybox' ? 'EASYBOX' : 'FANCOURIER', 5, 10);
        doc.setFillColor(0, 0, 0);
        doc.rect(5, 15, 80, 15, 'F');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`AWB: ${order.id.slice(0, 8)}999`, 5, 34);
        doc.setFontSize(6);
        doc.text('FROM: Hudemas Art', 5, 45);
        doc.text('Str. Principala 1, Bucuresti', 5, 48);
        doc.setFontSize(10);
        doc.text('TO:', 5, 60);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');

        const customerName = `${order.customer_details.firstName} ${order.customer_details.lastName}`;

        if (order.customer_details.customerType === 'company') {
            doc.text(order.customer_details.companyName || '', 5, 66);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Attn: ${customerName}`, 5, 71);
        } else {
            doc.text(customerName, 5, 66);
        }

        doc.setFontSize(10);
        doc.text(order.shipping_method === 'easybox' ? 'LOCKER DELIVERY' : 'HOME DELIVERY', 100, 90);
        doc.save(`AWB_${order.id.slice(0, 8)}.pdf`);
    };

    const markAsShipped = async (ids: string[]) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'completed' })
                .in('id', ids);

            if (error) throw error;

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    ids.includes(order.id)
                        ? { ...order, status: 'completed' }
                        : order
                )
            );
            setSelectedOrders([]);
            alert(`${t.admin.operations.markShipped} (${ids.length})`);
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
        const ordersToProcess = orders.filter(o => selectedOrders.includes(o.id));

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

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white">{t.admin.operations.title}</h2>
                    <p className="text-stone-500">{t.admin.operations.subtitle}</p>
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

            {/* Bulk Actions Toolbar */}
            <div className="sticky top-28 z-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={orders.length > 0 && selectedOrders.length === orders.length}
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

            {/* Orders List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const customerName = `${order.customer_details.firstName} ${order.customer_details.lastName}`;
                        const shippingCost = order.shipping_method === 'easybox' ? 12 : 19;

                        return (
                            <div
                                key={order.id}
                                className={`group relative rounded-xl border bg-white dark:bg-stone-900 p-6 transition-all duration-200 hover:shadow-md ${selectedOrders.includes(order.id) ? 'border-stone-900 dark:border-stone-50 ring-1 ring-stone-900 dark:ring-stone-50' : 'border-stone-200 dark:border-stone-800'
                                    }`}
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
                                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setViewOrder(order)}
                                        className="text-xs font-medium text-stone-500 hover:text-stone-900 hover:underline underline-offset-4 decoration-stone-300"
                                    >
                                        {t.admin.operations.viewOrder}
                                    </button>
                                    <span className="text-stone-300">|</span>
                                    <button
                                        onClick={() => generateInvoice(order)}
                                        className="text-xs font-medium text-stone-500 hover:text-stone-900 hover:underline underline-offset-4 decoration-stone-300"
                                    >
                                        Invoice PDF
                                    </button>
                                    <span className="text-stone-300">|</span>
                                    <button
                                        onClick={() => generateAWB(order)}
                                        className="text-xs font-medium text-stone-500 hover:text-stone-900 hover:underline underline-offset-4 decoration-stone-300"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-xl shadow-xl p-6 border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-white">Order Details</h3>
                                <p className="text-sm text-stone-500">ID: {viewOrder.id}</p>
                            </div>
                            <button onClick={() => setViewOrder(null)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-2">Customer</h4>
                                <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-lg text-sm">
                                    <p className="font-medium text-stone-900 dark:text-white">{viewOrder.customer_details.firstName} {viewOrder.customer_details.lastName}</p>
                                    <p className="text-stone-500">{viewOrder.customer_details.email}</p>
                                    <p className="text-stone-500">{viewOrder.customer_details.phone}</p>
                                    {viewOrder.customer_details.customerType === 'company' && (
                                        <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                                            <p className="font-medium">{viewOrder.customer_details.companyName}</p>
                                            <p className="text-stone-500">CUI: {viewOrder.customer_details.vatId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-2">Shipping & Payment</h4>
                                <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-lg text-sm">
                                    <p><span className="text-stone-500">Method:</span> {viewOrder.shipping_method}</p>
                                    <p><span className="text-stone-500">Address:</span> {viewOrder.customer_details.address}, {viewOrder.customer_details.city}</p>
                                    <p className="mt-2"><span className="text-stone-500">Payment:</span> {viewOrder.payment_method}</p>
                                    <p><span className="text-stone-500">Status:</span> <span className="uppercase">{viewOrder.status}</span></p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-2">Order Items</h4>
                            <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Item</th>
                                            <th className="px-4 py-2 font-medium text-right">Qty</th>
                                            <th className="px-4 py-2 font-medium text-right">Price</th>
                                            <th className="px-4 py-2 font-medium text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                        {viewOrder.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-stone-900 dark:text-white">{item.name}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right">{item.price.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-medium">{(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}

                                        <tr>
                                            <td className="px-4 py-3 text-stone-500">Shipping</td>
                                            <td className="px-4 py-3 text-right">-</td>
                                            <td className="px-4 py-3 text-right">{(viewOrder.shipping_method === 'easybox' ? 12 : 19).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">{(viewOrder.shipping_method === 'easybox' ? 12 : 19).toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-stone-50 dark:bg-stone-800/50 font-bold">
                                            <td className="px-4 py-3" colSpan={3}>Total</td>
                                            <td className="px-4 py-3 text-right">{(viewOrder.total + (viewOrder.shipping_method === 'easybox' ? 12 : 19)).toFixed(2)} RON</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => generateInvoice(viewOrder)}
                                className="px-4 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-sm font-medium transition-colors"
                            >
                                Download Invoice
                            </button>
                            <button
                                onClick={() => generateAWB(viewOrder)}
                                className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-colors"
                            >
                                Generate AWB
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
