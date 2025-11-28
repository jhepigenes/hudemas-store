'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, Package, DollarSign, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SellerDashboard() {
    const supabase = createClient();
    const router = useRouter();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalListings: 0,
        activeListings: 0,
        totalValue: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                router.push('/login?returnUrl=/marketplace/dashboard');
                return;
            }

            const { data, error } = await supabase
                .from('marketplace_listings')
                .select('*')
                .eq('artist_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching listings:', error);
            } else {
                setListings(data || []);
                
                // Calculate Stats
                const totalListings = data?.length || 0;
                const activeListings = data?.filter((l: any) => l.status === 'active').length || 0;
                const totalValue = data?.reduce((acc: number, curr: any) => acc + (curr.price || 0), 0) || 0;

                setStats({
                    totalListings,
                    activeListings,
                    totalValue
                });
            }
            setLoading(false);
        };

        fetchData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <h1 className="font-serif text-4xl text-stone-900 dark:text-stone-50 mb-2">Seller Dashboard</h1>
                        <p className="font-sans text-stone-600 dark:text-stone-300">Manage your collection and track your listings.</p>
                    </div>
                    <Link
                        href="/marketplace/sell"
                        className="inline-flex items-center gap-2 bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 px-6 py-3 rounded-full font-sans font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Listing
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 }}
                        className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-stone-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-stone-900" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-serif text-stone-900 dark:text-stone-50 mb-1">{stats.totalValue.toFixed(2)} RON</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 font-sans">Total Inventory Value</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-stone-100 rounded-lg">
                                <Package className="w-6 h-6 text-stone-900" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-serif text-stone-900 dark:text-stone-50 mb-1">{stats.activeListings}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 font-sans">Active Listings</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-stone-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-stone-900" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-serif text-stone-900 dark:text-stone-50 mb-1">{stats.totalListings}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 font-sans">Total Submissions</p>
                    </motion.div>
                </div>

                {/* Listings Table */}
                <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 dark:border-stone-800">
                        <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-50">Your Listings</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-stone-50 dark:bg-stone-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans">Item</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {listings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                                            No listings found. <Link href="/marketplace/sell" className="text-stone-900 dark:text-stone-50 underline">Create your first one.</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    listings.map((item) => (
                                        <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 flex-shrink-0 relative rounded-md overflow-hidden bg-stone-200">
                                                        {item.image_url && (
                                                            <Image
                                                                src={item.image_url}
                                                                alt={item.title}
                                                                fill
                                                                sizes="48px"
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-stone-900 dark:text-stone-50 font-serif">{item.title}</div>
                                                        <div className="text-sm text-stone-500 dark:text-stone-400 font-sans">ID: #{item.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${item.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        item.status === 'sold' ? 'bg-stone-100 text-stone-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                    {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-stone-50 font-sans">
                                                {item.price} RON
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-sans">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-stone-900 dark:text-stone-50 hover:text-stone-600 dark:hover:text-stone-300 font-sans">Edit</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
