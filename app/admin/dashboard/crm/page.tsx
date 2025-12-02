'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Mail, Phone, Calendar, ShoppingCart, Search, Filter, Edit2, History, Building2, User } from 'lucide-react';
import { generateMockOrders } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
    id: string;
    email: string;
    name: string;
    type: 'individual' | 'company';
    companyName?: string;
    totalSpent: number;
    orderCount: number;
    lastOrderDate: string;
    phone?: string;
    notes?: string;
    address?: string;
    city?: string;
    county?: string;
    country?: string;
}

export default function CRMPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'individual' | 'company'>('individual');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [emailHistory, setEmailHistory] = useState<any[]>([]);
    const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
    const [sendingEmail, setSendingEmail] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showEmailHistory, setShowEmailHistory] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);

            let ordersToProcess: any[] = [];
            let customerDetailsMap = new Map<string, any>();

            try {
                // Fetch customer details first
                const { data: details } = await supabase
                    .from('customer_details')
                    .select('*');

                if (details) {
                    details.forEach((d: any) => customerDetailsMap.set(d.email, d));
                }

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                );

                const fetchPromise = supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                const { data: realOrders } = await Promise.race([fetchPromise, timeoutPromise]) as any;

                if (realOrders && realOrders.length > 0) {
                    ordersToProcess = realOrders;
                } else {
                    // If no orders, we might still have customer details manually added?
                    // For now, we primarily drive from orders, but we could add standalone customers.
                    // Let's stick to orders driving the list for now.
                    if (customerDetailsMap.size === 0) throw new Error("No real data or empty");
                }
            } catch (error) {
                console.log("CRM: Using mock data (Fallback active)", error);
                const mocks = generateMockOrders(30);
                ordersToProcess = mocks.map((m, i) => ({
                    id: m.id,
                    user_email: m.customer_type === 'company' ? `contact@${m.company_details?.name.replace(/\s+/g, '').toLowerCase()}.com` : `${m.customer_name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                    total_amount: m.total,
                    created_at: m.date,
                    customer_type: i % 5 === 0 ? 'company' : 'individual',
                    company_name: i % 5 === 0 ? `Art Gallery ${i}` : undefined,
                    shipping_address: {
                        firstName: m.customer_name.split(' ')[0],
                        lastName: m.customer_name.split(' ')[1] || '',
                        phone: '0744' + Math.floor(Math.random() * 1000000)
                    }
                }));
            }

            const customerMap = new Map<string, Customer>();

            // Process orders
            if (ordersToProcess.length > 0) {
                ordersToProcess.forEach((order: any) => {
                    // Extract email from customer_details (JSONB) or fallback to user_email (if legacy)
                    const email = order.customer_details?.email || order.user_email;
                    if (!email) return;

                    const existing = customerMap.get(email);
                    const details = customerDetailsMap.get(email);
                    const orderDetails = order.customer_details || {};

                    // Use details from DB if available, otherwise fallback to order data
                    const firstName = orderDetails.firstName || orderDetails.first_name || '';
                    const lastName = orderDetails.lastName || orderDetails.last_name || '';
                    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || 'Guest');

                    const name = details?.name || fullName;
                    const phone = details?.phone || orderDetails.phone;
                    const companyName = details?.company_name || orderDetails.companyName || orderDetails.company_name;
                    const notes = details?.notes || '';
                    const type = details?.type || orderDetails.customerType || 'individual';
                    const address = details?.address || orderDetails.address;
                    const city = details?.city || orderDetails.city;
                    const county = details?.county || orderDetails.county;
                    const country = details?.country || orderDetails.country;

                    if (existing) {
                        existing.totalSpent += order.total; // Migration uses 'total', not 'total_amount'
                        existing.orderCount += 1;
                        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
                            existing.lastOrderDate = order.created_at;
                        }
                    } else {
                        customerMap.set(email, {
                            id: email,
                            email,
                            name,
                            type: type === 'company' ? 'company' : 'individual',
                            companyName,
                            totalSpent: order.total, // Migration uses 'total'
                            orderCount: 1,
                            lastOrderDate: order.created_at,
                            phone,
                            notes,
                            address,
                            city,
                            county,
                            country
                        });
                    }
                });
            }

            setCustomers(Array.from(customerMap.values()));
            setLoading(false);
        };

        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.type === activeTab &&
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSaveCustomer = async (updated: Customer) => {
        try {
            const res = await fetch('/api/admin/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: updated.email,
                    name: updated.name,
                    phone: updated.phone,
                    company_name: updated.companyName,
                    notes: updated.notes,
                    address: updated.address,
                    city: updated.city,
                    county: updated.county,
                    country: updated.country
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update');
            }

            setCustomers(prev => prev.map(c => c.email === updated.email ? updated : c));
            setIsEditing(false);
            setSelectedCustomer(null);
        } catch (err) {
            console.error('Error saving customer details:', err);
            alert('Failed to save changes.');
        }
    };

    const fetchEmailHistory = async (email: string) => {
        setEmailHistory([]); // Clear previous
        try {
            const res = await fetch(`/api/admin/email/history?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setEmailHistory(data);
            }
        } catch (e) {
            console.error("Failed to fetch email history", e);
        }
    };

    const handleSendEmail = async () => {
        if (!selectedCustomer || !emailForm.subject || !emailForm.body) return;
        setSendingEmail(true);
        try {
            const res = await fetch('/api/admin/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: selectedCustomer.email,
                    subject: emailForm.subject,
                    body: emailForm.body
                })
            });

            if (res.ok) {
                alert('Email sent successfully!');
                setEmailForm({ subject: '', body: '' });
                fetchEmailHistory(selectedCustomer.email); // Refresh list
            } else {
                alert('Failed to send email.');
            }
        } catch (e) {
            console.error(e);
            alert('Error sending email.');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* ... Header and Filters ... */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Customer Relationships</h2>
                    <p className="text-stone-500">Manage your clients, companies, and view history.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'individual' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400'}`}
                    >
                        <User className="inline-block w-4 h-4 mr-2" /> Individuals
                    </button>
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'company' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400'}`}
                    >
                        <Building2 className="inline-block w-4 h-4 mr-2" /> Companies
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-500 outline-none transition-all"
                    />
                </div>
                <button className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white">
                    <Filter className="h-5 w-5" />
                </button>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name / Company</th>
                                <th className="px-6 py-3 font-medium">Contact</th>
                                <th className="px-6 py-3 font-medium">LTV</th>
                                <th className="px-6 py-3 font-medium">Orders</th>
                                <th className="px-6 py-3 font-medium">Last Active</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Loading customers...</td></tr>
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.email} className="group hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-stone-900 dark:text-white">{customer.name}</p>
                                            {customer.type === 'company' && <p className="text-xs text-stone-500 font-medium">{customer.companyName}</p>}
                                            <p className="text-xs text-stone-500 mt-1">Tier: {customer.totalSpent > 1000 ? 'Gold' : 'Silver'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => { setSelectedCustomer(customer); setShowEmailHistory(true); fetchEmailHistory(customer.email); }}
                                                    className="flex items-center gap-2 hover:text-stone-900 dark:hover:text-white transition-colors text-left"
                                                >
                                                    <Mail className="h-3 w-3" /> {customer.email}
                                                </button>
                                                {customer.phone && <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> {customer.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">
                                            {customer.totalSpent.toFixed(2)} RON
                                        </td>
                                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-xs font-medium dark:bg-stone-800">
                                                <ShoppingCart className="h-3 w-3" /> {customer.orderCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-stone-500">
                                            {new Date(customer.lastOrderDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedCustomer(customer); setShowEmailHistory(true); fetchEmailHistory(customer.email); }}
                                                    className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
                                                    title="Email History"
                                                >
                                                    <History className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedCustomer(customer); setIsEditing(true); }}
                                                    className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
                                                    title="Edit Details"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-stone-500">No customers found matching filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && selectedCustomer && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b border-stone-100 dark:border-stone-800">
                                <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-white">Edit Customer</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={selectedCustomer.name}
                                        onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                                        className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                    />
                                </div>
                                {selectedCustomer.type === 'company' && (
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={selectedCustomer.companyName || ''}
                                            onChange={(e) => setSelectedCustomer({ ...selectedCustomer, companyName: e.target.value })}
                                            className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={selectedCustomer.phone || ''}
                                        onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                                        className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Address</label>
                                        <input
                                            type="text"
                                            value={selectedCustomer.address || ''}
                                            onChange={(e) => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })}
                                            className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={selectedCustomer.city || ''}
                                            onChange={(e) => setSelectedCustomer({ ...selectedCustomer, city: e.target.value })}
                                            className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">County</label>
                                        <input
                                            type="text"
                                            value={selectedCustomer.county || ''}
                                            onChange={(e) => setSelectedCustomer({ ...selectedCustomer, county: e.target.value })}
                                            className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={selectedCustomer.country || ''}
                                            onChange={(e) => setSelectedCustomer({ ...selectedCustomer, country: e.target.value })}
                                            className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Notes</label>
                                    <textarea
                                        value={selectedCustomer.notes || ''}
                                        onChange={(e) => setSelectedCustomer({ ...selectedCustomer, notes: e.target.value })}
                                        className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white h-24 resize-none"
                                        placeholder="Internal notes..."
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSaveCustomer(selectedCustomer)}
                                    className="px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Email History & Compose Modal */}
            <AnimatePresence>
                {showEmailHistory && selectedCustomer && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center shrink-0">
                                <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-white">Email History: {selectedCustomer.name}</h3>
                                <button onClick={() => setShowEmailHistory(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-white">✕</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                                    {emailHistory.length === 0 && <div className="p-8 text-center text-stone-500">No history available.</div>}
                                    {emailHistory.map((email) => (
                                        <div key={email.id} className="p-6 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-medium text-stone-900 dark:text-white">{email.subject}</span>
                                                <span className="text-sm text-stone-500">{new Date(email.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-stone-600 dark:text-stone-400 mb-2 whitespace-pre-wrap">
                                                {email.body}
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/20 dark:text-green-400 capitalize">{email.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 shrink-0 space-y-3">
                                <h4 className="text-sm font-medium text-stone-900 dark:text-white">Reply / New Message</h4>
                                <input
                                    type="text"
                                    placeholder="Subject"
                                    value={emailForm.subject}
                                    onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                                    className="w-full rounded-lg border-stone-300 p-2 text-sm dark:bg-stone-900 dark:border-stone-700"
                                />
                                <textarea 
                                    placeholder="Message..."
                                    value={emailForm.body}
                                    onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
                                    className="w-full rounded-lg border-stone-300 p-2 text-sm min-h-[80px] dark:bg-stone-900 dark:border-stone-700"
                                />
                                <button
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail}
                                    className="w-full py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                                >
                                    {sendingEmail ? 'Sending...' : 'Send Email'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}