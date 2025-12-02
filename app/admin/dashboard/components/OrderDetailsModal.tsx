'use client';

import { X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/app/context/LanguageContext';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
}

export interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'pending_payment';
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
    user_email?: string;
}

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onRefund?: (orderId: string) => Promise<void>;
    onUpdateStatus?: (orderId: string, status: string) => Promise<void>;
}

export const generateInvoice = (order: Order) => {
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

export const generateAWB = (order: Order) => {
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

export default function OrderDetailsModal({ order, onClose, onRefund, onUpdateStatus }: OrderDetailsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-xl shadow-xl p-6 border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-white">Order Details</h3>
                        <p className="text-sm text-stone-500">ID: {order.id}</p>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-2">Customer</h4>
                        <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-lg text-sm text-stone-600 dark:text-stone-300">
                            <p className="font-medium text-stone-900 dark:text-white">{order.customer_details.firstName} {order.customer_details.lastName}</p>
                            <p>{order.customer_details.email}</p>
                            <p>{order.customer_details.phone}</p>
                            {order.customer_details.customerType === 'company' && (
                                <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                                    <p className="font-medium">{order.customer_details.companyName}</p>
                                    <p>CUI: {order.customer_details.vatId}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-2">Shipping & Payment</h4>
                        <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-lg text-sm text-stone-600 dark:text-stone-300">
                            <p><span className="text-stone-500">Method:</span> {order.shipping_method}</p>
                            <p><span className="text-stone-500">Address:</span> {order.customer_details.address}, {order.customer_details.city}</p>
                            <p className="mt-2"><span className="text-stone-500">Payment:</span> {order.payment_method}</p>
                            <p><span className="text-stone-500">Status:</span> <span className="uppercase">{order.status}</span></p>
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
                                {order.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-stone-900 dark:text-white">{item.name}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-stone-600 dark:text-stone-300">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-stone-600 dark:text-stone-300">{item.price.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-stone-900 dark:text-white">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}

                                <tr className="text-stone-600 dark:text-stone-300">
                                    <td className="px-4 py-3">Shipping</td>
                                    <td className="px-4 py-3 text-right">-</td>
                                    <td className="px-4 py-3 text-right">{(order.shipping_method === 'easybox' ? 12 : 19).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">{(order.shipping_method === 'easybox' ? 12 : 19).toFixed(2)}</td>
                                </tr>
                                <tr className="bg-stone-50 dark:bg-stone-800/50 font-bold text-stone-900 dark:text-white">
                                    <td className="px-4 py-3" colSpan={3}>Total</td>
                                    <td className="px-4 py-3 text-right">{(order.total + (order.shipping_method === 'easybox' ? 12 : 19)).toFixed(2)} RON</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    {order.status !== 'refunded' && order.status !== 'cancelled' && onRefund && (
                        <button
                            onClick={() => onRefund(order.id)}
                            className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                            Refund
                        </button>
                    )}
                    
                    <button
                        onClick={() => generateInvoice(order)}
                        className="px-4 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-800 text-sm font-medium transition-colors"
                    >
                        Download Invoice
                    </button>

                    {(order.status === 'pending' || order.status === 'pending_payment') && onUpdateStatus ? (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'processing')}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                        >
                            Mark Payment Received
                        </button>
                    ) : (order.status === 'processing' || order.status === 'completed') && (
                        <button
                            onClick={() => generateAWB(order)}
                            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 text-sm font-medium transition-colors"
                        >
                            Generate AWB
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}