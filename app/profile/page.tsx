'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Store, User, LogOut, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/app/context/LanguageContext';

type Order = {
    id: string;
    created_at: string;
    total: number;
    status: string;
    payment_method: string;
    order_items: { name: string; quantity: number }[];
};

type Listing = {
    id: string;
    title: string;
    price: number;
    status: string;
    image_url: string;
};

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const { t } = useLanguage();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'listings'>('orders');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    router.push('/login?returnUrl=/profile');
                    return;
                }
                setUser(user);

                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);

                // Fetch Orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*, order_items(name, quantity)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                setOrders(ordersData || []);

                // Fetch Listings
                const { data: listingsData } = await supabase
                    .from('marketplace_listings')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                setListings(listingsData || []);

            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="font-serif text-4xl text-stone-900 dark:text-white">{t.profile.title}</h1>
                        <p className="mt-2 text-stone-500 dark:text-stone-400">{t.profile.welcome} {profile?.full_name || user?.email}</p>
                    </div>
                    <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors dark:border-stone-800 dark:text-stone-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                        <LogOut className="h-4 w-4" />
                        {t.profile.signOut}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                activeTab === 'orders' 
                                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' 
                                : 'bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                            }`}
                        >
                            <Package className="h-5 w-5" />
                            {t.profile.history}
                        </button>
                        <button
                            onClick={() => setActiveTab('listings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                activeTab === 'listings' 
                                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' 
                                : 'bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                            }`}
                        >
                            <Store className="h-5 w-5" />
                            {t.profile.myListings}
                        </button>
                        <Link 
                            href="/sell"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-stone-100 text-stone-900 hover:bg-stone-200 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 transition-colors mt-4"
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-xs font-bold">+</div>
                            {t.profile.newListing}
                        </Link>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'orders' ? (
                                <div className="space-y-4">
                                    <h2 className="font-serif text-2xl text-stone-900 dark:text-white mb-6">{t.profile.history}</h2>
                                    {orders.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                                            <Package className="h-12 w-12 mx-auto text-stone-300 mb-4" />
                                            <p className="text-stone-500">{t.profile.noOrders}</p>
                                            <Link href="/shop" className="text-stone-900 dark:text-white underline mt-2 inline-block">{t.profile.startShopping}</Link>
                                        </div>
                                    ) : (
                                        orders.map((order) => (
                                            <div key={order.id} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
                                                <div className="flex flex-wrap justify-between gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-stone-500 uppercase tracking-wider">Order ID</p>
                                                        <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-stone-500 uppercase tracking-wider">Date</p>
                                                        <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-stone-500 uppercase tracking-wider">Total</p>
                                                        <p className="font-medium">{order.total} RON</p>
                                                    </div>
                                                    <div>
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                            order.status === 'paid' || order.status === 'completed' 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                            {order.status === 'paid' || order.status === 'completed' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
                                                    <p className="text-sm text-stone-500 mb-2">Items:</p>
                                                    <ul className="list-disc list-inside text-sm text-stone-700 dark:text-stone-300">
                                                        {order.order_items.map((item: any, i: number) => (
                                                            <li key={i}>{item.quantity}x {item.name}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h2 className="font-serif text-2xl text-stone-900 dark:text-white mb-6">{t.profile.myListings}</h2>
                                    {listings.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                                            <Store className="h-12 w-12 mx-auto text-stone-300 mb-4" />
                                            <p className="text-stone-500">{t.profile.noListings}</p>
                                            <Link href="/sell" className="text-stone-900 dark:text-white underline mt-2 inline-block">{t.profile.sellArt}</Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {listings.map((listing) => (
                                                <div key={listing.id} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden group">
                                                    <div className="aspect-square relative bg-stone-100">
                                                        <img src={listing.image_url} alt={listing.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                                        <div className="absolute top-2 right-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${
                                                                listing.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {listing.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-serif font-medium text-stone-900 dark:text-white truncate">{listing.title}</h3>
                                                        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{listing.price} RON</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}