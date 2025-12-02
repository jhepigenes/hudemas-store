'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Store, User, LogOut, Clock, CheckCircle, XCircle, Edit2, FileText, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/app/context/LanguageContext';
import jsPDF from 'jspdf';

type Order = {
    id: string;
    created_at: string;
    total: number;
    status: string;
    payment_method: string;
    order_items: { name: string; quantity: number; price?: number }[];
};

type Listing = {
    id: string;
    title: string;
    price: number;
    status: string;
    image_url: string;
};

function ProfileContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOnboarding = searchParams.get('onboarding') === 'true';
    
    const { t } = useLanguage();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'listings'>('orders');
    
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: '',
        address: '',
        city: '',
        county: '',
        country: '',
        zip_code: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOnboarding) {
            setIsEditing(true);
        }
    }, [isOnboarding]);

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
                if (profileData) {
                    setEditForm({
                        full_name: profileData.full_name || '',
                        phone: profileData.phone || '',
                        address: profileData.address || '',
                        city: profileData.city || '',
                        county: profileData.county || '',
                        country: profileData.country || '',
                        zip_code: profileData.zip_code || ''
                    });
                }

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

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/profile/reset-password`,
            });
            if (error) throw error;
            alert('Password reset email sent! Check your inbox.');
        } catch (error: any) {
            console.error('Error sending reset email:', error);
            alert('Error sending reset email: ' + error.message);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) throw new Error('Failed to update');

            // Refresh profile locally
            setProfile((prev: any) => ({ ...prev, ...editForm }));
            setIsEditing(false);
            
            if (isOnboarding) {
                router.push('/profile'); // Clear param
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (isOnboarding && (!editForm.full_name || !editForm.phone || !editForm.address)) {
            if (!confirm('You must complete your profile to continue shopping. Are you sure you want to cancel?')) {
                return;
            }
        }
        setIsEditing(false);
        if (isOnboarding) router.push('/'); // Or logout? Default to home.
    };

    const downloadInvoice = (order: Order) => {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("HUDEMAS", 105, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("INVOICE", 105, 30, { align: "center" });
        
        doc.text(`Order ID: ${order.id}`, 20, 50);
        doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 60);
        doc.text(`Customer: ${profile?.full_name || user.email}`, 20, 70);
        doc.text(`Address: ${profile?.address || ''}, ${profile?.city || ''}`, 20, 80);
        
        let y = 100;
        doc.line(20, y, 190, y);
        y += 10;
        
        doc.setFont("helvetica", "bold");
        doc.text("Item", 20, y);
        doc.text("Qty", 150, y);
        
        y += 10;
        doc.setFont("helvetica", "normal");
        
        order.order_items.forEach(item => {
            const title = item.name.length > 50 ? item.name.substring(0, 50) + '...' : item.name;
            doc.text(title, 20, y);
            doc.text(item.quantity.toString(), 150, y);
            y += 10;
        });
        
        y += 10;
        doc.line(20, y, 190, y);
        y += 10;
        
        doc.setFont("helvetica", "bold");
        doc.text(`Total: ${order.total} RON`, 150, y);
        
        doc.save(`Invoice_${order.id.slice(0, 8)}.pdf`);
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
                        <div className="flex items-center gap-3 mt-2">
                            <p className="text-stone-500 dark:text-stone-400">{t.profile.welcome} {profile?.full_name || user?.email}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 shadow-sm text-sm font-medium"
                        >
                            <Edit2 className="h-4 w-4" /> Edit Profile
                        </button>
                        <button 
                            onClick={handlePasswordReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 text-sm font-medium"
                        >
                            <Lock className="h-4 w-4" /> Reset Password
                        </button>
                        <button 
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors dark:border-stone-800 dark:text-stone-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-sm font-medium"
                        >
                            <LogOut className="h-4 w-4" />
                            {t.profile.signOut}
                        </button>
                    </div>
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
                                                <div className="border-t border-stone-100 dark:border-stone-800 pt-4 flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm text-stone-500 mb-2">Items:</p>
                                                        <ul className="list-disc list-inside text-sm text-stone-700 dark:text-stone-300">
                                                            {order.order_items.map((item: any, i: number) => (
                                                                <li key={i}>{item.quantity}x {item.name}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <button 
                                                        onClick={() => downloadInvoice(order)}
                                                        className="text-xs flex items-center gap-1 text-blue-600 hover:underline mt-2"
                                                    >
                                                        <FileText className="h-3 w-3" /> Invoice
                                                    </button>
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

                {/* Edit Profile Modal */}
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                            >
                                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                                    <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-white">Edit Profile</h3>
                                    {!isOnboarding && <button onClick={handleCancelEdit} className="text-stone-400 hover:text-stone-900 dark:hover:text-white"><X className="h-5 w-5" /></button>}
                                </div>
                                <form onSubmit={handleSaveProfile}>
                                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                        {isOnboarding && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-600 dark:text-blue-400 mb-4">
                                                Please complete your profile to continue. All fields marked with * are mandatory.
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Full Name *</label>
                                            <input 
                                                type="text"
                                                value={editForm.full_name}
                                                onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                                                className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Phone *</label>
                                            <input 
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                                className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Address *</label>
                                            <input 
                                                type="text"
                                                value={editForm.address}
                                                onChange={e => setEditForm({...editForm, address: e.target.value})}
                                                className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">City</label>
                                                <input 
                                                    type="text"
                                                    value={editForm.city}
                                                    onChange={e => setEditForm({...editForm, city: e.target.value})}
                                                    className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">County</label>
                                                <input 
                                                    type="text"
                                                    value={editForm.county}
                                                    onChange={e => setEditForm({...editForm, county: e.target.value})}
                                                    className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Country</label>
                                                <input 
                                                    type="text"
                                                    value={editForm.country}
                                                    onChange={e => setEditForm({...editForm, country: e.target.value})}
                                                    className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Zip Code</label>
                                                <input 
                                                    type="text"
                                                    value={editForm.zip_code}
                                                    onChange={e => setEditForm({...editForm, zip_code: e.target.value})}
                                                    className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                                        {!isOnboarding && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}