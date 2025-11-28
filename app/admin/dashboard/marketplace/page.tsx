'use client';

import { Check, X, Eye } from 'lucide-react';

export default function MarketplacePage() {
    // Mock Data
    const submissions = [
        { id: 1, artist: 'Elena Popa', item: 'Vintage Peasant Girl', price: '450 RON', date: '2 hours ago', status: 'pending' },
        { id: 2, artist: 'Ioan Radu', item: 'Mountain Lake', price: '1200 RON', date: '1 day ago', status: 'pending' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Marketplace Approvals</h2>
                <p className="text-stone-500">Review submissions from community artists.</p>
            </div>

            {/* Fee Summary */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-sm text-stone-500">Platform Fees (This Month)</p>
                    <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">450 RON</p>
                </div>
                 <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                    <p className="text-sm text-stone-500">Pending Payouts</p>
                    <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">2,100 RON</p>
                </div>
            </div>

            {/* Approval List */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">Artist</th>
                            <th className="px-6 py-3 font-medium">Artwork</th>
                            <th className="px-6 py-3 font-medium">Price</th>
                            <th className="px-6 py-3 font-medium">Submitted</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                        {submissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">{sub.artist}</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{sub.item}</td>
                                <td className="px-6 py-4 text-stone-900 dark:text-white">{sub.price}</td>
                                <td className="px-6 py-4 text-stone-500">{sub.date}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
