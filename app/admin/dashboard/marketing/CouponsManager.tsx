'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Tag } from 'lucide-react';

export default function CouponsManager() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage', // or 'fixed'
        discountValue: 10,
        minOrderAmount: 0,
        expiresAt: '',
        maxUses: '',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (Array.isArray(data)) setCoupons(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newCoupon,
                    maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : null,
                    expiresAt: newCoupon.expiresAt || null
                })
            });
            if (res.ok) {
                setNewCoupon({
                    code: '',
                    discountType: 'percentage',
                    discountValue: 10,
                    minOrderAmount: 0,
                    expiresAt: '',
                    maxUses: ''
                });
                fetchCoupons();
            } else {
                alert('Failed to create coupon');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchCoupons();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                        <Tag className="h-5 w-5" /> Coupons & Promotions
                    </h3>
                    <p className="text-sm text-stone-500">Manage discounts synced with Stripe</p>
                </div>
            </div>

            {/* Create Form */}
            <form onSubmit={handleCreate} className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-6 items-end border-b border-stone-100 pb-8 dark:border-stone-800">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">Code</label>
                    <input
                        type="text"
                        placeholder="e.g. SUMMER25"
                        required
                        value={newCoupon.code}
                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                        className="mt-1 block w-full rounded-md border-stone-300 py-2 text-sm dark:bg-stone-800 dark:border-stone-700"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">Type</label>
                    <select
                        value={newCoupon.discountType}
                        onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-stone-300 py-2 text-sm dark:bg-stone-800 dark:border-stone-700"
                    >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (RON)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">Value</label>
                    <input
                        type="number"
                        required
                        min="1"
                        value={newCoupon.discountValue}
                        onChange={e => setNewCoupon({ ...newCoupon, discountValue: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-stone-300 py-2 text-sm dark:bg-stone-800 dark:border-stone-700"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">Min Order</label>
                    <input
                        type="number"
                        min="0"
                        value={newCoupon.minOrderAmount}
                        onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-stone-300 py-2 text-sm dark:bg-stone-800 dark:border-stone-700"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">Max Uses</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="0 = Unlimited"
                        value={newCoupon.maxUses}
                        onChange={e => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                        className="mt-1 block w-full rounded-md border-stone-300 py-2 text-sm dark:bg-stone-800 dark:border-stone-700"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-stone-900 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
                <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-800">
                    <thead className="bg-stone-50 dark:bg-stone-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Min Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Usage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center text-sm text-stone-500">Loading...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-sm text-stone-500">No coupons found.</td></tr>
                        ) : (
                            coupons.map((coupon) => (
                                <tr key={coupon.id}>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-stone-900 dark:text-white">
                                        {coupon.code}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-500">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} RON`}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-500">
                                        {coupon.min_order_amount > 0 ? `${coupon.min_order_amount} RON` : '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-500">
                                        {coupon.used_count || 0} / {coupon.max_uses || '∞'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
