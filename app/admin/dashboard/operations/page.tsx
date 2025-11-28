'use client';

import { useState, useEffect } from 'react';
import { Printer, FileText, PackageCheck, Truck, Building2, User, Filter, Calendar, Download } from 'lucide-react';
import { generateMockOrders, MockOrder } from '@/lib/mock-data';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DailyOperationsPage() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<MockOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            const mocks = generateMockOrders(12);
            const sorted = mocks.sort((a, b) => (a.status === 'pending' ? -1 : 1));
            setOrders(sorted);
            setLoading(false);
        }, 600);
    }, [selectedDate]);

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

    const generateInvoice = (order: MockOrder) => {
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
        doc.text(`Seria HUD Nr. ${order.id.split('-')[1]}`, 140, 28);
        doc.text(`Data: ${order.date}`, 140, 33);
        
        // Customer Info (Box)
        doc.rect(14, 60, 182, 25);
        doc.setFontSize(9);
        doc.text('Client:', 16, 65);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        if (order.customer_type === 'company' && order.company_details) {
            doc.text(order.company_details.name, 16, 72);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`CUI: ${order.company_details.vatId}`, 16, 78);
            doc.text(`Adresa: Romania`, 16, 82);
        } else {
            doc.text(order.customer_name, 16, 72);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Persoana Fizica', 16, 78);
        }

        // Items Table
        const net = order.total / 1.19;
        const vat = order.total - net;
        
        autoTable(doc, {
            startY: 95,
            head: [['Denumire Produs / Serviciu', 'U.M.', 'Cant.', 'Pret Unitar', 'Valoare', 'TVA (19%)']],
            body: [
                ['Gobelin Kit / Tapestry', 'buc', order.items, `${(net / order.items).toFixed(2)}`, `${net.toFixed(2)}`, `${vat.toFixed(2)}`],
                ['Taxa Livrare', 'serv', '1', `${order.shipping_cost}`, `${order.shipping_cost}`, '0.00']
            ],
            foot: [['', '', '', 'Total de Plata:', '', `${(order.total + order.shipping_cost).toFixed(2)} RON`]],
            theme: 'grid',
            headStyles: { fillColor: [20, 20, 20] },
        });

        // Signature area
        doc.text('Intocmit de: Administrator', 14, 250);
        doc.text('Semnatura si stampila', 14, 255);

        doc.save(`Factura_${order.id}.pdf`);
    };

    const generateAccountantExport = () => {
        const ordersToExport = selectedOrders.length > 0 
            ? orders.filter(o => selectedOrders.includes(o.id))
            : orders;

        const csvRows = [
            ['Data', 'Numar Factura', 'Client', 'CUI/CNP', 'Valoare Neta', 'TVA', 'Total'],
            ...ordersToExport.map(o => {
                const net = (o.total / 1.19).toFixed(2);
                const vat = (o.total - (o.total / 1.19)).toFixed(2);
                const clientName = o.customer_type === 'company' ? o.company_details?.name : o.customer_name;
                const cui = o.customer_type === 'company' ? o.company_details?.vatId : '-';
                
                // Simplified string creation to avoid syntax errors
                return [
                    o.date,
                    'HUD-' + o.id.split('-')[1],
                    '"' + clientName + '"',
                    cui,
                    net,
                    vat,
                    (o.total + o.shipping_cost).toFixed(2)
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

    const generateAWB = (order: MockOrder) => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 150] });
        doc.rect(2, 2, 146, 96);
        doc.setFontSize(16);
        doc.text(order.shipping_method.split(' ')[0].toUpperCase(), 5, 10);
        doc.setFillColor(0, 0, 0);
        doc.rect(5, 15, 80, 15, 'F');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`AWB: ${order.id}999`, 5, 34);
        doc.setFontSize(6);
        doc.text('FROM: Hudemas Art', 5, 45);
        doc.text('Str. Principala 1, Bucuresti', 5, 48);
        doc.setFontSize(10);
        doc.text('TO:', 5, 60);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        if (order.customer_type === 'company' && order.company_details) {
            doc.text(order.company_details.name, 5, 66);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Attn: ${order.customer_name}`, 5, 71);
        } else {
            doc.text(order.customer_name, 5, 66);
        }
        doc.setFontSize(10);
        doc.text(order.shipping_method.includes('EasyBox') ? 'LOCKER DELIVERY' : 'HOME DELIVERY', 100, 90);
        doc.save(`AWB_${order.id}.pdf`);
    };

    const handleBulkAction = (action: string) => {
        if (action === 'Export Accounting') {
            generateAccountantExport();
            return;
        }

        if (selectedOrders.length === 0) return;
        const ordersToProcess = orders.filter(o => selectedOrders.includes(o.id));
        
        if (action.includes('Invoice')) {
            ordersToProcess.forEach(o => generateInvoice(o));
            alert(`Generated ${ordersToProcess.length} Invoices`);
        } else if (action.includes('Label')) {
            ordersToProcess.forEach(o => generateAWB(o));
            alert(`Generated ${ordersToProcess.length} AWB Labels`);
        } else {
            alert(`${action} for ${selectedOrders.length} orders initiated.`);
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
                    <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white">Daily Operations</h2>
                    <p className="text-stone-500">Prepare shipments, print invoices, and manage logistics for the day.</p>
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
                            onClick={() => handleBulkAction('Printing AWB Labels')}
                            disabled={selectedOrders.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-100 hover:bg-stone-200 text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Truck className="h-3.5 w-3.5" /> Labels
                        </button>
                        <button 
                            onClick={() => handleBulkAction('Printing Tax Invoices')}
                            disabled={selectedOrders.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-100 hover:bg-stone-200 text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5" /> Invoices
                        </button>
                        <button 
                            onClick={() => handleBulkAction('Export Accounting')}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" /> Export Accounting CSV
                        </button>
                    </div>
                </div>
                <button 
                    onClick={() => handleBulkAction('Marking as Shipped')}
                    disabled={selectedOrders.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <PackageCheck className="h-4 w-4" /> Mark as Shipped
                </button>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div 
                            key={order.id}
                            className={`group relative rounded-xl border bg-white dark:bg-stone-900 p-6 transition-all duration-200 hover:shadow-md ${ 
                                selectedOrders.includes(order.id) ? 'border-stone-900 dark:border-stone-50 ring-1 ring-stone-900 dark:ring-stone-50' : 'border-stone-200 dark:border-stone-800'
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
                                                {order.customer_type === 'company' ? order.company_details?.name : order.customer_name}
                                            </h3>
                                            {order.customer_type === 'company' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wide border border-purple-200">
                                                    <Building2 className="h-3 w-3" /> Company
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                                                    <User className="h-3 w-3" /> Private
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-stone-500">{order.id} • {order.items} Items</p>
                                        {order.customer_type === 'company' && (
                                            <p className="text-xs font-mono text-stone-400">VAT: {order.company_details?.vatId}</p>
                                        )}
                                    </div>

                                    {/* Shipping Info */}
                                    <div className="lg:col-span-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium uppercase text-stone-400 tracking-wider">Shipping Method</span>
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-stone-600" />
                                                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{order.shipping_method}</span>
                                            </div>
                                            <span className="text-xs text-stone-500">Cost: {order.shipping_cost === 0 ? 'FREE' : `${order.shipping_cost} RON`}</span>
                                        </div>
                                    </div>

                                    {/* Status & Total */}
                                    <div className="lg:col-span-4 flex flex-col lg:items-end justify-between gap-2">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-2xl font-serif text-stone-900 dark:text-white">
                                                {order.total.toFixed(2)} <span className="text-sm text-stone-500">RON</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions for Individual Order */}
                            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button className="text-xs font-medium text-stone-500 hover:text-stone-900 hover:underline underline-offset-4 decoration-stone-300">
                                    View Order Details
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
                    ))}
                </div>
            )}
        </div>
    );
}
